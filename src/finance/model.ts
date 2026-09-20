import { z } from "zod";
export const categories = [
  "Charges fixes",
  "Vie courante",
  "Fun & lifestyle",
  "Projets & cagnottes",
  "Crédits & paiements fractionnés",
  "Fiscalité & régularisations",
  "Épargne de sécurité",
  "Investissements",
  "Marge libre",
] as const;
const money = z.number().int().safe();
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(
    (s) =>
      !isNaN(Date.parse(s)) && new Date(s).toISOString().slice(0, 10) === s,
    "Date invalide",
  );
const month = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);
const id = z.string().min(1);
export const accountSchema = z.object({
  id,
  name: z.string().min(1),
  institution: z.string(),
  kind: z.enum(["current", "savings", "investment", "other", "debt"]),
  balance: money,
  asOf: date.nullable(),
  iban: z.string().optional(),
  currency: z.literal("EUR").default("EUR"),
});
export const txSchema = z.object({
  id,
  date,
  valueDate: date.optional(),
  description: z.string(),
  amount: money,
  accountId: id,
  kind: z.enum([
    "income",
    "expense",
    "refund",
    "transfer",
    "saving",
    "investment",
  ]),
  category: z.string(),
  budgetMonth: month,
  status: z.enum(["booked", "pending"]),
  peerAccountId: z.string().optional(),
  linkedId: z.string().optional(),
  source: z.string().optional(),
  sourceKey: z.string().optional(),
  batchId: z.string().optional(),
  notes: z.string().default(""),
});
export const recurringSchema = z.object({
  id,
  name: z.string().min(1),
  amount: money.nonnegative(),
  accountId: id,
  day: z.number().int().min(1).max(31),
  start: month,
  end: month.nullable(),
  category: z.string(),
});
export const commitmentSchema = z
  .object({
    id,
    name: z.string().min(1),
    type: z.enum(["credit", "tax"]),
    amount: money.nonnegative(),
    firstDate: date,
    count: z.number().int().min(1),
    paid: z.number().int().nonnegative(),
    direction: z.enum(["out", "in"]),
    accountId: z.string(),
    notes: z.string().default(""),
  })
  .refine((c) => c.paid <= c.count, "Échéances payées supérieures au total");
export const goalSchema = z.object({
  id,
  name: z.string().min(1),
  target: money.nonnegative(),
  current: money.nonnegative(),
  targetDate: date.nullable(),
  monthly: money.nonnegative(),
  active: z.boolean(),
});
export const snapshotSchema = z.object({
  id,
  date,
  assets: money,
  otherDebts: money,
  creditDebt: money,
  checking: money,
  buffer: money.nonnegative().nullable(),
});
export const planSchema = z.object({
  month,
  income: money.nullable(),
  exceptional: money,
  refundTax: money.nullable(),
  categories: z.record(z.string(), money.nullable()),
  fixedAdjustment: money,
});
export const batchSchema = z.object({
  id,
  name: z.string(),
  date: z.string(),
  transactionIds: z.array(id),
  ignoredKeys: z.array(z.string()),
  reconciled: z.boolean(),
  previousTransactions: z.array(txSchema).optional(),
});
export const stateSchema = z.object({
  version: z.literal(2),
  revision: z.number().int().nonnegative().optional(),
  accounts: z.array(accountSchema),
  transactions: z.array(txSchema),
  recurring: z.array(recurringSchema),
  commitments: z.array(commitmentSchema),
  goals: z.array(goalSchema),
  snapshots: z.array(snapshotSchema),
  plans: z.array(planSchema),
  batches: z.array(batchSchema),
  ignored: z.array(z.string()),
  rules: z.array(
    z.object({
      id,
      contains: z.string().min(1),
      category: z.string(),
      kind: txSchema.shape.kind,
    }),
  ),
  settings: z.object({
    theme: z.enum(["light", "dark"]),
    month,
    buffer: money.nonnegative().nullable(),
    lastExport: z.string().nullable(),
  }),
  legacy: z.unknown().optional(),
});
export type State = z.infer<typeof stateSchema>;
export type Account = z.infer<typeof accountSchema>;
export type Tx = z.infer<typeof txSchema>;
export type Commitment = z.infer<typeof commitmentSchema>;
export type Goal = z.infer<typeof goalSchema>;
export type Recurring = z.infer<typeof recurringSchema>;
export const uid = () => crypto.randomUUID();
export const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
export function addMonths(m: string, n: number) {
  const [y, mo] = m.slice(0, 7).split("-").map(Number);
  const d = new Date(Date.UTC(y, mo - 1 + n, 1));
  return d.toISOString().slice(0, 7);
}
export const budgetMonth = (date: string, salary = false) =>
  salary ? addMonths(date, 1) : date.slice(0, 7);
export const euros = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(
    n / 100,
  );
export const cents = (v: string | number) =>
  Math.round(Number(String(v).replace(",", ".")) * 100);
export function emptyState(): State {
  return {
    version: 2,
    accounts: [],
    transactions: [],
    recurring: [],
    commitments: [],
    goals: [],
    snapshots: [],
    plans: [],
    batches: [],
    ignored: [],
    rules: [],
    settings: {
      theme: "light",
      month: today().slice(0, 7),
      buffer: null,
      lastExport: null,
    },
  };
}
export function validateState(raw: unknown): State {
  const s = stateSchema.parse(raw);
  for (const rows of [
    s.accounts,
    s.transactions,
    s.recurring,
    s.commitments,
    s.goals,
    s.snapshots,
    s.batches,
    s.rules,
  ]) {
    if (new Set(rows.map((r) => r.id)).size !== rows.length)
      throw Error("Identifiants dupliqués");
  }
  if (new Set(s.plans.map((p) => p.month)).size !== s.plans.length)
    throw Error("Mois dupliqués");
  const accounts = new Set(s.accounts.map((a) => a.id));
  for (const t of s.transactions) {
    if (
      !accounts.has(t.accountId) ||
      (t.peerAccountId && !accounts.has(t.peerAccountId))
    )
      throw Error("Compte de transaction absent");
  }
  for (const r of s.recurring) {
    if (!accounts.has(r.accountId)) throw Error("Compte de charge absent");
    if (r.end && r.end < r.start) throw Error("Fin antérieure au début");
  }
  return s;
}
