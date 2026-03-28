// ─── PRIMITIVES ──────────────────────────────────────────────────────────────

export type Currency = 'EUR' | 'USD' | 'GBP' | 'MAD' | 'SAR' | 'AED';
export type Locale = 'en' | 'fr' | 'ar' | 'es';
export type Theme = 'dark' | 'light';

export type ExpenseCategory =
  | 'rent'
  | 'groceries'
  | 'transport'
  | 'subscriptions'
  | 'dining'
  | 'healthcare'
  | 'utilities'
  | 'clothing'
  | 'education'
  | 'entertainment'
  | 'travel'
  | 'gifts'
  | 'other';

export type IncomeType = 'salary' | 'freelance' | 'dividend' | 'rental' | 'other';
export type InvestmentAccountType = 'CTO' | 'PEA' | 'PEA-PME' | 'AV' | 'RRSP' | '401k' | 'other';
export type GoalStatus = 'active' | 'paused' | 'completed';
export type AssetClass = 'equity' | 'bond' | 'cash' | 'real_estate' | 'commodity' | 'crypto';
export type HalalStatus = 'halal' | 'doubtful' | 'non_halal' | 'unscreened';

// ─── INCOME ──────────────────────────────────────────────────────────────────

export interface IncomeSource {
  id: string;
  name: string;
  type: IncomeType;
  amount: number;
  currency: Currency;
  /** day of month payment received (1–31) */
  paymentDay: number;
  isActive: boolean;
  /** fraction that is non-halal (for purification); 0–1 */
  nonHalalFraction: number;
  notes: string;
}

// ─── TRANSACTIONS ─────────────────────────────────────────────────────────────

export interface Transaction {
  id: string;
  date: string; // ISO date string
  category: ExpenseCategory;
  description: string;
  amount: number;
  currency: Currency;
  isRecurring: boolean;
  tags: string[];
}

// ─── BUDGET ──────────────────────────────────────────────────────────────────

export interface BudgetTarget {
  id: string;
  category: ExpenseCategory;
  monthlyLimit: number;
  currency: Currency;
}

// ─── INVESTMENTS ─────────────────────────────────────────────────────────────

export interface ETFHolding {
  id: string;
  ticker: string;
  name: string;
  shares: number;
  /** most-recently entered price per share in account currency */
  pricePerShare: number;
  targetAllocationPct: number; // 0–100
  assetClass: AssetClass;
  halalStatus: HalalStatus;
  /** % of revenue from non-halal sources (for purification) */
  nonHalalRevenuePct: number;
  currency: Currency;
}

export interface InvestmentAccount {
  id: string;
  name: string;
  type: InvestmentAccountType;
  currency: Currency;
  holdings: ETFHolding[];
  cashBalance: number;
  notes: string;
}

// ─── SAVINGS GOALS ───────────────────────────────────────────────────────────

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  currency: Currency;
  targetDate: string | null; // ISO date
  status: GoalStatus;
  icon: string; // emoji
  notes: string;
}

// ─── SHARIAH ─────────────────────────────────────────────────────────────────

export interface ZakatAsset {
  id: string;
  name: string;
  value: number;
  isZakatable: boolean;
}

export interface ShariahSettings {
  enabled: boolean;
  /** Nisab threshold in the user's primary currency */
  nisabValue: number;
  /** hijri date of last zakat payment */
  lastZakatDate: string | null;
}

// ─── SETTINGS ────────────────────────────────────────────────────────────────

export interface AppSettings {
  currency: Currency;
  locale: Locale;
  theme: Theme;
  savingsRateTarget: number; // percentage 0–100
  /** monthly net income expectation, used for savings-rate calc */
  expectedMonthlyNet: number;
}

// ─── ROOT MODEL ──────────────────────────────────────────────────────────────

export interface AppState {
  settings: AppSettings;
  incomeSources: IncomeSource[];
  transactions: Transaction[];
  budgetTargets: BudgetTarget[];
  investmentAccounts: InvestmentAccount[];
  savingsGoals: SavingsGoal[];
  zakatAssets: ZakatAsset[];
  shariahSettings: ShariahSettings;
}
