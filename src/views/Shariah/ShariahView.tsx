import React, { useState } from 'react';
import { Moon, Shield, AlertTriangle, Plus, Trash2, Edit2 } from 'lucide-react';
import { useAppStore } from '../../store/AppContext';
import { useTranslation } from '../../hooks/useTranslation';
import { formatCurrency, formatPercent } from '../../utils/currency';
import { calcPurificationAmount } from '../../utils/calculations';
import { calculateZakat } from '../../utils/zakat';
import { SectionHeader } from '../common/SectionHeader';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { ProgressBar } from '../common/ProgressBar';
import { CheckboxField, InputField } from '../common/FormField';
import { ZakatAssetForm } from './ZakatAssetForm';
import type { ZakatAsset, ETFHolding } from '../../models';

const HALAL_LABEL_CLASS: Record<ETFHolding['halalStatus'], string> = {
  halal:      'text-emerald-400 bg-emerald-500/20 border-emerald-500/20',
  doubtful:   'text-amber-400 bg-amber-500/20 border-amber-500/20',
  non_halal:  'text-red-400 bg-red-500/20 border-red-500/20',
  unscreened: 'text-gray-400 bg-gray-700 border-gray-600',
};

export function ShariahView() {
  const { state, dispatch } = useAppStore();
  const { t } = useTranslation();
  const { currency, locale } = state.settings;
  const fmt = (n: number) => formatCurrency(n, currency, locale);

  const [showAssetForm, setShowAssetForm] = useState(false);
  const [editingAsset, setEditingAsset] = useState<ZakatAsset | null>(null);
  const [activeTab, setActiveTab] = useState<'zakat' | 'purification' | 'screening'>('zakat');

  const zakatResult = calculateZakat(state.zakatAssets, state.shariahSettings.nisabValue);
  const purificationAmount = calcPurificationAmount(state);

  // Holdings that need attention
  const flaggedHoldings = state.investmentAccounts.flatMap((acc) =>
    acc.holdings
      .filter((h) => h.halalStatus !== 'halal')
      .map((h) => ({ ...h, accountName: acc.name }))
  );

  const handleDeleteAsset = (id: string) => {
    if (confirm(t('common.confirm') + '?'))
      dispatch({ type: 'ZAKAT_ASSET_DELETE', payload: { id } });
  };

  const TABS = [
    { key: 'zakat' as const,        label: t('shariah.zakat'),       icon: <Moon size={14} /> },
    { key: 'purification' as const, label: t('shariah.purification'),icon: <Shield size={14} /> },
    { key: 'screening' as const,    label: t('shariah.screening'),   icon: <AlertTriangle size={14} /> },
  ];

  return (
    <div>
      <SectionHeader
        title={t('shariah.title')}
        subtitle={undefined}
        action={
          <div className="flex items-center gap-3">
            <CheckboxField
              label={t('shariah.enabled')}
              checked={state.shariahSettings.enabled}
              onChange={(v) => dispatch({ type: 'SHARIAH_SETTINGS_UPDATE', payload: { enabled: v } })}
            />
          </div>
        }
      />

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-800/50 border border-gray-700 rounded-xl p-1 mb-6 w-fit">
        {TABS.map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === key
                ? 'bg-emerald-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {icon}{label}
          </button>
        ))}
      </div>

      {/* ── ZAKAT TAB ── */}
      {activeTab === 'zakat' && (
        <div className="space-y-5">
          {/* Nisab setting */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-gray-300 mb-3">{t('shariah.nisab')}</h3>
            <div className="flex items-center gap-4">
              <div className="w-48">
                <InputField
                  label={`${t('shariah.nisab')} (${currency})`}
                  type="number"
                  min={0}
                  value={state.shariahSettings.nisabValue}
                  onChange={(e) =>
                    dispatch({ type: 'SHARIAH_SETTINGS_UPDATE', payload: { nisabValue: parseFloat(e.target.value) || 0 } })
                  }
                />
              </div>
              <div className="flex-1 pt-5">
                <div className={`px-4 py-2.5 rounded-xl text-sm font-semibold ${
                  zakatResult.isAboveNisab
                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                    : 'bg-gray-700 text-gray-400'
                }`}>
                  {zakatResult.isAboveNisab ? t('shariah.aboveNisab') : t('shariah.belowNisab')}
                </div>
              </div>
            </div>
          </div>

          {/* Zakat summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">{t('shariah.totalZakatable')}</p>
              <p className="text-xl font-bold text-white">{fmt(zakatResult.totalZakatable)}</p>
            </div>
            <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">{t('shariah.zakatRate')}</p>
              <p className="text-xl font-bold text-white">{formatPercent(zakatResult.rate * 100)}</p>
            </div>
            <div className={`border rounded-2xl p-4 text-center ${zakatResult.isAboveNisab ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-gray-800/50 border-gray-700'}`}>
              <p className="text-xs text-gray-500 mb-1">{t('shariah.zakatDue')}</p>
              <p className={`text-xl font-bold ${zakatResult.isAboveNisab ? 'text-emerald-400' : 'text-gray-600'}`}>
                {fmt(zakatResult.zakatDue)}
              </p>
            </div>
          </div>

          {/* Assets table */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-semibold text-gray-300">{t('shariah.zakatable')}</h3>
              <Button size="sm" icon={<Plus size={13} />} onClick={() => { setEditingAsset(null); setShowAssetForm(true); }}>
                {t('shariah.addAsset')}
              </Button>
            </div>
            <div className="space-y-2">
              {state.zakatAssets.map((asset) => (
                <div key={asset.id} className="flex items-center gap-3 p-3 bg-gray-900/50 rounded-xl">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${asset.isZakatable ? 'bg-emerald-400' : 'bg-gray-600'}`} />
                  <span className="text-sm text-white flex-1">{asset.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${asset.isZakatable ? 'text-emerald-400 bg-emerald-500/20' : 'text-gray-500 bg-gray-700'}`}>
                    {asset.isZakatable ? t('shariah.isZakatable') : 'Exempt'}
                  </span>
                  <span className="text-sm font-semibold text-white">{fmt(asset.value)}</span>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditingAsset(asset); setShowAssetForm(true); }}
                      className="p-1.5 rounded text-gray-500 hover:text-white hover:bg-gray-700 transition-colors">
                      <Edit2 size={12} />
                    </button>
                    <button onClick={() => handleDeleteAsset(asset.id)}
                      className="p-1.5 rounded text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── PURIFICATION TAB ── */}
      {activeTab === 'purification' && (
        <div className="space-y-5">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <Shield size={20} className="text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-white mb-1">{t('shariah.purifyAmount')}: {fmt(purificationAmount)}</h3>
                <p className="text-sm text-gray-400">{t('shariah.purificationNote')}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-gray-300 mb-4">Income Sources with Non-Halal Fraction</h3>
            <div className="space-y-3">
              {state.incomeSources.filter((s) => s.nonHalalFraction > 0).length === 0 && (
                <p className="text-sm text-gray-500">All income sources are marked as fully halal.</p>
              )}
              {state.incomeSources
                .filter((s) => s.isActive && s.nonHalalFraction > 0)
                .map((src) => {
                  const purify = src.amount * src.nonHalalFraction;
                  return (
                    <div key={src.id} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-xl">
                      <div>
                        <p className="text-sm font-medium text-white">{src.name}</p>
                        <p className="text-xs text-gray-500">{formatPercent(src.nonHalalFraction * 100)} non-halal fraction</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-amber-400">{fmt(purify)}</p>
                        <p className="text-xs text-gray-600">to purify</p>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* ── SCREENING TAB ── */}
      {activeTab === 'screening' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-400">
            {t('shariah.halalAlerts')} ({flaggedHoldings.length})
          </p>
          {flaggedHoldings.length === 0 && (
            <div className="flex items-center gap-2 px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-sm text-emerald-400">
              <Shield size={16} />
              All screened holdings are marked Halal.
            </div>
          )}
          {flaggedHoldings.map((h) => (
            <div key={h.id} className="bg-gray-800/50 border border-gray-700 rounded-2xl p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-white">{h.ticker}</span>
                  <span className="text-xs text-gray-500">{h.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${HALAL_LABEL_CLASS[h.halalStatus]}`}>
                    {t(`investments.${h.halalStatus === 'non_halal' ? 'nonHalal' : h.halalStatus}`)}
                  </span>
                </div>
                <span className="text-xs text-gray-400">{h.accountName}</span>
              </div>
              {h.nonHalalRevenuePct > 0 && (
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Non-halal revenue exposure</span>
                    <span>{formatPercent(h.nonHalalRevenuePct)}</span>
                  </div>
                  <ProgressBar value={h.nonHalalRevenuePct} color={h.nonHalalRevenuePct > 5 ? 'red' : 'amber'} size="sm" />
                </div>
              )}
              <p className="mt-2 text-xs text-gray-600">
                Action: Screen this ETF via MSCI ESG / Ideal Ratings / S&P purification methodology.
              </p>
            </div>
          ))}
        </div>
      )}

      {showAssetForm && (
        <Modal
          title={editingAsset ? t('shariah.addAsset') : t('shariah.addAsset')}
          onClose={() => setShowAssetForm(false)}
          size="sm"
        >
          <ZakatAssetForm
            initial={editingAsset}
            onSave={(asset) => {
              dispatch(editingAsset
                ? { type: 'ZAKAT_ASSET_UPDATE', payload: asset }
                : { type: 'ZAKAT_ASSET_ADD', payload: asset }
              );
              setShowAssetForm(false);
            }}
            onCancel={() => setShowAssetForm(false)}
          />
        </Modal>
      )}
    </div>
  );
}
