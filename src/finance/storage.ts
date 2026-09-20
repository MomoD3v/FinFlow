import { openDB } from "idb";
import {
  State,
  emptyState,
  validateState,
  cents,
  uid,
  budgetMonth,
} from "./model";
import type { AppState } from "../models";
export function migrateLegacy(raw: AppState): State {
  if (!raw?.settings || !Array.isArray(raw.transactions))
    throw Error("Ancien format invalide");
  const s = emptyState();
  s.legacy = raw;
  s.settings.theme = raw.settings.theme;
  s.accounts = [
    {
      id: "legacy",
      name: "Ancien compte — à rapprocher",
      institution: "",
      kind: "current",
      balance: 0,
      asOf: null,
      currency: "EUR",
    },
  ];
  const categoryMap: Record<string, string> = {
    rent: "Charges fixes",
    subscriptions: "Charges fixes",
    utilities: "Charges fixes",
    groceries: "Vie courante",
    transport: "Vie courante",
    healthcare: "Vie courante",
    dining: "Fun & lifestyle",
    entertainment: "Fun & lifestyle",
    travel: "Projets & cagnottes",
  };
  s.transactions = raw.transactions
    .filter((t) => t.currency === "EUR")
    .map((t) => ({
      id: t.id,
      date: t.date,
      description: t.description,
      amount: -Math.abs(cents(t.amount)),
      accountId: "legacy",
      kind: "expense",
      category: categoryMap[t.category] || "Vie courante",
      budgetMonth: budgetMonth(t.date),
      status: "booked",
      notes: t.tags.join(", "),
    }));
  s.goals = (raw.savingsGoals || [])
    .filter((g) => g.currency === "EUR")
    .map((g) => ({
      id: g.id,
      name: g.name,
      target: cents(g.targetAmount),
      current: cents(g.currentAmount),
      targetDate: g.targetDate,
      monthly: 0,
      active: g.status === "active",
    }));
  s.accounts.push(
    ...(raw.investmentAccounts || [])
      .filter((a) => a.currency === "EUR")
      .map((a) => ({
        id: a.id,
        name: a.name,
        institution: "",
        kind: "investment" as const,
        balance: cents(
          a.cashBalance +
            a.holdings.reduce((n, h) => n + h.shares * h.pricePerShare, 0),
        ),
        asOf: null,
        currency: "EUR" as const,
      })),
  );
  const income = (raw.incomeSources || [])
    .filter((i) => i.isActive && i.currency === "EUR")
    .reduce((n, i) => n + cents(i.amount), 0);
  const cats: Record<string, number> = {};
  for (const b of raw.budgetTargets || []) {
    const c = categoryMap[b.category] || "Vie courante";
    if (b.currency === "EUR") cats[c] = (cats[c] || 0) + cents(b.monthlyLimit);
  }
  s.plans = [
    {
      month: s.settings.month,
      income,
      exceptional: 0,
      refundTax: 0,
      categories: cats,
      fixedAdjustment: 0,
    },
  ];
  return validateState(s);
}
const db = () =>
  openDB("finflow-budget", 1, {
    upgrade(db) {
      db.createObjectStore("state");
    },
  });
export async function loadState(): Promise<State> {
  const d = await db();
  const saved = await d.get("state", "current");
  if (saved) return validateState(saved);
  const legacy = localStorage.getItem("finflow_state_v1");
  const s = legacy ? migrateLegacy(JSON.parse(legacy)) : emptyState();
  await d.put("state", s, "current");
  return s;
}
export async function saveState(s: State, expectedRevision = 0) {
  const d = await db();
  const tx = d.transaction("state", "readwrite");
  const existing = await tx.store.get("current");
  if ((existing?.revision ?? 0) !== expectedRevision) {
    tx.abort();
    throw Error(
      "Le budget a changé dans un autre onglet. Rechargez la page avant de réessayer.",
    );
  }
  const next = validateState({ ...s, revision: expectedRevision + 1 });
  await tx.store.put(next, "current");
  await tx.done;
  return next;
}
export function backup(s: State) {
  return JSON.stringify(
    {
      format: "finflow-backup",
      version: 2,
      exportedAt: new Date().toISOString(),
      state: s,
    },
    null,
    2,
  );
}
export function readBackup(text: string) {
  const raw = JSON.parse(text);
  return validateState(raw.state ?? raw);
}
export function download(name: string, content: string) {
  const url = URL.createObjectURL(
    new Blob([content], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
