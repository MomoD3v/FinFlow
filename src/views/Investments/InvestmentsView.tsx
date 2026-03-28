import React, { useState } from 'react';
import { Plus, Edit2, Trash2, ChevronDown, ChevronRight, AlertTriangle } from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
} from 'recharts';
import { useAppStore } from '../../store/AppContext';
import { useTranslation } from '../../hooks/useTranslation';
import { formatCurrency, formatPercent } from '../../utils/currency';
import { calcPortfolioValue } from '../../utils/calculations';
import { SectionHeader } from '../common/SectionHeader';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { ProgressBar } from '../common/ProgressBar';
import { AccountForm } from './AccountForm';
import { HoldingForm } from './HoldingForm';
import type { InvestmentAccount, ETFHolding } from '../../models';

const HALAL_COLORS: Record<ETFHolding['halalStatus'], string> = {
  halal:       'text-emerald-400 bg-emerald-500/20',
  doubtful:    'text-amber-400 bg-amber-500/20',
  non_halal:   'text-red-400 bg-red-500/20',
  unscreened:  'text-gray-400 bg-gray-700',
};

const CHART_COLORS = ['#10b981','#3b82f6','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316','#84cc16'];

export function InvestmentsView() {
  const { state, dispatch } = useAppStore();
  const { t } = useTranslation();
  const { currency, locale } = state.settings;
  const fmt = (n: number) => formatCurrency(n, currency, locale);

  const [expandedAcc, setExpandedAcc] = useState<string | null>(
    state.investmentAccounts[0]?.id ?? null
  );
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [editingAcc, setEditingAcc] = useState<InvestmentAccount | null>(null);
  const [showHoldingForm, setShowHoldingForm] = useState<string | null>(null); // accountId
  const [editingHolding, setEditingHolding] = useState<{ accountId: string; holding: ETFHolding } | null>(null);

  const totalPortfolio = calcPortfolioValue(state.investmentAccounts);

  // Aggregate pie by account
  const accountPieData = state.investmentAccounts.map((acc) => {
    const val = acc.holdings.reduce((s, h) => s + h.shares * h.pricePerShare, 0) + acc.cashBalance;
    return { name: acc.name, value: Math.round(val) };
  });

  const handleDeleteAccount = (id: string) => {
    if (confirm(t('common.confirm') + '?'))
      dispatch({ type: 'ACCOUNT_DELETE', payload: { id } });
  };

  const handleDeleteHolding = (accountId: string, holdingId: string) => {
    if (confirm(t('common.confirm') + '?'))
      dispatch({ type: 'HOLDING_DELETE', payload: { accountId, holdingId } });
  };

  return (
    <div>
      <SectionHeader
        title={t('investments.title')}
        subtitle={`${t('investments.totalPortfolio')}: ${fmt(totalPortfolio)}`}
        action={
          <Button icon={<Plus size={16} />} onClick={() => { setEditingAcc(null); setShowAccountForm(true); }}>
            {t('investments.addAccount')}
          </Button>
        }
      />

      {/* Portfolio allocation pie */}
      {state.investmentAccounts.length > 0 && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-5 mb-6">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">{t('investments.allocation')}</h3>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie data={accountPieData} cx="50%" cy="50%" innerRadius={45} outerRadius={72} paddingAngle={4} dataKey="value">
                  {accountPieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8 }}
                  formatter={(v: number) => [fmt(v), '']}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {accountPieData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-2 text-sm">
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                  <span className="text-gray-300">{d.name}</span>
                  <span className="text-white font-semibold ml-auto pl-4">{fmt(d.value)}</span>
                  <span className="text-gray-500 text-xs">
                    ({totalPortfolio > 0 ? formatPercent((d.value / totalPortfolio) * 100) : '0%'})
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Account list */}
      <div className="space-y-4">
        {state.investmentAccounts.map((acc) => {
          const accValue = acc.holdings.reduce((s, h) => s + h.shares * h.pricePerShare, 0) + acc.cashBalance;
          const isExpanded = expandedAcc === acc.id;
          const hasHalalIssues = acc.holdings.some(
            (h) => h.halalStatus === 'non_halal' || h.halalStatus === 'doubtful'
          );

          return (
            <div key={acc.id} className="bg-gray-800/50 border border-gray-700 rounded-2xl overflow-hidden">
              {/* Account header */}
              <div
                className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-700/30 transition-colors"
                onClick={() => setExpandedAcc(isExpanded ? null : acc.id)}
              >
                {isExpanded ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">{acc.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-400">{acc.type}</span>
                    {hasHalalIssues && <AlertTriangle size={14} className="text-amber-400" />}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{acc.holdings.length} holdings · Cash: {fmt(acc.cashBalance)}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-white">{fmt(accValue)}</p>
                  <p className="text-xs text-gray-500">
                    {totalPortfolio > 0 ? formatPercent((accValue / totalPortfolio) * 100) : '0%'} of portfolio
                  </p>
                </div>
                <div className="flex gap-1 ml-2" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => { setEditingAcc(acc); setShowAccountForm(true); }}
                    className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-700 transition-colors">
                    <Edit2 size={13} />
                  </button>
                  <button onClick={() => handleDeleteAccount(acc.id)}
                    className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Holdings table */}
              {isExpanded && (
                <div className="border-t border-gray-700 p-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Holdings</span>
                    <Button
                      size="sm"
                      variant="secondary"
                      icon={<Plus size={13} />}
                      onClick={() => { setShowHoldingForm(acc.id); setEditingHolding(null); }}
                    >
                      {t('investments.addHolding')}
                    </Button>
                  </div>

                  {acc.holdings.length === 0 ? (
                    <p className="text-sm text-gray-600 text-center py-4">{t('common.noData')}</p>
                  ) : (
                    <div className="space-y-2">
                      {acc.holdings.map((h) => {
                        const val = h.shares * h.pricePerShare;
                        const actualPct = accValue > 0 ? (val / accValue) * 100 : 0;
                        const drift = actualPct - h.targetAllocationPct;
                        return (
                          <div key={h.id} className="bg-gray-900/50 rounded-xl p-3">
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="font-bold text-white text-sm">{h.ticker}</span>
                                <span className="text-xs text-gray-500 truncate">{h.name}</span>
                                <span className={`text-xs px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${HALAL_COLORS[h.halalStatus]}`}>
                                  {t(`investments.${h.halalStatus === 'non_halal' ? 'nonHalal' : h.halalStatus}`)}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 flex-shrink-0">
                                <div className="text-right">
                                  <p className="text-sm font-bold text-white">{fmt(val)}</p>
                                  <p className="text-xs text-gray-500">{h.shares} × {fmt(h.pricePerShare)}</p>
                                </div>
                                <div className="flex gap-1">
                                  <button onClick={() => { setEditingHolding({ accountId: acc.id, holding: h }); setShowHoldingForm(acc.id); }}
                                    className="p-1.5 rounded text-gray-500 hover:text-white hover:bg-gray-700 transition-colors">
                                    <Edit2 size={12} />
                                  </button>
                                  <button onClick={() => handleDeleteHolding(acc.id, h.id)}
                                    className="p-1.5 rounded text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <ProgressBar
                                value={actualPct}
                                color={Math.abs(drift) > 5 ? 'amber' : 'emerald'}
                                size="sm"
                              />
                              <span className="text-xs text-gray-500 flex-shrink-0">
                                {formatPercent(actualPct)} / {formatPercent(h.targetAllocationPct)} target
                                {Math.abs(drift) > 5 && (
                                  <span className={`ml-1 ${drift > 0 ? 'text-amber-400' : 'text-blue-400'}`}>
                                    ({drift > 0 ? '+' : ''}{drift.toFixed(1)}%)
                                  </span>
                                )}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Account form modal */}
      {showAccountForm && (
        <Modal
          title={editingAcc ? t('investments.addAccount') : t('investments.addAccount')}
          onClose={() => setShowAccountForm(false)}
        >
          <AccountForm
            initial={editingAcc}
            onSave={(acc) => {
              dispatch(editingAcc
                ? { type: 'ACCOUNT_UPDATE', payload: acc }
                : { type: 'ACCOUNT_ADD', payload: acc }
              );
              setShowAccountForm(false);
            }}
            onCancel={() => setShowAccountForm(false)}
          />
        </Modal>
      )}

      {/* Holding form modal */}
      {showHoldingForm && (
        <Modal
          title={editingHolding ? t('investments.addHolding') : t('investments.addHolding')}
          onClose={() => { setShowHoldingForm(null); setEditingHolding(null); }}
        >
          <HoldingForm
            accountId={showHoldingForm}
            initial={editingHolding?.holding ?? null}
            onSave={(holding) => {
              dispatch(editingHolding
                ? { type: 'HOLDING_UPDATE', payload: { accountId: showHoldingForm, holding } }
                : { type: 'HOLDING_ADD', payload: { accountId: showHoldingForm, holding } }
              );
              setShowHoldingForm(null);
              setEditingHolding(null);
            }}
            onCancel={() => { setShowHoldingForm(null); setEditingHolding(null); }}
          />
        </Modal>
      )}
    </div>
  );
}
