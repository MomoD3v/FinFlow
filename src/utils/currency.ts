import type { Currency, Locale } from '../models';

const LOCALE_MAP: Record<Locale, string> = {
  en: 'en-GB',
  fr: 'fr-FR',
  ar: 'ar-MA',
  es: 'es-ES',
};

/** Format a number as currency using the user's locale and currency preference */
export function formatCurrency(
  amount: number,
  currency: Currency = 'EUR',
  locale: Locale = 'en'
): string {
  return new Intl.NumberFormat(LOCALE_MAP[locale], {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Format a percentage */
export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/** Format a compact large number (e.g. 1.2k, 15.3k) */
export function formatCompact(amount: number, currency: Currency, locale: Locale): string {
  if (Math.abs(amount) >= 1_000_000) {
    return formatCurrency(amount / 1_000_000, currency, locale).replace(/[0-9.,]+/, (m) => m + 'M');
  }
  if (Math.abs(amount) >= 1_000) {
    return formatCurrency(amount / 1_000, currency, locale).replace(/[0-9.,]+/, (m) => m + 'k');
  }
  return formatCurrency(amount, currency, locale);
}

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  EUR: '€',
  USD: '$',
  GBP: '£',
  MAD: 'MAD',
  SAR: 'SAR',
  AED: 'AED',
};
