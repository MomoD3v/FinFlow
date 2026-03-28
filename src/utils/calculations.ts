import type { AppState, Transaction, InvestmentAccount } from '../models';

/** Returns ISO date strings for the first and last day of a given month offset */
function monthRange(monthOffset = 0): { from: string; to: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const end = new Date(now.getFullYear(), now.getMonth() + monthOffset + 1, 0);
  return {
    from: start.toISOString().split('T')[0],
    to: end.toISOString().split('T')[0],
  };
}

/** Filter transactions to a date range */
export function txInRange(txs: Transaction[], from: string, to: string): Transaction[] {
  return txs.filter((t) => t.date >= from && t.date <= to);
}

/** Sum of all active monthly income */
export function calcMonthlyIncome(state: AppState): number {
  return state.incomeSources
    .filter((s) => s.isActive)
    .reduce((acc, s) => acc + s.amount, 0);
}

/** Sum of expenses for the current calendar month */
export function calcMonthlyExpenses(state: AppState): number {
  const { from, to } = monthRange(0);
  return txInRange(state.transactions, from, to).reduce((acc, t) => acc + t.amount, 0);
}

/** Sum of expenses for the previous calendar month */
export function calcLastMonthExpenses(state: AppState): number {
  const { from, to } = monthRange(-1);
  return txInRange(state.transactions, from, to).reduce((acc, t) => acc + t.amount, 0);
}

/** Savings rate as percentage: (income - expenses) / income * 100 */
export function calcSavingsRate(state: AppState): number {
  const income = calcMonthlyIncome(state);
  const expenses = calcMonthlyExpenses(state);
  if (income === 0) return 0;
  return Math.max(0, ((income - expenses) / income) * 100);
}

/** Total market value of all investment accounts */
export function calcPortfolioValue(accounts: InvestmentAccount[]): number {
  return accounts.reduce((sum, acc) => {
    const holdingsValue = acc.holdings.reduce(
      (h, holding) => h + holding.shares * holding.pricePerShare,
      0
    );
    return sum + holdingsValue + acc.cashBalance;
  }, 0);
}

/** Net worth: savings goals current + portfolio value */
export function calcNetWorth(state: AppState): number {
  const goalsSavings = state.savingsGoals.reduce((s, g) => s + g.currentAmount, 0);
  const portfolio = calcPortfolioValue(state.investmentAccounts);
  return goalsSavings + portfolio;
}

/** Spending by category for a given month offset (default: current) */
export function calcCategorySpend(
  state: AppState,
  monthOffset = 0
): Record<string, number> {
  const { from, to } = monthRange(monthOffset);
  const txs = txInRange(state.transactions, from, to);
  const map: Record<string, number> = {};
  for (const tx of txs) {
    map[tx.category] = (map[tx.category] ?? 0) + tx.amount;
  }
  return map;
}

/** Budget utilisation: { category -> { spent, limit, pct } } */
export function calcBudgetUtilisation(state: AppState) {
  const spent = calcCategorySpend(state, 0);
  return state.budgetTargets.map((b) => ({
    id: b.id,
    category: b.category,
    limit: b.monthlyLimit,
    spent: spent[b.category] ?? 0,
    pct: b.monthlyLimit > 0 ? Math.min(((spent[b.category] ?? 0) / b.monthlyLimit) * 100, 150) : 0,
    isOver: (spent[b.category] ?? 0) > b.monthlyLimit,
  }));
}

/** Monthly contribution needed to hit a goal by its target date */
export function calcMonthlyNeeded(goal: AppState['savingsGoals'][0]): number | null {
  if (!goal.targetDate) return null;
  const now = new Date();
  const target = new Date(goal.targetDate);
  const months =
    (target.getFullYear() - now.getFullYear()) * 12 +
    (target.getMonth() - now.getMonth());
  if (months <= 0) return null;
  const remaining = goal.targetAmount - goal.currentAmount;
  return remaining > 0 ? remaining / months : 0;
}

/** Total income purification amount across all income sources */
export function calcPurificationAmount(state: AppState): number {
  return state.incomeSources
    .filter((s) => s.isActive)
    .reduce((sum, s) => sum + s.amount * s.nonHalalFraction, 0);
}
