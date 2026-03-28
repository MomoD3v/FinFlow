import React, { useState } from 'react';
import { Plus, Edit2, Trash2, CheckCircle, PauseCircle } from 'lucide-react';
import { useAppStore } from '../../store/AppContext';
import { useTranslation } from '../../hooks/useTranslation';
import { formatCurrency } from '../../utils/currency';
import { calcMonthlyNeeded } from '../../utils/calculations';
import { SectionHeader } from '../common/SectionHeader';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { ProgressBar } from '../common/ProgressBar';
import { GoalForm } from './GoalForm';
import type { SavingsGoal } from '../../models';

export function SavingsView() {
  const { state, dispatch } = useAppStore();
  const { t } = useTranslation();
  const { currency, locale } = state.settings;
  const fmt = (n: number) => formatCurrency(n, currency, locale);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<SavingsGoal | null>(null);

  const totalSaved = state.savingsGoals.reduce((s, g) => s + g.currentAmount, 0);
  const totalTarget = state.savingsGoals.reduce((s, g) => s + g.targetAmount, 0);

  const handleDelete = (id: string) => {
    if (confirm(t('common.confirm') + '?'))
      dispatch({ type: 'GOAL_DELETE', payload: { id } });
  };

  const toggleStatus = (goal: SavingsGoal) => {
    const next: SavingsGoal['status'] =
      goal.status === 'active' ? 'paused' : 'active';
    dispatch({ type: 'GOAL_UPDATE', payload: { ...goal, status: next } });
  };

  return (
    <div>
      <SectionHeader
        title={t('savings.title')}
        subtitle={`${fmt(totalSaved)} ${t('common.of')} ${fmt(totalTarget)} total`}
        action={
          <Button icon={<Plus size={16} />} onClick={() => { setEditing(null); setShowForm(true); }}>
            {t('savings.add')}
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {state.savingsGoals.length === 0 && (
          <p className="text-gray-500 text-center col-span-2 py-16">{t('common.noData')}</p>
        )}
        {state.savingsGoals.map((goal) => {
          const pct = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
          const monthly = calcMonthlyNeeded(goal);
          const isCompleted = pct >= 100;

          return (
            <div
              key={goal.id}
              className={`bg-gray-800/50 border rounded-2xl p-5 ${
                isCompleted ? 'border-emerald-500/40' : 'border-gray-700'
              } ${goal.status === 'paused' ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{goal.icon}</span>
                  <div>
                    <h3 className="font-semibold text-white">{goal.name}</h3>
                    {goal.targetDate && (
                      <p className="text-xs text-gray-500">Target: {goal.targetDate}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => toggleStatus(goal)}
                    className="p-1.5 rounded-lg text-gray-500 hover:text-amber-400 hover:bg-amber-500/10 transition-colors">
                    {goal.status === 'paused' ? <CheckCircle size={14} /> : <PauseCircle size={14} />}
                  </button>
                  <button onClick={() => { setEditing(goal); setShowForm(true); }}
                    className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-700 transition-colors">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => handleDelete(goal.id)}
                    className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="mb-3">
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-gray-400">{t('savings.progress')}</span>
                  <span className={`font-semibold ${isCompleted ? 'text-emerald-400' : 'text-white'}`}>
                    {pct.toFixed(0)}%
                  </span>
                </div>
                <ProgressBar
                  value={pct}
                  color={isCompleted ? 'emerald' : goal.status === 'paused' ? 'amber' : 'blue'}
                />
              </div>

              <div className="flex justify-between text-sm">
                <div>
                  <p className="text-gray-500 text-xs">{t('savings.current')}</p>
                  <p className="font-bold text-white">{fmt(goal.currentAmount)}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-500 text-xs">{t('savings.target')}</p>
                  <p className="font-bold text-white">{fmt(goal.targetAmount)}</p>
                </div>
              </div>

              {!isCompleted && monthly != null && (
                <div className="mt-3 pt-3 border-t border-gray-700 flex justify-between text-xs">
                  <span className="text-gray-500">{t('savings.monthlyNeeded')}</span>
                  <span className="text-blue-400 font-semibold">{fmt(monthly)}</span>
                </div>
              )}

              {isCompleted && (
                <div className="mt-3 pt-3 border-t border-emerald-500/20 flex items-center gap-1.5 text-emerald-400 text-xs font-semibold">
                  <CheckCircle size={13} />
                  {t('savings.completed')}
                </div>
              )}

              {goal.notes && (
                <p className="mt-2 text-xs text-gray-600">{goal.notes}</p>
              )}
            </div>
          );
        })}
      </div>

      {showForm && (
        <Modal
          title={editing ? t('savings.edit') : t('savings.add')}
          onClose={() => setShowForm(false)}
        >
          <GoalForm
            initial={editing}
            onSave={(goal) => {
              dispatch(editing
                ? { type: 'GOAL_UPDATE', payload: goal }
                : { type: 'GOAL_ADD', payload: goal }
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
