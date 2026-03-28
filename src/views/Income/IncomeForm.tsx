import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useTranslation } from '../../hooks/useTranslation';
import { useAppStore } from '../../store/AppContext';
import { InputField, SelectField, CheckboxField } from '../common/FormField';
import { Button } from '../common/Button';
import type { IncomeSource } from '../../models';

const INCOME_TYPES: IncomeSource['type'][] = ['salary', 'freelance', 'dividend', 'rental', 'other'];
const CURRENCIES: IncomeSource['currency'][] = ['EUR', 'USD', 'GBP', 'MAD', 'SAR', 'AED'];

interface Props {
  initial: IncomeSource | null;
  onSave: (src: IncomeSource) => void;
  onCancel: () => void;
}

export function IncomeForm({ initial, onSave, onCancel }: Props) {
  const { t } = useTranslation();
  const { state } = useAppStore();

  const [form, setForm] = useState<IncomeSource>(
    initial ?? {
      id: uuidv4(),
      name: '',
      type: 'salary',
      amount: 0,
      currency: state.settings.currency,
      paymentDay: 28,
      isActive: true,
      nonHalalFraction: 0,
      notes: '',
    }
  );

  const set = <K extends keyof IncomeSource>(k: K, v: IncomeSource[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || form.amount <= 0) return;
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <InputField
            label={t('income.name')}
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="e.g. Monthly Salary"
            required
          />
        </div>
        <SelectField label={t('income.type')} value={form.type} onChange={(e) => set('type', e.target.value as IncomeSource['type'])}>
          {INCOME_TYPES.map((t_) => <option key={t_} value={t_}>{t(`income.types.${t_}`)}</option>)}
        </SelectField>
        <SelectField label={t('common.currency')} value={form.currency} onChange={(e) => set('currency', e.target.value as IncomeSource['currency'])}>
          {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </SelectField>
        <InputField
          label={t('income.amount')}
          type="number"
          min={0}
          step={0.01}
          value={form.amount}
          onChange={(e) => set('amount', parseFloat(e.target.value) || 0)}
          required
        />
        <InputField
          label={t('income.paymentDay')}
          type="number"
          min={1}
          max={31}
          value={form.paymentDay}
          onChange={(e) => set('paymentDay', parseInt(e.target.value) || 1)}
        />
        <InputField
          label={t('income.nonHalalFraction')}
          type="number"
          min={0}
          max={1}
          step={0.001}
          value={form.nonHalalFraction}
          onChange={(e) => set('nonHalalFraction', parseFloat(e.target.value) || 0)}
          hint="0 = fully halal · 1 = fully non-halal"
        />
        <div className="flex items-end pb-1">
          <CheckboxField
            label={t('income.active')}
            checked={form.isActive}
            onChange={(v) => set('isActive', v)}
          />
        </div>
        <div className="col-span-2">
          <InputField
            label={t('income.notes')}
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            placeholder="Optional notes…"
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
