import React, { useState, useMemo } from 'react';
import { Plus, Edit2, Trash2, Upload, RefreshCw } from 'lucide-react';
import { useAppStore } from '../../store/AppContext';
import { useTranslation } from '../../hooks/useTranslation';
import { formatCurrency } from '../../utils/currency';
import { SectionHeader } from '../common/SectionHeader';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { SelectField } from '../common/FormField';
import { ExpenseForm } from './ExpenseForm';
import { importCSV, downloadCSVTemplate } from '../../utils/importExport';
import type { Transaction, ExpenseCategory } from '../../models';

const CATEGORIES: ExpenseCategory[] = [
  'rent','groceries','transport','subscriptions','dining',
  'healthcare','utilities','clothing','education','entertainment','travel','gifts','other',
];

const CATEGORY_EMOJI: Record<ExpenseCategory, string> = {
  rent: '🏠', groceries: '🛒', transport: '🚌', subscriptions: '📱',
  dining: '🍽️', healthcare: '💊', utilities: '💡', clothing: '👗',
  education: '📚', entertainment: '🎬', travel: '✈️', gifts: '🎁', other: '💼',
};

export function ExpensesView() {
  const { state, dispatch } = useAppStore();
  const { t } = useTranslation();
  const { currency, locale } = state.settings;
  const fmt = (n: number) => formatCurrency(n, currency, locale);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [filterCat, setFilterCat] = useState<ExpenseCategory | ''>('');
  const [filterMonth, setFilterMonth] = useState(''); // YYYY-MM
  const [importMsg, setImportMsg] = useState('');

  const filtered = useMemo(() => {
    return state.transactions
      .filter((tx) => !filterCat || tx.category === filterCat)
      .filter((tx) => !filterMonth || tx.date.startsWith(filterMonth))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [state.transactions, filterCat, filterMonth]);

  const totalFiltered = filtered.reduce((s, t) => s + t.amount, 0);

  const handleDelete = (id: string) => {
    if (confirm(t('common.confirm') + '?'))
      dispatch({ type: 'TRANSACTION_DELETE', payload: { id } });
  };

  const handleCSVImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const txs = await importCSV(file);
      dispatch({ type: 'TRANSACTIONS_IMPORT', payload: txs });
      setImportMsg(`${t('settings.importSuccess')} (${txs.length} rows)`);
    } catch {
      setImportMsg(t('settings.importError'));
    }
    e.target.value = '';
  };

  return (
    <div>
      <SectionHeader
        title={t('expenses.title')}
        subtitle={`${filtered.length} transactions · ${fmt(totalFiltered)}`}
        action={
          <div className="flex gap-2">
            <label className="cursor-pointer">
              <input type="file" accept=".csv" className="hidden" onChange={handleCSVImport} />
              <Button variant="secondary" icon={<Upload size={15} />} onClick={() => {}}>
                {t('expenses.import')}
              </Button>
            </label>
            <Button icon={<Plus size={16} />} onClick={() => { setEditing(null); setShowForm(true); }}>
              {t('expenses.add')}
            </Button>
          </div>
        }
      />

      {importMsg && (
        <div className="mb-4 px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-400 flex justify-between">
          {importMsg}
          <button onClick={() => setImportMsg('')} className="text-gray-500 hover:text-white">×</button>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="w-44">
          <SelectField
            label={t('expenses.filter')}
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value as ExpenseCategory | '')}
          >
            <option value="">{t('expenses.all')}</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{t(`categories.${c}`)}</option>
            ))}
          </SelectField>
        </div>
        <div className="w-44">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-400">Month</label>
            <input
              type="month"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
        {(filterCat || filterMonth) && (
          <div className="flex items-end">
            <Button
              variant="ghost"
              size="sm"
              icon={<RefreshCw size={13} />}
              onClick={() => { setFilterCat(''); setFilterMonth(''); }}
            >
              Clear
            </Button>
          </div>
        )}
        <button
          onClick={downloadCSVTemplate}
          className="self-end text-xs text-gray-500 hover:text-emerald-400 transition-colors underline underline-offset-2"
        >
          Download CSV template
        </button>
      </div>

      {/* Transaction list */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <p className="text-gray-500 text-center py-16">{t('common.noData')}</p>
        )}
        {filtered.map((tx) => (
          <div
            key={tx.id}
            className="bg-gray-800/50 border border-gray-700 rounded-xl p-3 flex items-center gap-3"
          >
            <span className="text-xl w-8 text-center flex-shrink-0">{CATEGORY_EMOJI[tx.category]}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-white truncate">{tx.description}</span>
                {tx.isRecurring && (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">↻</span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-gray-500">{tx.date}</span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-gray-700 text-gray-400">
                  {t(`categories.${tx.category}`)}
                </span>
                {tx.tags.map((tag) => (
                  <span key={tag} className="text-xs text-gray-600">#{tag}</span>
                ))}
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <span className="text-sm font-bold text-white">{fmt(tx.amount)}</span>
            </div>
            <div className="flex gap-1 flex-shrink-0">
              <button
                onClick={() => { setEditing(tx); setShowForm(true); }}
                className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-700 transition-colors"
              >
                <Edit2 size={13} />
              </button>
              <button
                onClick={() => handleDelete(tx.id)}
                className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <Modal
          title={editing ? t('expenses.edit') : t('expenses.add')}
          onClose={() => setShowForm(false)}
        >
          <ExpenseForm
            initial={editing}
            onSave={(tx) => {
              dispatch(editing
                ? { type: 'TRANSACTION_UPDATE', payload: tx }
                : { type: 'TRANSACTION_ADD', payload: tx }
              );
              setShowForm(false);
            }}
            onCancel={() => setShowForm(false)}
          />
        </Modal>
      )}
    </div>
  );
}
