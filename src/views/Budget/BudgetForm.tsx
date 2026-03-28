import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useTranslation } from '../../hooks/useTranslation';
import { useAppStore } from '../../store/AppContext';
import { InputField, SelectField } from '../common/FormField';
import { Button } from '../common/Button';
import type { BudgetTarget, ExpenseCategory } from '../../models';

const CATEGORIES: ExpenseCategory[] = [
  'rent','groceries','transport','subscriptions','dining',
  'healthcare','utilities','clothing','education','entertainment','travel','gifts','other',
];
const CURRENCIES: BudgetTarget['currency'][] = ['EUR','USD','GBP','MAD','SAR','AED'];

interface Props {
  initial: BudgetTarget | null;
  onSave: (b: BudgetTarget) => void;
  onCancel: () => void;
}

export function BudgetForm({ initial, onSave, onCancel }: Props) {
  const { t } = useTranslation();
  const { state } = useAppStore();
  const [form, setForm] = useState<BudgetTarget>(
    initial ?? {
      id: uuidv4(),
      category: 'groceries',
      monthlyLimit: 0,
      currency: state.settings.currency,
    }
  );

  const set = <K extends keyof BudgetTarget>(k: K, v: BudgetTarget[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.monthlyLimit <= 0) return;
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <SelectField label={t('budget.category')} value={form.category}
            onChange={(e) => set('category', e.target.value as ExpenseCategory)}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{t(`categories.${c}`)}</option>
            ))}
          </SelectField>
        </div>
        <InputField label={t('budget.limit')} type="number" min={0} step={1}
          value={form.monthlyLimit} onChange={(e) => set('monthlyLimit', parseFloat(e.target.value) || 0)} required />
        <SelectField label={t('common.currency')} value={form.currency}
          onChange={(e) => set('currency', e.target.value as BudgetTarget['currency'])}>
          {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </SelectField>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>{t('common.cancel')}</Button>
        <Button type="submit">{t('common.save')}</Button>
      </div>
    </form>
  );
}
