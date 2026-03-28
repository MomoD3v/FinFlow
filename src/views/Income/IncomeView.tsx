import React, { useState } from 'react';
import { Plus, Edit2, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { useAppStore } from '../../store/AppContext';
import { useTranslation } from '../../hooks/useTranslation';
import { formatCurrency, formatPercent } from '../../utils/currency';
import { calcMonthlyIncome } from '../../utils/calculations';
import { SectionHeader } from '../common/SectionHeader';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { IncomeForm } from './IncomeForm';
import type { IncomeSource } from '../../models';

const TYPE_COLORS: Record<IncomeSource['type'], string> = {
  salary:    'bg-emerald-500/20 text-emerald-400',
  freelance: 'bg-blue-500/20 text-blue-400',
  dividend:  'bg-purple-500/20 text-purple-400',
  rental:    'bg-amber-500/20 text-amber-400',
  other:     'bg-gray-500/20 text-gray-400',
};

export function IncomeView() {
  const { state, dispatch } = useAppStore();
  const { t } = useTranslation();
  const { currency, locale } = state.settings;
  const fmt = (n: number) => formatCurrency(n, currency, locale);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<IncomeSource | null>(null);

  const totalMonthly = calcMonthlyIncome(state);

  const handleDelete = (id: string) => {
    if (confirm(t('common.confirm') + '?')) {
      dispatch({ type: 'INCOME_DELETE', payload: { id } });
    }
  };

  return (
    <div>
      <SectionHeader
        title={t('income.title')}
        subtitle={`${t('income.totalMonthly')}: ${fmt(totalMonthly)} / ${t('common.monthly')} · ${fmt(totalMonthly * 12)} / ${t('common.annual')}`}
        action={
          <Button icon={<Plus size={16} />} onClick={() => { setEditing(null); setShowForm(true); }}>
            {t('income.add')}
          </Button>
        }
      />

      <div className="space-y-3">
        {state.incomeSources.length === 0 && (
          <p className="text-gray-500 text-center py-16">{t('common.noData')}</p>
        )}
        {state.incomeSources.map((src) => (
          <div
            key={src.id}
            className={`bg-gray-800/50 border border-gray-700 rounded-2xl p-4 flex items-center gap-4 ${!src.isActive ? 'opacity-50' : ''}`}
          >
            {/* Active indicator */}
            {src.isActive
              ? <CheckCircle size={18} className="text-emerald-400 flex-shrink-0" />
              : <XCircle size={18} className="text-gray-600 flex-shrink-0" />
            }

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-white">{src.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[src.type]}`}>
                  {t(`income.types.${src.type}`)}
                </span>
                {src.nonHalalFraction > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-medium">
                    {formatPercent(src.nonHalalFraction * 100)} non-halal
                  </span>
                )}
              </div>
              {src.notes && <p className="text-xs text-gray-500 mt-0.5 truncate">{src.notes}</p>}
              <p className="text-xs text-gray-600 mt-0.5">
                {t('income.paymentDay')}: {src.paymentDay}
              </p>
            </div>

            <div className="text-right flex-shrink-0">
              <p className="text-lg font-bold text-white">{fmt(src.amount)}</p>
              <p className="text-xs text-gray-500">{t('common.monthly')}</p>
              <p className="text-xs text-gray-600">{fmt(src.amount * 12)} / yr</p>
            </div>

            <div className="flex gap-1 flex-shrink-0">
              <button
                onClick={() => { setEditing(src); setShowForm(true); }}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
              >
                <Edit2 size={15} />
              </button>
              <button
                onClick={() => handleDelete(src.id)}
                className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Summary card */}
      {state.incomeSources.length > 0 && (
        <div className="mt-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex justify-between items-center">
          <span className="text-sm font-medium text-emerald-400">{t('income.totalMonthly')}</span>
          <div className="text-right">
            <p className="text-xl font-bold text-white">{fmt(totalMonthly)}</p>
            <p className="text-xs text-gray-500">{fmt(totalMonthly * 12)} / year</p>
          </div>
        </div>
      )}

      {showForm && (
        <Modal
          title={editing ? t('income.edit') : t('income.add')}
          onClose={() => setShowForm(false)}
        >
          <IncomeForm
            initial={editing}
            onSave={(src) => {
              dispatch(editing
                ? { type: 'INCOME_UPDATE', payload: src }
                : { type: 'INCOME_ADD', payload: src }
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
