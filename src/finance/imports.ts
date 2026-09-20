import Papa from "papaparse";
import { State, Tx, uid, budgetMonth, today } from "./model";
export interface Word {
  text: string;
  x: number;
  y: number;
  width: number;
}
export interface PdfPage {
  words: Word[];
  width: number;
  height: number;
}
export interface Candidate extends Tx {
  keep: boolean;
  warning: string;
  line: string;
  page: number;
}
export interface Control {
  page: number;
  label: string;
  amount: number;
  role: "opening" | "closing" | "debit" | "credit";
}
export interface ImportResult {
  rows: Candidate[];
  warnings: string[];
  controls: Control[];
  text: string;
}
export interface Mapping {
  debit: number;
  credit: number;
  balance?: number;
  year: number;
}
const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
export function parseMoney(raw: string): number | null {
  let s = raw.replace(/[€¤\s\u00a0\u202f]/g, "");
  if (!/^[+-]?\d+(?:[.,]\d{2})$/.test(s)) return null;
  const n = Math.round(Number(s.replace(",", ".")) * 100);
  return Number.isSafeInteger(n) ? n : null;
}
export function parseDate(raw: string, year: number): string | null {
  let d = 0,
    m = 0,
    y = year;
  const numeric = raw.match(/^(\d{1,2})[/.](\d{1,2})(?:[/.](\d{2,4}))?\b/);
  if (numeric) {
    d = +numeric[1];
    m = +numeric[2];
    y = numeric[3] ? +numeric[3] : year;
    if (y < 100) y += 2000;
  } else {
    const match = normalize(raw).match(
      /^(\d{1,2})\s+(janv|janvier|fevr|fevrier|mars|avr|avril|mai|juin|juil|juillet|aout|sept|septembre|oct|octobre|nov|novembre|dec|decembre)\.?\s+(\d{4})/,
    );
    if (!match) return null;
    d = +match[1];
    y = +match[3];
    m =
      [
        "jan",
        "fev",
        "mar",
        "avr",
        "mai",
        "jui",
        "juil",
        "aou",
        "sep",
        "oct",
        "nov",
        "dec",
      ].findIndex((x) => match[2].startsWith(x)) + 1;
    if (match[2].startsWith("juil")) m = 7;
  }
  const s = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  return !isNaN(Date.parse(s)) && new Date(s).toISOString().slice(0, 10) === s
    ? s
    : null;
}
export function lines(page: PdfPage) {
  const rows: { y: number; words: Word[] }[] = [];
  for (const w of [...page.words].sort((a, b) => a.y - b.y || a.x - b.x)) {
    let row = rows.find((r) => Math.abs(r.y - w.y) < 3);
    if (!row) {
      row = { y: w.y, words: [] };
      rows.push(row);
    }
    row.words.push(w);
  }
  return rows
    .sort((a, b) => a.y - b.y)
    .map((r) => ({ ...r, words: r.words.sort((a, b) => a.x - b.x) }));
}
function position(words: Word[], patterns: RegExp[]): number | undefined {
  for (const w of words) {
    for (const re of patterns) {
      const match = normalize(w.text).match(re);
      if (match)
        return (
          w.x + ((match.index || 0) / Math.max(w.text.length, 1)) * w.width
        );
    }
  }
  return undefined;
}
function amounts(words: Word[]) {
  const out: { value: number; x: number; end: number }[] = [];
  for (const w of words) {
    const re = /[+-]?\d[\d \u00a0\u202f]*[,.]\d{2}(?:\s*[€¤])?/g;
    for (const match of w.text.matchAll(re)) {
      const value = parseMoney(match[0]);
      if (value !== null)
        out.push({
          value,
          x: w.x + ((match.index || 0) / Math.max(w.text.length, 1)) * w.width,
          end:
            w.x +
            (((match.index || 0) + match[0].length) /
              Math.max(w.text.length, 1)) *
              w.width,
        });
    }
  }
  return out;
}
export function parsePages(
  pages: PdfPage[],
  accountId: string,
  mapping?: Mapping,
): ImportResult {
  const rows: Candidate[] = [],
    warnings: string[] = [],
    controls: Control[] = [];
  let pending = false;
  let previous: Candidate | undefined;
  let detectedYear = mapping?.year || Number(today().slice(0, 4));
  let inferred = !!mapping;
  let debit: number | undefined,
    credit: number | undefined,
    balance: number | undefined;
  let active = false;
  let totalText = "";
  pages.forEach((page, pi) => {
    const ls = lines(page);
    const pageText = ls
      .map((l) => l.words.map((w) => w.text).join(" "))
      .join("\n");
    totalText += pageText + "\n";
    if (!inferred) {
      const years = pageText.match(/\b20\d{2}\b/g);
      if (years?.length) {
        detectedYear = Number(years[0]);
        inferred = true;
      }
    }
    debit = mapping ? mapping.debit * page.width : undefined;
    credit = mapping ? mapping.credit * page.width : undefined;
    balance = mapping?.balance ? mapping.balance * page.width : undefined;
    active = !!mapping;
    previous = undefined;
    for (const row of ls) {
      const text = row.words
          .map((w) => w.text)
          .join(" ")
          .trim(),
        norm = normalize(text);
      if (!text) continue;
      const summaryAmounts = amounts(row.words);
      if (
        /solde d['’]ouverture/.test(normalize(pageText)) &&
        /^compte\b/.test(norm) &&
        summaryAmounts.length === 4 &&
        !controls.some((c) => c.role === "opening")
      ) {
        (["opening", "debit", "credit", "closing"] as const).forEach(
          (role, i) =>
            controls.push({
              page: pi + 1,
              label: "Résumé du compte",
              amount: summaryAmounts[i].value,
              role,
            }),
        );
      }

      if (/en attente/.test(norm)) {
        pending = true;
        active = false;
        previous = undefined;
      }
      if (/transactions du compte/.test(norm)) {
        pending = false;
        active = false;
        previous = undefined;
      }
      const de = position(row.words, [/argent sortant/, /debit/]),
        cr = position(row.words, [/argent entrant/, /credit/]);
      if (
        de !== undefined &&
        cr !== undefined &&
        /description|libelle|operation|valeur|date/.test(norm)
      ) {
        debit = mapping ? mapping.debit * page.width : de;
        credit = mapping ? mapping.credit * page.width : cr;
        balance = position(row.words, [/solde/]);
        active = true;
        previous = undefined;
        continue;
      }
      if (
        /nouveau solde|ancien solde|solde au\s*:/.test(norm) &&
        debit !== undefined &&
        credit !== undefined
      ) {
        const ms = amounts(row.words).filter((a) => a.x > debit! - 15);
        const a = ms[ms.length - 1];
        if (a) {
          const inDebit = a.x < (debit + credit) / 2;
          controls.push({
            page: pi + 1,
            label: text,
            amount: inDebit ? -Math.abs(a.value) : Math.abs(a.value),
            role:
              /ancien|solde au\s*:/.test(norm) && !/nouveau/.test(norm)
                ? "opening"
                : "closing",
          });
        }
        previous = undefined;
        continue;
      }
      if (
        /total des operations/.test(norm) &&
        debit !== undefined &&
        credit !== undefined
      ) {
        for (const a of amounts(row.words).filter((a) => a.x > debit! - 15))
          controls.push({
            page: pi + 1,
            label: text,
            amount: Math.abs(a.value),
            role: a.x < (debit + credit) / 2 ? "debit" : "credit",
          });
        active = false;
        previous = undefined;
        continue;
      }
      if (!active || debit === undefined || credit === undefined) continue;
      if (
        /garantie|reclamation|boursorama -|signaler une carte|la banque postale -|pour votre information|page \d/.test(
          norm,
        )
      ) {
        previous = undefined;
        continue;
      }
      const first = row.words[0];
      const startDate =
        first.x < page.width * 0.25 ? parseDate(text, detectedYear) : null;
      if (startDate) {
        const colLeft = debit - page.width * 0.05;
        const ms = amounts(row.words).filter((a) => a.x >= colLeft);
        let a = ms.find(
          (a) => balance === undefined || a.x < (credit! + balance) / 2,
        );
        if (!a) {
          warnings.push(
            `Page ${pi + 1} : montant non reconnu pour ${text.slice(0, 90)}`,
          );
          previous = undefined;
          continue;
        }
        const isDebit = a.x < (debit + credit) / 2;
        const amount = Math.abs(a.value) * (isDebit ? -1 : 1);
        const dateWords = row.words.filter((w) => w.x < colLeft);
        const desc = dateWords
          .map((w) => w.text)
          .join(" ")
          .trim()
          .replace(
            /^\d{1,2}(?:[/.]\d{1,2}(?:[/.]\d{2,4})?|\s+[a-zéû.]+\s+\d{4})\s*/i,
            "",
          )
          .replace(/\s+\d{2}\/\d{2}\/\d{4}\s*$/, "")
          .trim();
        const dates = text.match(/\b\d{2}\/\d{2}\/\d{4}\b/g) || [];
        previous = {
          id: uid(),
          date: startDate,
          valueDate:
            dates.length > 1
              ? parseDate(dates[dates.length - 1], detectedYear) || undefined
              : undefined,
          description: desc,
          amount,
          accountId,
          kind: amount > 0 ? "income" : "expense",
          category: amount > 0 ? "Revenus" : "Vie courante",
          budgetMonth: budgetMonth(startDate),
          status: pending ? "pending" : "booked",
          notes: "",
          keep: !pending,
          warning: pending ? "Opération en attente — exclue du réalisé" : "",
          line: text,
          page: pi + 1,
        };
        rows.push(previous);
      } else if (
        previous &&
        row.words[0].x < debit - page.width * 0.08 &&
        row.y < page.height * 0.9 &&
        !/date|solde|releve|iban|bic|carte perdue/.test(norm)
      ) {
        previous.description += " " + text;
        previous.line += "\n" + text;
      }
    }
  });
  if (!rows.length)
    warnings.push(
      "Aucun tableau reconnu. Indiquez les positions des colonnes. Un scan nécessite un OCR, non inclus dans cette version.",
    );
  // Resolve years around New Year from explicit statement period, rather than receipt date alone.
  const period = totalText.match(
    /du\s+(\d{2}\/\d{2}\/\d{4})\s+au\s+(\d{2}\/\d{2}\/\d{4})/i,
  );
  if (period) {
    const from = parseDate(period[1], detectedYear)!,
      to = parseDate(period[2], detectedYear)!;
    for (const r of rows) {
      if (
        !/\d{2}\/\d{2}\/\d{4}|\d{1,2}\s+[a-zéû.]+\s+\d{4}/i.test(
          r.line.split("\n")[0],
        )
      ) {
        const candidate = from.slice(0, 4) + r.date.slice(4);
        if (candidate >= from && candidate <= to) {
          r.date = candidate;
          r.budgetMonth = candidate.slice(0, 7);
        }
      }
    }
  }
  return { rows, warnings, controls, text: totalText };
}
export function applySuggestions(
  result: ImportResult,
  s: State,
  fingerprint: string,
): ImportResult {
  const occurrence = new Map<string, number>();
  for (const row of result.rows) {
    const key = `${row.accountId}|${row.date}|${row.amount}|${normalize(row.description)}`;
    const n = (occurrence.get(key) || 0) + 1;
    occurrence.set(key, n);
    row.sourceKey = `${key}:${n}`;
    const count = s.transactions.filter(
      (t) =>
        t.status === row.status &&
        t.accountId === row.accountId &&
        t.date === row.date &&
        t.amount === row.amount &&
        normalize(t.description) === normalize(row.description),
    ).length;
    if (
      s.ignored.includes(row.sourceKey) ||
      s.transactions.some(
        (t) => t.sourceKey === row.sourceKey && t.status === row.status,
      ) ||
      count >= n
    ) {
      row.keep = false;
      row.warning = "Déjà importée ou ignorée — vérifier";
    }
    if (
      s.transactions.some(
        (t) =>
          t.source === "Tableur initial" &&
          t.accountId === row.accountId &&
          t.date === row.date &&
          t.amount === row.amount,
      )
    ) {
      row.keep = false;
      row.warning =
        "Même date et montant dans le tableur initial — doublon probable à vérifier";
    }
    const rule = s.rules.find((r) =>
      normalize(row.description).includes(normalize(r.contains)),
    );
    if (rule) {
      row.category = rule.category;
      row.kind = rule.kind;
    } else if (
      /salary|salaire/.test(normalize(row.description)) &&
      row.amount > 0
    ) {
      row.kind = "income";
      row.category = "Revenus";
      row.budgetMonth = budgetMonth(row.date, true);
    } else if (/rembours/.test(normalize(row.description)) && row.amount > 0) {
      row.kind = "refund";
      row.category = "Vie courante";
      row.warning += " Remboursement proposé : vérifier la catégorie.";
    }
    const peer = s.accounts.find(
      (a) =>
        a.id !== row.accountId &&
        a.iban &&
        row.description.replace(/\s/g, "").includes(a.iban.replace(/\s/g, "")),
    );
    const opposite = s.transactions.find(
      (t) =>
        t.accountId !== row.accountId &&
        /vir|paiement envoye/.test(normalize(t.description)) &&
        t.amount === -row.amount &&
        Math.abs(Date.parse(t.date) - Date.parse(row.date)) <= 3 * 86400000 &&
        /vir|paiement envoye/.test(normalize(row.description)),
    );
    if (peer || opposite) {
      row.peerAccountId = peer?.id || opposite?.accountId;
      const destination = s.accounts.find(
        (a) => a.id === (row.amount < 0 ? row.peerAccountId : row.accountId),
      );
      row.kind =
        row.amount < 0 && destination?.kind === "savings"
          ? "saving"
          : row.amount < 0 && destination?.kind === "investment"
            ? "investment"
            : "transfer";
      row.category =
        row.kind === "saving"
          ? "Épargne de sécurité"
          : row.kind === "investment"
            ? "Investissements"
            : "Hors budget / transfert";
      row.warning += " Transfert interne proposé : à confirmer.";
    }
  }
  return result;
}
export function parseCSV(text: string, accountId: string): ImportResult {
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (h) => normalize(h),
  });
  const rows: Candidate[] = [];
  const warnings = parsed.errors.map(
    (e) => `Ligne ${e.row ?? "?"} : ${e.message}`,
  );
  parsed.data.forEach((r, i) => {
    const rawDate =
      r.date || r["date operation"] || r["date operation bancaire"];
    const d = rawDate
      ? /^\d{4}-\d{2}-\d{2}$/.test(rawDate)
        ? rawDate
        : parseDate(rawDate, Number(today().slice(0, 4)))
      : null;
    const amount = r.amount || r.montant;
    const val = amount
      ? parseMoney(amount)
      : r.debit
        ? -(parseMoney(r.debit) ?? NaN)
        : parseMoney(r.credit || "");
    if (!d || val === null || !Number.isFinite(val)) {
      warnings.push(`Ligne ${i + 2} : date ou montant invalide`);
      return;
    }
    rows.push({
      id: uid(),
      date: d,
      amount: val,
      description: r.description || r.libelle || "",
      accountId,
      kind: val > 0 ? "income" : "expense",
      category: val > 0 ? "Revenus" : "Vie courante",
      budgetMonth: d.slice(0, 7),
      status: "booked",
      notes: "",
      keep: true,
      warning: "",
      line: JSON.stringify(r),
      page: 1,
    });
  });
  return { rows, warnings, controls: [], text };
}
export function reconciliation(result: ImportResult) {
  const booked = result.rows.filter((t) => t.status === "booked");
  const debits = -booked
      .filter((t) => t.amount < 0)
      .reduce((a, t) => a + t.amount, 0),
    credits = booked
      .filter((t) => t.amount > 0)
      .reduce((a, t) => a + t.amount, 0);
  const opening = result.controls.find((c) => c.role === "opening"),
    closing = result.controls.find((c) => c.role === "closing"),
    dt = result.controls.find((c) => c.role === "debit"),
    ct = result.controls.find((c) => c.role === "credit");
  const checked = !!((opening && closing) || (dt && ct));
  const ok =
    checked &&
    (!opening ||
      !closing ||
      opening.amount + credits - debits === closing.amount) &&
    (!dt || dt.amount === debits) &&
    (!ct || ct.amount === credits);
  return {
    debits,
    credits,
    checked,
    ok,
    opening: opening?.amount,
    closing: closing?.amount,
  };
}
export function commitImport(
  s: State,
  result: ImportResult,
  name: string,
  force = false,
): State {
  const control = reconciliation(result);
  if ((result.warnings.length || (control.checked && !control.ok)) && !force)
    throw Error("Vérification manuelle requise");
  const batchId = uid();
  const imported = result.rows
    .filter((r) => r.keep)
    .map(({ keep, warning, line, page, ...tx }) => ({
      ...tx,
      batchId,
      source: name,
    }));
  const ignored = result.rows
    .filter((r) => !r.keep && r.status !== "pending" && r.sourceKey)
    .map((r) => r.sourceKey!);
  const previousTransactions: Tx[] = [];
  const matched = new Set<string>();
  let existing = [...s.transactions];
  for (const row of imported) {
    if (row.status === "booked") {
      const pending = existing.filter(
        (t) =>
          t.status === "pending" &&
          t.accountId === row.accountId &&
          t.amount === row.amount &&
          normalize(t.description) === normalize(row.description) &&
          Math.abs(Date.parse(t.date) - Date.parse(row.date)) <= 7 * 86400000,
      );
      if (pending.length === 1) {
        previousTransactions.push(pending[0]);
        existing = existing.filter((t) => t.id !== pending[0].id);
      }
    }
    if (
      ["transfer", "saving", "investment"].includes(row.kind) &&
      row.peerAccountId
    ) {
      const peers = existing.filter(
        (t) =>
          !matched.has(t.id) &&
          t.accountId === row.peerAccountId &&
          t.status === "booked" &&
          t.amount === -row.amount &&
          Math.abs(Date.parse(t.date) - Date.parse(row.date)) <= 3 * 86400000,
      );
      if (peers.length === 1) {
        const old = peers[0];
        matched.add(old.id);
        previousTransactions.push(old);
        const destination = s.accounts.find((a) => a.id === row.accountId);
        const peerKind: Tx["kind"] =
          old.amount < 0 && (old.kind === "saving" || old.kind === "investment")
            ? old.kind
            : old.amount < 0 && destination?.kind === "savings"
              ? "saving"
              : old.amount < 0 && destination?.kind === "investment"
                ? "investment"
                : "transfer";
        const peerCategory =
          peerKind === "saving"
            ? "Épargne de sécurité"
            : peerKind === "investment"
              ? "Investissements"
              : "Hors budget / transfert";
        existing = existing.map((t) =>
          t.id === old.id
            ? {
                ...t,
                kind: peerKind,
                category: peerCategory,
                peerAccountId: row.accountId,
              }
            : t,
        );
      }
    }
  }
  return {
    ...s,
    transactions: [...existing, ...imported],
    ignored: [...new Set([...s.ignored, ...ignored])],
    batches: [
      ...s.batches,
      {
        id: batchId,
        name,
        date: new Date().toISOString(),
        transactionIds: imported.map((t) => t.id),
        ignoredKeys: ignored.filter((k) => !s.ignored.includes(k)),
        reconciled: control.ok,
        previousTransactions,
      },
    ],
  };
}
export function undoImport(s: State, id: string): State {
  const batch = s.batches.find((b) => b.id === id);
  if (!batch) return s;
  return {
    ...s,
    transactions: [
      ...s.transactions.filter(
        (t) =>
          t.batchId !== id &&
          !batch.previousTransactions?.some((old) => old.id === t.id),
      ),
      ...(batch.previousTransactions || []).filter(
        (t) =>
          !t.batchId ||
          s.batches.some((b) => b.id === t.batchId && b.id !== id),
      ),
    ],
    batches: s.batches.filter((b) => b.id !== id),
    ignored: s.ignored.filter((k) => !batch.ignoredKeys.includes(k)),
  };
}
