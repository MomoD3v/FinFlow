import en from './locales/en';
import fr from './locales/fr';
import ar from './locales/ar';
import es from './locales/es';
import type { Locale } from '../models';

const translations = { en, fr, ar, es } as const;

type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] };
type Translations = typeof en;

/** Get a translation by dot-separated key path, e.g. 'nav.dashboard' */
export function t(locale: Locale, path: string): string {
  const parts = path.split('.');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let node: any = translations[locale] ?? translations['en'];
  for (const p of parts) {
    if (node == null) break;
    node = node[p];
  }
  if (typeof node === 'string') return node;
  // fallback to English
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let fallback: any = translations['en'];
  for (const p of parts) {
    if (fallback == null) break;
    fallback = fallback[p];
  }
  return typeof fallback === 'string' ? fallback : path;
}

export { translations };
export type { Translations, DeepPartial };
