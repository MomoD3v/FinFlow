import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useTranslation } from '../../hooks/useTranslation';
import { useAppStore } from '../../store/AppContext';
import { InputField, SelectField } from '../common/FormField';
import { Button } from '../common/Button';
import type { ETFHolding } from '../../models';

const HALAL_STATUSES: ETFHolding['halalStatus'][] = ['halal','doubtful','non_halal','unscreened'];
const ASSET_CLASSES: ETFHolding['assetClass'][] = ['equity','bond','cash','real_estate','commodity','crypto'];
const CURRENCIES: ETFHolding['currency'][] = ['EUR','USD','GBP','MAD','SAR','AED'];

interface Props {
  accountId: string;
  initial: ETFHolding | null;
  onSave: (h: ETFHolding) => void;
  onCancel: () => void;
}

export function HoldingForm({ initial, onSave, onCancel }: Props) {
  const { t } = useTranslation();
  const { state } = useAppStore();
  const [form, setForm] = useState<ETFHolding>(
    initial ?? {
      id: uuidv4(),
      ticker: '',
      name: '',
      shares: 0,
      pricePerShare: 0,
      targetAllocationPct: 0,
      assetClass: 'equity',
      halalStatus: 'unscreened',
      nonHalalRevenuePct: 0,
      currency: state.settings.currency,
    }
  );

  const set = <K extends keyof ETFHolding>(k: K, v: ETFHolding[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.ticker.trim() || form.shares < 0) return;
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <InputField label={t('investments.ticker')} value={form.ticker}
          onChange={(e) => set('ticker', e.target.value.toUpperCase())} placeholder="e.g. IWDA" required />
        <SelectField label={t('common.currency')} value={form.currency}
          onChange={(e) => set('currency', e.target.value as ETFHolding['currency'])}>
          {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </SelectField>
        <div className="col-span-2">
          <InputField label={t('investments.holdingName')} value={form.name}
            onChange={(e) => set('name', e.target.value)} placeholder="e.g. iShares MSCI World" />
        </div>
        <InputField label={t('investments.shares')} type="number" min={0} step={0.001}
          value={form.shares} onChange={(e) => set('shares', parseFloat(e.target.value) || 0)} required />
        <InputField label={t('investments.price')} type="number" min={0} step={0.01}
          value={form.pricePerShare} onChange={(e) => set('pricePerShare', parseFloat(e.target.value) || 0)} required />
        <InputField label={t('investments.targetAlloc')} type="number" min={0} max={100} step={0.1}
          value={form.targetAllocationPct} onChange={(e) => set('targetAllocationPct', parseFloat(e.target.value) || 0)} />
        <SelectField label={t('investments.assetClass')} value={form.assetClass}
          onChange={(e) => set('assetClass', e.target.value as ETFHolding['assetClass'])}>
          {ASSET_CLASSES.map((a) => <option key={a} value={a}>{a}</option>)}
        </SelectField>
        <SelectField label={t('investments.halalStatus')} value={form.halalStatus}
          onChange={(e) => set('halalStatus', e.target.value as ETFHolding['halalStatus'])}>
          {HALAL_STATUSES.map((s) => <option key={s} value={s}>{t(`investments.${s === 'non_halal' ? 'nonHalal' : s}`)}</option>)}
        </SelectField>
        <div className="col-span-2">
          <InputField label="Non-halal revenue % (for purification)" type="number" min={0} max={100} step={0.1}
            value={form.nonHalalRevenuePct}
            onChange={(e) => set('nonHalalRevenuePct', parseFloat(e.target.value) || 0)}
            hint="Enter the % of revenue from non-halal sources per the fund screener" />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>{t('common.cancel')}</Button>
        <Button type="submit">{t('common.save')}</Button>
      </div>
    </form>
  );
}
