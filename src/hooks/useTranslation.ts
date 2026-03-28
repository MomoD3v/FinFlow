import { useCallback } from 'react';
import { useAppStore } from '../store/AppContext';
import { t } from '../i18n';

/** Hook that returns a `t(path)` function bound to the current locale */
export function useTranslation() {
  const { state } = useAppStore();
  const locale = state.settings.locale;
  const translate = useCallback((path: string) => t(locale, path), [locale]);
  return { t: translate, locale };
}
