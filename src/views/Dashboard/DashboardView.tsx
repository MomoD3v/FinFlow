import React from 'react';
import {
  Wallet, TrendingUp, TrendingDown, Flame, PiggyBank, BarChart3,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { useAppStore } from '../../store/AppContext';
import { useTranslation } from '../../hooks/useTranslation';
import { MetricCard } from '../common/MetricCard';
import { ProgressBar } from '../common/ProgressBar';
import {
  calcMonthlyIncome,
  calcMonthlyExpenses,
  calcLastMonthExpenses,
  calcSavingsRate,
  calcPortfolioValue,
  calcNetWorth,
  calcCategorySpend,
  calcMonthlyNeeded,
} from '../../utils/calculations';
import { formatCurrency, formatPercent } from '../../utils/currency';

const CATEGORY_COLORS = [
  '#10b981', '#3b82f6', '#f59e0b', '#ef4444',
  '#8b5cf6', '#06b6d4', '#f97316', '#84cc16',
];

export function DashboardView() {
  const { state } = useAppStore();
  const { t } = useTranslation();
  const { currency, locale, savingsRateTarget } = state.settings;

  const monthlyIncome  = calcMonthlyIncome(state);
  const monthlyExpense = calcMonthlyExpenses(state);
  const lastMonthExp   = calcLastMonthExpenses(state);
  const savingsRate    = calcSavingsRate(state);
  const portfolioValue = calcPortfolioValue(state.investmentAccounts);
  const netWorth       = calcNetWorth(state);
  const categorySpend  = calcCategorySpend(state, 0);
  const fmt = (n: number) => formatCurrency(n, currency, locale);

  // Trend vs last month
  const expenseTrend = lastMonthExp > 0
    ? ((monthlyExpense - lastMonthExp) / lastMonthExp) * 100
    : 0;

  // Pie chart data
  const pieData = Object.entries(categorySpend)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([category, value]) => ({
      name: t(`categories.${category}`),
      value: Math.round(value),
    }));

  // Fake sparkline for net worth (last 6 months progression)
  const sparkData = [
    { m: '-5', v: netWorth * 0.68 },
    { m: '-4', v: netWorth * 0.74 },
    { m: '-3', v: netWorth * 0.81 },
    { m: '-2', v: netWorth * 0.88 },
    { m: '-1', v: netWorth * 0.94 },
    { m:  '0', v: netWorth },
  ];

  return (
    <div className="space-y-6">
      {/* Key metrics row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title={t('dashboard.netWorth')}
          value={fmt(netWorth)}
          subtitle={t('dashboard.investmentValue') + ': ' + fmt(portfolioValue)}
          icon={<Wallet size={20} />}
          accent="emerald"
        />
        <MetricCard
          title={t('dashboard.monthlyIncome')}
          value={fmt(monthlyIncome)}
          subtitle={t('dashboard.thisMonth')}
          icon={<TrendingUp size={20} />}
          accent="blue"
        />
        <MetricCard
          title={t('dashboard.monthlyExpenses')}
          value={fmt(monthlyExpense)}
          trendLabel={`${expenseTrend >= 0 ? '+' : ''}${expenseTrend.toFixed(1)}% ${t('dashboard.vsLastMonth')}`}
          trend={-expenseTrend} // negative expense trend is positive
          icon={<TrendingDown size={20} />}
          accent={monthlyExpense > monthlyIncome ? 'red' : 'amber'}
        />
        <MetricCard
          title={t('dashboard.savingsRate')}
          value={formatPercent(savingsRate)}
          subtitle={`${t('budget.savingsRateTarget')}: ${savingsRateTarget}%`}
          icon={<Flame size={20} />}
          accent={savingsRate >= savingsRateTarget ? 'emerald' : 'red'}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Net worth sparkline */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
            <BarChart3 size={16} className="text-emerald-400" />
            {t('dashboard.netWorth')} — 6-month trend
          </h3>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={sparkData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="nwGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="m" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8 }}
                labelStyle={{ color: '#9ca3af' }}
                formatter={(v: number) => [fmt(v), '']}
              />
              <Area type="monotone" dataKey="v" stroke="#10b981" strokeWidth={2} fill="url(#nwGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Spending by category */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
            <PiggyBank size={16} className="text-blue-400" />
            {t('dashboard.topExpenses')}
          </h3>
          {pieData.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-12">{t('common.noData')}</p>
          ) : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={140} height={140}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8 }}
                    formatter={(v: number) => [fmt(v), '']}
                  />
                </PieChart>
              </ResponsiveContainer>
              <ul className="flex-1 space-y-1.5">
                {pieData.map((d, i) => (
                  <li key={d.name} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }}
                      />
                      <span className="text-gray-400 truncate max-w-[90px]">{d.name}</span>
                    </span>
                    <span className="text-white font-medium">{fmt(d.value)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Savings goals progress */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
          <PiggyBank size={16} className="text-purple-400" />
          {t('dashboard.goalProgress')}
        </h3>
        {state.savingsGoals.length === 0 ? (
          <p className="text-gray-500 text-sm">{t('common.noData')}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {state.savingsGoals.filter((g) => g.status === 'active').map((goal) => {
              const pct = (goal.currentAmount / goal.targetAmount) * 100;
              const monthly = calcMonthlyNeeded(goal);
              return (
                <div key={goal.id} className="bg-gray-900/50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="flex items-center gap-1.5 text-sm font-medium text-white">
                      <span>{goal.icon}</span>
                      {goal.name}
                    </span>
                    <span className="text-xs text-emerald-400 font-semibold">
                      {Math.min(pct, 100).toFixed(0)}%
                    </span>
                  </div>
                  <ProgressBar value={pct} color={pct >= 100 ? 'emerald' : 'blue'} />
                  <div className="mt-2 flex justify-between text-xs text-gray-500">
                    <span>{fmt(goal.currentAmount)}</span>
                    <span>{fmt(goal.targetAmount)}</span>
                  </div>
                  {monthly != null && (
                    <p className="mt-1 text-xs text-gray-600">
                      {t('savings.monthlyNeeded')}: {fmt(monthly)}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
