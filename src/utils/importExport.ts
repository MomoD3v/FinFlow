import { v4 as uuidv4 } from 'uuid';
import type { AppState, Transaction, ExpenseCategory } from '../models';

// ─── JSON export/import ───────────────────────────────────────────────────────

export function exportJSON(state: AppState): void {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `finflow-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importJSON(file: File): Promise<AppState> {
  const text = await file.text();
  const data = JSON.parse(text) as AppState;
  // Basic sanity check
  if (!data.settings || !Array.isArray(data.transactions)) {
    throw new Error('Invalid FinFlow JSON format');
  }
  return data;
}

// ─── CSV import (transactions) ────────────────────────────────────────────────

const VALID_CATEGORIES: ExpenseCategory[] = [
  'rent','groceries','transport','subscriptions','dining',
  'healthcare','utilities','clothing','education','entertainment','travel','gifts','other',
];

function parseCategory(raw: string): ExpenseCategory {
  const normalised = raw.trim().toLowerCase() as ExpenseCategory;
  return VALID_CATEGORIES.includes(normalised) ? normalised : 'other';
}

/**
 * Expected CSV columns (header row required):
 *   date, category, description, amount, currency, recurring, tags
 *
 * All columns except date/amount are optional.
 */
export async function importCSV(file: File): Promise<Transaction[]> {
  const text = await file.text();
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) throw new Error('CSV file is empty or missing header');

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const idx = (name: string) => headers.indexOf(name);

  const transactions: Transaction[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
    const dateRaw = cols[idx('date')] ?? '';
    const amountRaw = cols[idx('amount')] ?? '0';
    if (!dateRaw || isNaN(parseFloat(amountRaw))) continue;

    transactions.push({
      id: uuidv4(),
      date: dateRaw,
      category: parseCategory(cols[idx('category')] ?? 'other'),
      description: cols[idx('description')] ?? '',
      amount: Math.abs(parseFloat(amountRaw)),
      currency: (cols[idx('currency')] as Transaction['currency']) || 'EUR',
      isRecurring: (cols[idx('recurring')] ?? '').toLowerCase() === 'true',
      tags: (cols[idx('tags')] ?? '').split(';').map((t) => t.trim()).filter(Boolean),
    });
  }

  return transactions;
}

/** Generate a CSV template the user can fill out */
export function downloadCSVTemplate(): void {
  const rows = [
    'date,category,description,amount,currency,recurring,tags',
    '2025-01-15,groceries,Supermarket weekly shop,85.50,EUR,false,',
    '2025-01-01,rent,Monthly rent,900,EUR,true,housing',
    '2025-01-20,dining,Dinner with friends,45.00,EUR,false,social',
  ];
  const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'finflow-transactions-template.csv';
  a.click();
  URL.revokeObjectURL(url);
}
