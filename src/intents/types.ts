import type {
  AppSettings,
  IncomeSource,
  Transaction,
  BudgetTarget,
  InvestmentAccount,
  ETFHolding,
  SavingsGoal,
  ZakatAsset,
  ShariahSettings,
} from '../models';

// ─── INTENT UNION ────────────────────────────────────────────────────────────
// Every possible user intention that can change the model.

export type Intent =
  // Settings
  | { type: 'SETTINGS_UPDATE'; payload: Partial<AppSettings> }

  // Income
  | { type: 'INCOME_ADD'; payload: IncomeSource }
  | { type: 'INCOME_UPDATE'; payload: IncomeSource }
  | { type: 'INCOME_DELETE'; payload: { id: string } }

  // Transactions (expenses)
  | { type: 'TRANSACTION_ADD'; payload: Transaction }
  | { type: 'TRANSACTION_UPDATE'; payload: Transaction }
  | { type: 'TRANSACTION_DELETE'; payload: { id: string } }
  | { type: 'TRANSACTIONS_IMPORT'; payload: Transaction[] }

  // Budget
  | { type: 'BUDGET_ADD'; payload: BudgetTarget }
  | { type: 'BUDGET_UPDATE'; payload: BudgetTarget }
  | { type: 'BUDGET_DELETE'; payload: { id: string } }

  // Investment accounts
  | { type: 'ACCOUNT_ADD'; payload: InvestmentAccount }
  | { type: 'ACCOUNT_UPDATE'; payload: InvestmentAccount }
  | { type: 'ACCOUNT_DELETE'; payload: { id: string } }

  // Holdings inside an account
  | { type: 'HOLDING_ADD'; payload: { accountId: string; holding: ETFHolding } }
  | { type: 'HOLDING_UPDATE'; payload: { accountId: string; holding: ETFHolding } }
  | { type: 'HOLDING_DELETE'; payload: { accountId: string; holdingId: string } }

  // Savings Goals
  | { type: 'GOAL_ADD'; payload: SavingsGoal }
  | { type: 'GOAL_UPDATE'; payload: SavingsGoal }
  | { type: 'GOAL_DELETE'; payload: { id: string } }

  // Zakat Assets
  | { type: 'ZAKAT_ASSET_ADD'; payload: ZakatAsset }
  | { type: 'ZAKAT_ASSET_UPDATE'; payload: ZakatAsset }
  | { type: 'ZAKAT_ASSET_DELETE'; payload: { id: string } }
  | { type: 'SHARIAH_SETTINGS_UPDATE'; payload: Partial<ShariahSettings> }

  // State reset / full import
  | { type: 'STATE_IMPORT'; payload: import('../models').AppState };
