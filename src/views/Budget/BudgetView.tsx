import React, { useState } from 'react';
import { Plus, Edit2, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { useAppStore } from '../../store/AppContext';
import { useTranslation } from '../../hooks/useTranslation';
import { formatCurrency } from '../../utils/currency';
import { calcBudgetUtilisation } from '../../utils/calculations';
import { SectionHeader } from '../common/SectionHeader';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { ProgressBar } from '../common/ProgressBar';
import { BudgetForm } from './BudgetForm';
import type { BudgetTarget } from '../../models';

export function BudgetView() {
  const { state, dispatch } = useAppStore();
  const { t } = useTranslation();
  const { currency, locale } = state.settings;
  const fmt = (n: number) => formatCurrency(n, currency, locale);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<BudgetTarget | null>(null);

  const utilisation = calcBudgetUtilisation(state);
  const totalBudget = utilisation.reduce((s, u) => s + u.limit, 0);
  const totalSpent  = utilisation.reduce((s, u) => s + u.spent, 0);
  const overCount   = utilisation.filter((u) => u.isOver).length;

  // Chart data
  const chartData = utilisation
    .sort((a, b) => b.spent - a.spent)
    .map((u) => ({
      name: t(`categories.${u.category}`).slice(0, 10),
      Budget: u.limit,
      Spent: u.spent,
    }));

  const handleDelete = (id: string) => {
    if (confirm(t('common.confirm') + '?'))
      dispatch({ type: 'BUDGET_DELETE', payload: { id } });
  };

  return (
    <div>
      <SectionHeader
        title={t('budget.title')}
        subtitle={`${fmt(totalSpent)} ${t('common.of')} ${fmt(totalBudget)} · ${overCount} over-budget`}
        action={
          <Button icon={<Plus size={16} />} onClick={() => { setEditing(null); setShowForm(true); }}>
            {t('budget.add')}
          </Button>
        }
      />

      {/* Summary alert */}
      {overCount > 0 && (
        <div className="mb-5 flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">
          <AlertTriangle size={16} />
          <span>{overCount} categor{overCount > 1 ? 'ies' : 'y'} {overCount > 1 ? 'are' : 'is'} over budget this month.</span>
        </div>
      )}

      {/* Bar chart */}
      {chartData.length > 0 && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-5 mb-6">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Budget vs Spent (this month)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 0, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} width={50}
                tickFormatter={(v) => `${v}`} />
              <Tooltip
                contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8 }}
                formatter={(v: number) => [fmt(v), '']}
              />
              <Legend wrapperStyle={{ color: '#9ca3af', fontSize: 12 }} />
              <Bar dataKey="Budget" fill="#3b82f6" radius={[4, 4, 0, 0]} opacity={0.6} />
              <Bar dataKey="Spent"  fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Budget rows */}
      <div className="space-y-3">
        {utilisation.length === 0 && (
          <p className="text-gray-500 text-center py-16">{t('common.noData')}</p>
        )}
        {utilisation.map((u) => {
          const target = state.budgetTargets.find((b) => b.id === u.id)!;
          const remaining = u.limit - u.spent;

          return (
            <div key={u.id} className={`bg-gray-800/50 border rounded-2xl p-4 ${u.isOver ? 'border-red-500/30' : 'border-gray-700'}`}>
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  {u.isOver
                    ? <AlertTriangle size={16} className="text-red-400 flex-shrink-0" />
                    : <CheckCircle size={16} className="text-emerald-400 flex-shrink-0" />
                  }
                  <span className="font-semibold text-white">{t(`categories.${u.category}`)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right text-sm">
                    <span className={u.isOver ? 'text-red-400 font-bold' : 'text-white font-semibold'}>{fmt(u.spent)}</span>
                    <span className="text-gray-500"> / {fmt(u.limit)}</span>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditing(target); setShowForm(true); }}
                      className="p-1.5 rounded text-gray-500 hover:text-white hover:bg-gray-700 transition-colors">
                      <Edit2 size={13} />
                    </button>
                    <button onClick={() => handleDelete(u.id)}
                      className="p-1.5 rounded text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
              <ProgressBar
                value={u.pct}
                color={u.isOver ? 'red' : u.pct > 80 ? 'amber' : 'emerald'}
                showLabel
              />
              <div className="mt-1.5 text-xs text-gray-600">
                {u.isOver
                  ? <span className="text-red-400">{t('budget.overBudget')}: {fmt(Math.abs(remaining))}</span>
                  : <span>{t('budget.remaining')}: {fmt(remaining)}</span>
                }
              </div>
            </div>
          );
        })}
      </div>

      {showForm && (
        <Modal
          title={editing ? t('budget.edit') : t('budget.add')}
          onClose={() => setShowForm(false)}
        >
          <BudgetForm
            initial={editing}
            onSave={(b) => {
              dispatch(editing
                ? { type: 'BUDGET_UPDATE', payload: b }
                : { type: 'BUDGET_ADD', payload: b }
              );
              setShowForm(false);
            }}
            onCancel={() => setShowForm(false)}
          />
        </Modal>
      )}
    </div>
  );
}
