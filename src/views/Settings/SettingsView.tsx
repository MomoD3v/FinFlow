import React, { useRef, useState } from 'react';
import { Download, Upload, Trash2, Sun, Moon } from 'lucide-react';
import { useAppStore } from '../../store/AppContext';
import { useTranslation } from '../../hooks/useTranslation';
import { SectionHeader } from '../common/SectionHeader';
import { SelectField, InputField } from '../common/FormField';
import { Button } from '../common/Button';
import { exportJSON, importJSON } from '../../utils/importExport';
import { initialState } from '../../store/initialState';
import type { Currency, Locale, Theme } from '../../models';

const CURRENCIES: Currency[] = ['EUR', 'USD', 'GBP', 'MAD', 'SAR', 'AED'];
const LOCALES: { value: Locale; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'Français' },
  { value: 'ar', label: 'العربية' },
  { value: 'es', label: 'Español' },
];

export function SettingsView() {
  const { state, dispatch } = useAppStore();
  const { t } = useTranslation();
  const jsonInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState('');

  const { currency, locale, theme, savingsRateTarget, expectedMonthlyNet } = state.settings;

  const set = (partial: Parameters<typeof dispatch>[0]) => dispatch(partial);

  const handleJSONImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await importJSON(file);
      dispatch({ type: 'STATE_IMPORT', payload: data });
      setMessage(t('settings.importSuccess'));
    } catch {
      setMessage(t('settings.importError'));
    }
    e.target.value = '';
  };

  const handleReset = () => {
    if (confirm(t('settings.resetConfirm'))) {
      dispatch({ type: 'STATE_IMPORT', payload: initialState });
    }
  };

  return (
    <div className="max-w-2xl">
      <SectionHeader title={t('settings.title')} />

      <div className="space-y-6">
        {/* Appearance */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Appearance</h3>
          <div className="grid grid-cols-2 gap-4">
            <SelectField label={t('settings.language')} value={locale}
              onChange={(e) => set({ type: 'SETTINGS_UPDATE', payload: { locale: e.target.value as Locale } })}>
              {LOCALES.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
            </SelectField>
            <div>
              <label className="text-xs font-medium text-gray-400 block mb-1">{t('settings.theme')}</label>
              <div className="flex gap-2">
                {(['dark', 'light'] as Theme[]).map((th) => (
                  <button
                    key={th}
                    onClick={() => set({ type: 'SETTINGS_UPDATE', payload: { theme: th } })}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border text-sm transition-colors ${
                      theme === th
                        ? 'bg-emerald-600 border-emerald-500 text-white'
                        : 'bg-gray-700 border-gray-600 text-gray-400 hover:text-white'
                    }`}
                  >
                    {th === 'dark' ? <Moon size={14} /> : <Sun size={14} />}
                    {t(`settings.${th}`)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Finance defaults */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Finance Defaults</h3>
          <div className="grid grid-cols-2 gap-4">
            <SelectField label={t('settings.currency')} value={currency}
              onChange={(e) => set({ type: 'SETTINGS_UPDATE', payload: { currency: e.target.value as Currency } })}>
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </SelectField>
            <InputField
              label={t('settings.savingsTarget')}
              type="number" min={0} max={100}
              value={savingsRateTarget}
              onChange={(e) => set({ type: 'SETTINGS_UPDATE', payload: { savingsRateTarget: parseFloat(e.target.value) || 0 } })}
            />
            <div className="col-span-2">
              <InputField
                label={t('settings.expectedNet')}
                type="number" min={0} step={100}
                value={expectedMonthlyNet}
                onChange={(e) => set({ type: 'SETTINGS_UPDATE', payload: { expectedMonthlyNet: parseFloat(e.target.value) || 0 } })}
              />
            </div>
          </div>
        </div>

        {/* Data */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Data Management</h3>
          {message && (
            <div className="mb-3 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-400 flex justify-between">
              {message}
              <button onClick={() => setMessage('')} className="text-gray-500 hover:text-white">×</button>
            </div>
          )}
          <div className="flex flex-wrap gap-3">
            <Button
              variant="secondary"
              icon={<Download size={15} />}
              onClick={() => { exportJSON(state); setMessage(t('settings.exportSuccess')); }}
            >
              {t('settings.export')}
            </Button>
            <label className="cursor-pointer">
              <input ref={jsonInputRef} type="file" accept=".json" className="hidden" onChange={handleJSONImport} />
              <Button
                variant="secondary"
                icon={<Upload size={15} />}
                onClick={() => jsonInputRef.current?.click()}
              >
                {t('settings.importJson')}
              </Button>
            </label>
          </div>
        </div>

        {/* Danger zone */}
        <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-red-400 mb-1">{t('settings.dangerZone')}</h3>
          <p className="text-xs text-gray-500 mb-4">This will erase all your data and reload the demo data.</p>
          <Button variant="danger" icon={<Trash2 size={15} />} onClick={handleReset}>
            {t('settings.resetData')}
          </Button>
        </div>
      </div>
    </div>
  );
}
