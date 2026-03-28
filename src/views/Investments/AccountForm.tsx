import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useTranslation } from '../../hooks/useTranslation';
import { useAppStore } from '../../store/AppContext';
import { InputField, SelectField } from '../common/FormField';
import { Button } from '../common/Button';
import type { InvestmentAccount } from '../../models';

const ACCOUNT_TYPES: InvestmentAccount['type'][] = ['CTO','PEA','PEA-PME','AV','RRSP','401k','other'];
const CURRENCIES: InvestmentAccount['currency'][] = ['EUR','USD','GBP','MAD','SAR','AED'];

interface Props {
  initial: InvestmentAccount | null;
  onSave: (acc: InvestmentAccount) => void;
  onCancel: () => void;
}

export function AccountForm({ initial, onSave, onCancel }: Props) {
  const { t } = useTranslation();
  const { state } = useAppStore();
  const [form, setForm] = useState<InvestmentAccount>(
    initial ?? {
      id: uuidv4(),
      name: '',
      type: 'CTO',
      currency: state.settings.currency,
      cashBalance: 0,
      holdings: [],
      notes: '',
    }
  );

  const set = <K extends keyof InvestmentAccount>(k: K, v: InvestmentAccount[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="col-span-full">
          <InputField label={t('investments.accountName')} value={form.name}
            onChange={(e) => set('name', e.target.value)} placeholder="e.g. CTO Boursorama" required />
        </div>
        <SelectField label={t('investments.accountType')} value={form.type}
          onChange={(e) => set('type', e.target.value as InvestmentAccount['type'])}>
          {ACCOUNT_TYPES.map((t_) => <option key={t_} value={t_}>{t_}</option>)}
        </SelectField>
        <SelectField label={t('common.currency')} value={form.currency}
          onChange={(e) => set('currency', e.target.value as InvestmentAccount['currency'])}>
          {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </SelectField>
        <div className="col-span-full">
          <InputField label={t('investments.cash')} type="number" min={0} step={0.01}
            value={form.cashBalance} onChange={(e) => set('cashBalance', parseFloat(e.target.value) || 0)} />
        </div>
        <div className="col-span-full">
          <InputField label="Notes" value={form.notes}
            onChange={(e) => set('notes', e.target.value)} placeholder="Optional…" />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>{t('common.cancel')}</Button>
        <Button type="submit">{t('common.save')}</Button>
      </div>
    </form>
  );
}
