import type { AppState } from '../models';
import type { Intent } from './types';

// Pure reducer – no side-effects, no async.
export function reducer(state: AppState, intent: Intent): AppState {
  switch (intent.type) {
    // ── Settings ────────────────────────────────────────────────────────────
    case 'SETTINGS_UPDATE':
      return { ...state, settings: { ...state.settings, ...intent.payload } };

    // ── Income ──────────────────────────────────────────────────────────────
    case 'INCOME_ADD':
      return { ...state, incomeSources: [...state.incomeSources, intent.payload] };

    case 'INCOME_UPDATE':
      return {
        ...state,
        incomeSources: state.incomeSources.map((s) =>
          s.id === intent.payload.id ? intent.payload : s
        ),
      };

    case 'INCOME_DELETE':
      return {
        ...state,
        incomeSources: state.incomeSources.filter((s) => s.id !== intent.payload.id),
      };

    // ── Transactions ────────────────────────────────────────────────────────
    case 'TRANSACTION_ADD':
      return { ...state, transactions: [intent.payload, ...state.transactions] };

    case 'TRANSACTION_UPDATE':
      return {
        ...state,
        transactions: state.transactions.map((t) =>
          t.id === intent.payload.id ? intent.payload : t
        ),
      };

    case 'TRANSACTION_DELETE':
      return {
        ...state,
        transactions: state.transactions.filter((t) => t.id !== intent.payload.id),
      };

    case 'TRANSACTIONS_IMPORT':
      return {
        ...state,
        transactions: [
          ...state.transactions,
          ...intent.payload.filter(
            (incoming) => !state.transactions.find((t) => t.id === incoming.id)
          ),
        ],
      };

    // ── Budget ──────────────────────────────────────────────────────────────
    case 'BUDGET_ADD':
      return { ...state, budgetTargets: [...state.budgetTargets, intent.payload] };

    case 'BUDGET_UPDATE':
      return {
        ...state,
        budgetTargets: state.budgetTargets.map((b) =>
          b.id === intent.payload.id ? intent.payload : b
        ),
      };

    case 'BUDGET_DELETE':
      return {
        ...state,
        budgetTargets: state.budgetTargets.filter((b) => b.id !== intent.payload.id),
      };

    // ── Investment accounts ─────────────────────────────────────────────────
    case 'ACCOUNT_ADD':
      return { ...state, investmentAccounts: [...state.investmentAccounts, intent.payload] };

    case 'ACCOUNT_UPDATE':
      return {
        ...state,
        investmentAccounts: state.investmentAccounts.map((a) =>
          a.id === intent.payload.id ? intent.payload : a
        ),
      };

    case 'ACCOUNT_DELETE':
      return {
        ...state,
        investmentAccounts: state.investmentAccounts.filter((a) => a.id !== intent.payload.id),
      };

    // ── Holdings ────────────────────────────────────────────────────────────
    case 'HOLDING_ADD':
      return {
        ...state,
        investmentAccounts: state.investmentAccounts.map((a) =>
          a.id === intent.payload.accountId
            ? { ...a, holdings: [...a.holdings, intent.payload.holding] }
            : a
        ),
      };

    case 'HOLDING_UPDATE':
      return {
        ...state,
        investmentAccounts: state.investmentAccounts.map((a) =>
          a.id === intent.payload.accountId
            ? {
                ...a,
                holdings: a.holdings.map((h) =>
                  h.id === intent.payload.holding.id ? intent.payload.holding : h
                ),
              }
            : a
        ),
      };

    case 'HOLDING_DELETE':
      return {
        ...state,
        investmentAccounts: state.investmentAccounts.map((a) =>
          a.id === intent.payload.accountId
            ? { ...a, holdings: a.holdings.filter((h) => h.id !== intent.payload.holdingId) }
            : a
        ),
      };

    // ── Savings Goals ───────────────────────────────────────────────────────
    case 'GOAL_ADD':
      return { ...state, savingsGoals: [...state.savingsGoals, intent.payload] };

    case 'GOAL_UPDATE':
      return {
        ...state,
        savingsGoals: state.savingsGoals.map((g) =>
          g.id === intent.payload.id ? intent.payload : g
        ),
      };

    case 'GOAL_DELETE':
      return {
        ...state,
        savingsGoals: state.savingsGoals.filter((g) => g.id !== intent.payload.id),
      };

    // ── Zakat ───────────────────────────────────────────────────────────────
    case 'ZAKAT_ASSET_ADD':
      return { ...state, zakatAssets: [...state.zakatAssets, intent.payload] };

    case 'ZAKAT_ASSET_UPDATE':
      return {
        ...state,
        zakatAssets: state.zakatAssets.map((z) =>
          z.id === intent.payload.id ? intent.payload : z
        ),
      };

    case 'ZAKAT_ASSET_DELETE':
      return {
        ...state,
        zakatAssets: state.zakatAssets.filter((z) => z.id !== intent.payload.id),
      };

    case 'SHARIAH_SETTINGS_UPDATE':
      return {
        ...state,
        shariahSettings: { ...state.shariahSettings, ...intent.payload },
      };

    // ── Full state import ───────────────────────────────────────────────────
    case 'STATE_IMPORT':
      return intent.payload;

    default:
      return state;
  }
}
