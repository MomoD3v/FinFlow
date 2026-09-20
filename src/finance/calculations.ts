import { State, Commitment, Tx, addMonths, categories } from "./model";
export function installment(c: Commitment, i: number) {
  return (
    Math.floor(c.amount / c.count) +
    (i === c.count - 1 ? c.amount % c.count : 0)
  );
}
export function schedule(c: Commitment) {
  return Array.from({ length: c.count }, (_, i) => {
    const m = addMonths(c.firstDate, i);
    const [y, mo] = m.split("-").map(Number);
    const day = Math.min(
      Number(c.firstDate.slice(8, 10)),
      new Date(y, mo, 0).getDate(),
    );
    return {
      index: i,
      date: `${m}-${String(day).padStart(2, "0")}`,
      amount: installment(c, i),
      paid: i < c.paid,
    };
  });
}
export function remaining(c: Commitment) {
  return schedule(c)
    .filter((e) => !e.paid)
    .reduce((s, e) => s + e.amount, 0);
}
export function netWorth(s: State) {
  const assets = s.accounts
    .filter((a) => a.kind !== "debt")
    .reduce((n, a) => n + a.balance, 0);
  const otherDebts = s.accounts
    .filter((a) => a.kind === "debt")
    .reduce((n, a) => n + a.balance, 0);
  const creditDebt = s.commitments
    .filter((c) => c.type === "credit")
    .reduce((n, c) => n + remaining(c), 0);
  return {
    assets,
    otherDebts,
    creditDebt,
    net: assets - otherDebts - creditDebt,
    checking: s.accounts
      .filter((a) => a.kind === "current")
      .reduce((n, a) => n + a.balance, 0),
  };
}
export function budgetEffect(t: Tx) {
  if (t.status !== "booked" || t.kind === "transfer") return 0;
  return t.amount;
}
export function monthly(s: State, m: string) {
  const plan = s.plans.find((p) => p.month === m);
  const tx = s.transactions.filter(
    (t) => t.budgetMonth === m && t.status === "booked",
  );
  const reference = plan?.income;
  const actualIncome = tx
    .filter((t) => t.kind === "income" && t.category === "Revenus")
    .reduce((a, t) => a + t.amount, 0);
  const fixed =
    s.recurring
      .filter((r) => r.start <= m && (!r.end || r.end >= m))
      .reduce((a, r) => a + r.amount, 0) + (plan?.fixedAdjustment || 0);
  const due = (type: string) =>
    s.commitments
      .filter((c) => c.type === type)
      .reduce(
        (a, c) =>
          a +
          schedule(c)
            .filter((e) => e.date.startsWith(m))
            .reduce(
              (b, e) => b + e.amount * (c.direction === "out" ? 1 : -1),
              0,
            ),
        0,
      );
  const defaults: Record<string, number> = {
    "Charges fixes": fixed,
    "Crédits & paiements fractionnés": due("credit"),
    "Fiscalité & régularisations": Math.max(0, due("tax")),
    "Projets & cagnottes": s.goals
      .filter((g) => g.active)
      .reduce((a, g) => a + g.monthly, 0),
  };
  const rows = categories.map((category) => ({
    category,
    planned: plan?.categories[category] ?? defaults[category] ?? 0,
    actual: -tx
      .filter((t) => t.category === category)
      .reduce((a, t) => a + budgetEffect(t), 0),
  }));
  const plannedIn =
    (reference ?? 0) +
    (plan?.exceptional || 0) +
    (plan?.refundTax ?? Math.max(0, -due("tax")));
  const margin = rows.find((r) => r.category === "Marge libre")!;
  if (plan?.categories["Marge libre"] == null && reference != null)
    margin.planned = Math.max(
      0,
      plannedIn -
        rows.filter((r) => r !== margin).reduce((a, r) => a + r.planned, 0),
    );
  const plannedOut = rows.reduce((a, r) => a + r.planned, 0),
    actualOut = rows.reduce((a, r) => a + r.actual, 0);
  const actualIn = tx
    .filter(
      (t) =>
        t.kind === "income" ||
        (t.kind === "refund" && t.category === "Revenus"),
    )
    .reduce((a, t) => a + t.amount, 0);
  const savings = rows
    .filter((r) =>
      ["Épargne de sécurité", "Investissements"].includes(r.category),
    )
    .reduce((a, r) => a + r.planned, 0);
  const savingsActual = rows
    .filter((r) =>
      ["Épargne de sécurité", "Investissements"].includes(r.category),
    )
    .reduce((a, r) => a + r.actual, 0);
  const mandatory = rows
    .filter((r) =>
      [
        "Charges fixes",
        "Crédits & paiements fractionnés",
        "Fiscalité & régularisations",
      ].includes(r.category),
    )
    .reduce((a, r) => a + r.planned, 0);
  return {
    rows,
    reference,
    actualIncome,
    plannedIn,
    plannedOut,
    actualIn,
    actualOut,
    plannedBalance: plannedIn - plannedOut,
    actualBalance: tx.reduce((a, t) => a + budgetEffect(t), 0),
    savings,
    savingsActual,
    savingsRate: reference ? (savings / reference) * 100 : null,
    remainingAfterMandatory: reference == null ? null : reference - mandatory,
    mandatory,
    bufferUsed: Math.max(0, plannedOut - plannedIn),
  };
}
