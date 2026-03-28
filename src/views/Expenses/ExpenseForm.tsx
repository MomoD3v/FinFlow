import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useTranslation } from '../../hooks/useTranslation';
import { useAppStore } from '../../store/AppContext';
import { InputField, SelectField, CheckboxField } from '../common/FormField';
import { Button } from '../common/Button';
import type { Transaction, ExpenseCategory } from '../../models';

const CATEGORIES: ExpenseCategory[] = [
  'rent','groceries','transport','subscriptions','dining',
  'healthcare','utilities','clothing','education','entertainment','travel','gifts','other',
];
const CURRENCIES: Transaction['currency'][] = ['EUR','USD','GBP','MAD','SAR','AED'];

interface Props {
  initial: Transaction | null;
  onSave: (tx: Transaction) => void;
  onCancel: () => void;
}

export function ExpenseForm({ initial, onSave, onCancel }: Props) {
  const { t } = useTranslation();
  const { state } = useAppStore();

  const [form, setForm] = useState<Transaction>(
    initial ?? {
      id: uuidv4(),
      date: new Date().toISOString().split('T')[0],
      category: 'other',
      description: '',
      amount: 0,
      currency: state.settings.currency,
      isRecurring: false,
      tags: [],
    }
  );

  const set = <K extends keyof Transaction>(k: K, v: Transaction[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.description.trim() || form.amount <= 0) return;
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <InputField
            label={t('expenses.description')}
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="e.g. Monthly rent"
            required
          />
        </div>
        <InputField
          label={t('expenses.date')}
          type="date"
          value={form.date}
          onChange={(e) => set('date', e.target.value)}
          required
        />
        <SelectField
          label={t('expenses.category')}
          value={form.category}
          onChange={(e) => set('category', e.target.value as ExpenseCategory)}
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{t(`categories.${c}`)}</option>
          ))}
        </SelectField>
        <InputField
          label={t('expenses.amount')}
          type="number"
          min={0}
          step={0.01}
          value={form.amount}
          onChange={(e) => set('amount', parseFloat(e.target.value) || 0)}
          required
        />
        <SelectField
          label={t('common.currency')}
          value={form.currency}
          onChange={(e) => set('currency', e.target.value as Transaction['currency'])}
        >
          {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </SelectField>
        <div className="col-span-2 flex items-center">
          <CheckboxField
            label={t('expenses.recurring')}
            checked={form.isRecurring}
            onChange={(v) => set('isRecurring', v)}
          />
        </div>
        <div className="col-span-2">
          <InputField
            label={`${t('expenses.tags')} (semicolon-separated)`}
            value={form.tags.join(';')}
            onChange={(e) =>
              set('tags', e.target.value.split(';').map((s) => s.trim()).filter(Boolean))
            }
            placeholder="e.g. housing;essential"
          />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>{t('common.cancel')}</Button>
        <Button type="submit">{t('common.save')}</Button>
      </div>
    </form>
  );
}
