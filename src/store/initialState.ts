import type { AppState } from '../models';

// Helper to build ISO date strings relative to today
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

export const initialState: AppState = {
  settings: {
    currency: 'EUR',
    locale: 'en',
    theme: 'dark',
    savingsRateTarget: 25,
    expectedMonthlyNet: 3200,
  },

  incomeSources: [
    {
      id: 'inc-1',
      name: 'Monthly Salary',
      type: 'salary',
      amount: 3500,
      currency: 'EUR',
      paymentDay: 28,
      isActive: true,
      nonHalalFraction: 0,
      notes: 'Net after tax',
    },
    {
      id: 'inc-2',
      name: 'Freelance Design',
      type: 'freelance',
      amount: 650,
      currency: 'EUR',
      paymentDay: 15,
      isActive: true,
      nonHalalFraction: 0,
      notes: 'Variable – average monthly',
    },
    {
      id: 'inc-3',
      name: 'ETF Dividends',
      type: 'dividend',
      amount: 45,
      currency: 'EUR',
      paymentDay: 1,
      isActive: true,
      nonHalalFraction: 0.03,
      notes: 'Mixed ETF dividends – 3% purification applied',
    },
  ],

  transactions: [
    // Current month
    { id: 'tx-01', date: daysAgo(2),  category: 'rent',          description: 'Monthly rent',         amount: 850,  currency: 'EUR', isRecurring: true,  tags: ['housing'] },
    { id: 'tx-02', date: daysAgo(3),  category: 'groceries',     description: 'Lidl weekly shop',      amount: 78,   currency: 'EUR', isRecurring: false, tags: [] },
    { id: 'tx-03', date: daysAgo(5),  category: 'transport',     description: 'Metro monthly pass',    amount: 90,   currency: 'EUR', isRecurring: true,  tags: ['commute'] },
    { id: 'tx-04', date: daysAgo(6),  category: 'subscriptions', description: 'Spotify',               amount: 10.99,currency: 'EUR', isRecurring: true,  tags: ['entertainment'] },
    { id: 'tx-05', date: daysAgo(7),  category: 'dining',        description: 'Restaurant with family',amount: 65,   currency: 'EUR', isRecurring: false, tags: ['social'] },
    { id: 'tx-06', date: daysAgo(8),  category: 'groceries',     description: 'Carrefour',             amount: 102,  currency: 'EUR', isRecurring: false, tags: [] },
    { id: 'tx-07', date: daysAgo(10), category: 'healthcare',    description: 'Pharmacy',              amount: 24,   currency: 'EUR', isRecurring: false, tags: [] },
    { id: 'tx-08', date: daysAgo(12), category: 'subscriptions', description: 'Netflix',               amount: 15.99,currency: 'EUR', isRecurring: true,  tags: ['entertainment'] },
    { id: 'tx-09', date: daysAgo(14), category: 'dining',        description: 'Lunch with colleagues', amount: 18,   currency: 'EUR', isRecurring: false, tags: ['work'] },
    { id: 'tx-10', date: daysAgo(15), category: 'groceries',     description: 'Monoprix',              amount: 89,   currency: 'EUR', isRecurring: false, tags: [] },
    { id: 'tx-11', date: daysAgo(16), category: 'utilities',     description: 'Electricity bill',      amount: 68,   currency: 'EUR', isRecurring: true,  tags: [] },
    { id: 'tx-12', date: daysAgo(18), category: 'subscriptions', description: 'iCloud 50GB',           amount: 0.99, currency: 'EUR', isRecurring: true,  tags: [] },
    { id: 'tx-13', date: daysAgo(20), category: 'dining',        description: 'Takeaway',              amount: 32,   currency: 'EUR', isRecurring: false, tags: [] },
    { id: 'tx-14', date: daysAgo(22), category: 'transport',     description: 'Fuel',                  amount: 55,   currency: 'EUR', isRecurring: false, tags: ['car'] },
    { id: 'tx-15', date: daysAgo(25), category: 'education',     description: 'Udemy course',          amount: 19.99,currency: 'EUR', isRecurring: false, tags: ['learning'] },
    // Previous month
    { id: 'tx-16', date: daysAgo(32), category: 'rent',          description: 'Monthly rent',         amount: 850,  currency: 'EUR', isRecurring: true,  tags: ['housing'] },
    { id: 'tx-17', date: daysAgo(34), category: 'groceries',     description: 'Weekly shop',          amount: 95,   currency: 'EUR', isRecurring: false, tags: [] },
    { id: 'tx-18', date: daysAgo(36), category: 'dining',        description: 'Birthday dinner',      amount: 85,   currency: 'EUR', isRecurring: false, tags: ['social'] },
    { id: 'tx-19', date: daysAgo(38), category: 'healthcare',    description: 'GP consultation',      amount: 25,   currency: 'EUR', isRecurring: false, tags: [] },
    { id: 'tx-20', date: daysAgo(40), category: 'transport',     description: 'Metro pass',           amount: 90,   currency: 'EUR', isRecurring: true,  tags: ['commute'] },
    { id: 'tx-21', date: daysAgo(42), category: 'entertainment', description: 'Concert tickets',      amount: 55,   currency: 'EUR', isRecurring: false, tags: [] },
    { id: 'tx-22', date: daysAgo(44), category: 'groceries',     description: 'Lidl',                 amount: 72,   currency: 'EUR', isRecurring: false, tags: [] },
    { id: 'tx-23', date: daysAgo(46), category: 'utilities',     description: 'Electricity',          amount: 71,   currency: 'EUR', isRecurring: true,  tags: [] },
    { id: 'tx-24', date: daysAgo(50), category: 'clothing',      description: 'Winter coat',          amount: 129,  currency: 'EUR', isRecurring: false, tags: [] },
    { id: 'tx-25', date: daysAgo(55), category: 'travel',        description: 'Weekend trip hotel',   amount: 180,  currency: 'EUR', isRecurring: false, tags: ['vacation'] },
  ],

  budgetTargets: [
    { id: 'bud-1', category: 'rent',          monthlyLimit: 900,  currency: 'EUR' },
    { id: 'bud-2', category: 'groceries',     monthlyLimit: 350,  currency: 'EUR' },
    { id: 'bud-3', category: 'transport',     monthlyLimit: 160,  currency: 'EUR' },
    { id: 'bud-4', category: 'subscriptions', monthlyLimit: 50,   currency: 'EUR' },
    { id: 'bud-5', category: 'dining',        monthlyLimit: 150,  currency: 'EUR' },
    { id: 'bud-6', category: 'healthcare',    monthlyLimit: 80,   currency: 'EUR' },
    { id: 'bud-7', category: 'utilities',     monthlyLimit: 100,  currency: 'EUR' },
    { id: 'bud-8', category: 'entertainment', monthlyLimit: 80,   currency: 'EUR' },
  ],

  investmentAccounts: [
    {
      id: 'acc-1',
      name: 'CTO – Boursorama',
      type: 'CTO',
      currency: 'EUR',
      cashBalance: 250,
      notes: 'General brokerage account',
      holdings: [
        { id: 'h-1', ticker: 'IGDA', name: 'iShares MSCI EM Asia ETF',         shares: 45,  pricePerShare: 62.40,  targetAllocationPct: 30, assetClass: 'equity', halalStatus: 'doubtful',   nonHalalRevenuePct: 4.2, currency: 'EUR' },
        { id: 'h-2', ticker: 'HIUS', name: 'HSBC MSCI USA ETF',                shares: 60,  pricePerShare: 48.10,  targetAllocationPct: 30, assetClass: 'equity', halalStatus: 'doubtful',   nonHalalRevenuePct: 3.8, currency: 'EUR' },
        { id: 'h-3', ticker: 'HIES', name: 'HSBC MSCI Europe Sustainable ETF', shares: 38,  pricePerShare: 35.70,  targetAllocationPct: 20, assetClass: 'equity', halalStatus: 'halal',      nonHalalRevenuePct: 1.2, currency: 'EUR' },
        { id: 'h-4', ticker: 'SGLN', name: 'Invesco Physical Gold ETF',        shares: 12,  pricePerShare: 212.50, targetAllocationPct: 20, assetClass: 'commodity', halalStatus: 'halal',   nonHalalRevenuePct: 0,   currency: 'EUR' },
      ],
    },
    {
      id: 'acc-2',
      name: 'PEA – Fortuneo',
      type: 'PEA',
      currency: 'EUR',
      cashBalance: 120,
      notes: 'Tax-advantaged French account',
      holdings: [
        { id: 'h-5', ticker: 'ISDW', name: 'iShares MSCI World Swap ETF',     shares: 80,  pricePerShare: 52.30,  targetAllocationPct: 60, assetClass: 'equity', halalStatus: 'unscreened', nonHalalRevenuePct: 5.0, currency: 'EUR' },
        { id: 'h-6', ticker: 'ISDE', name: 'iShares MSCI EM Swap ETF',        shares: 55,  pricePerShare: 38.90,  targetAllocationPct: 40, assetClass: 'equity', halalStatus: 'unscreened', nonHalalRevenuePct: 5.0, currency: 'EUR' },
      ],
    },
  ],

  savingsGoals: [
    {
      id: 'goal-1',
      name: 'Emergency Fund',
      targetAmount: 12000,
      currentAmount: 7200,
      currency: 'EUR',
      targetDate: null,
      status: 'active',
      icon: '🛡️',
      notes: '6 months of expenses',
    },
    {
      id: 'goal-2',
      name: 'Housing Deposit',
      targetAmount: 40000,
      currentAmount: 9500,
      currency: 'EUR',
      targetDate: '2028-06-01',
      status: 'active',
      icon: '🏠',
      notes: '20% deposit for a flat',
    },
    {
      id: 'goal-3',
      name: 'Early Retirement (FIRE)',
      targetAmount: 600000,
      currentAmount: 16800,
      currency: 'EUR',
      targetDate: '2045-01-01',
      status: 'active',
      icon: '🔥',
      notes: '25× annual expenses – 4% rule',
    },
    {
      id: 'goal-4',
      name: 'Travel Fund',
      targetAmount: 3000,
      currentAmount: 1100,
      currency: 'EUR',
      targetDate: '2025-08-01',
      status: 'active',
      icon: '✈️',
      notes: 'Summer trip',
    },
  ],

  zakatAssets: [
    { id: 'z-1', name: 'Bank savings (current + savings)',  value: 8500,  isZakatable: true },
    { id: 'z-2', name: 'CTO investments (equity portion)',  value: 7800,  isZakatable: true },
    { id: 'z-3', name: 'PEA investments',                   value: 6300,  isZakatable: true },
    { id: 'z-4', name: 'Physical gold (SGLN)',               value: 2550,  isZakatable: true },
    { id: 'z-5', name: 'Cash on hand',                      value: 300,   isZakatable: true },
    { id: 'z-6', name: 'Car (personal use – not zakatable)',value: 8000,  isZakatable: false },
    { id: 'z-7', name: 'Laptop & equipment',                value: 2000,  isZakatable: false },
  ],

  shariahSettings: {
    enabled: true,
    nisabValue: 5000,
    lastZakatDate: null,
  },
};
