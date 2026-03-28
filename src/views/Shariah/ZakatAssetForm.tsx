import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useTranslation } from '../../hooks/useTranslation';
import { InputField, CheckboxField } from '../common/FormField';
import { Button } from '../common/Button';
import type { ZakatAsset } from '../../models';

interface Props {
  initial: ZakatAsset | null;
  onSave: (a: ZakatAsset) => void;
  onCancel: () => void;
}

export function ZakatAssetForm({ initial, onSave, onCancel }: Props) {
  const { t } = useTranslation();
  const [form, setForm] = useState<ZakatAsset>(
    initial ?? { id: uuidv4(), name: '', value: 0, isZakatable: true }
  );
  const set = <K extends keyof ZakatAsset>(k: K, v: ZakatAsset[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || form.value < 0) return;
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <InputField label={t('shariah.assetName')} value={form.name}
        onChange={(e) => set('name', e.target.value)} placeholder="e.g. Bank savings" required />
      <InputField label={t('shariah.assetValue')} type="number" min={0} step={1}
        value={form.value} onChange={(e) => set('value', parseFloat(e.target.value) || 0)} required />
      <CheckboxField
        label={t('shariah.isZakatable')}
        checked={form.isZakatable}
        onChange={(v) => set('isZakatable', v)}
      />
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>{t('common.cancel')}</Button>
        <Button type="submit">{t('common.save')}</Button>
      </div>
    </form>
  );
}
