import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useTranslation } from '../../hooks/useTranslation';
import { useAppStore } from '../../store/AppContext';
import { InputField, SelectField } from '../common/FormField';
import { Button } from '../common/Button';
import type { SavingsGoal } from '../../models';

const CURRENCIES: SavingsGoal['currency'][] = ['EUR','USD','GBP','MAD','SAR','AED'];
const ICONS = ['🛡️','🏠','🔥','✈️','🎓','💍','🚗','📦','🌍','💻','🏖️','🎯'];

interface Props {
  initial: SavingsGoal | null;
  onSave: (g: SavingsGoal) => void;
  onCancel: () => void;
}

export function GoalForm({ initial, onSave, onCancel }: Props) {
  const { t } = useTranslation();
  const { state } = useAppStore();
  const [form, setForm] = useState<SavingsGoal>(
    initial ?? {
      id: uuidv4(),
      name: '',
      targetAmount: 0,
      currentAmount: 0,
      currency: state.settings.currency,
      targetDate: null,
      status: 'active',
      icon: '🎯',
      notes: '',
    }
  );

  const set = <K extends keyof SavingsGoal>(k: K, v: SavingsGoal[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || form.targetAmount <= 0) return;
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="col-span-full">
          <InputField label={t('savings.name')} value={form.name}
            onChange={(e) => set('name', e.target.value)} placeholder="e.g. Emergency Fund" required />
        </div>
        <InputField label={t('savings.target')} type="number" min={0} step={1}
          value={form.targetAmount} onChange={(e) => set('targetAmount', parseFloat(e.target.value) || 0)} required />
        <InputField label={t('savings.current')} type="number" min={0} step={1}
          value={form.currentAmount} onChange={(e) => set('currentAmount', parseFloat(e.target.value) || 0)} />
        <SelectField label={t('common.currency')} value={form.currency}
          onChange={(e) => set('currency', e.target.value as SavingsGoal['currency'])}>
          {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </SelectField>
        <InputField label={t('savings.targetDate')} type="date"
          value={form.targetDate ?? ''}
          onChange={(e) => set('targetDate', e.target.value || null)} />
        <div className="col-span-full">
          <label className="text-xs font-medium text-gray-400 block mb-1">{t('savings.icon')}</label>
          <div className="flex flex-wrap gap-2">
            {ICONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => set('icon', emoji)}
                className={`text-xl p-1.5 rounded-lg border transition-colors ${
                  form.icon === emoji
                    ? 'border-emerald-500 bg-emerald-500/20'
                    : 'border-gray-600 hover:border-gray-500'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
        <div className="col-span-full">
          <InputField label={t('savings.notes')} value={form.notes}
            onChange={(e) => set('notes', e.target.value)} placeholder="Optional notes…" />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>{t('common.cancel')}</Button>
        <Button type="submit">{t('common.save')}</Button>
      </div>
    </form>
  );
}
