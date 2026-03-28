import React from 'react';
import { Sun, Moon, Globe, Menu } from 'lucide-react';
import { useAppStore } from '../../store/AppContext';
import { useTranslation } from '../../hooks/useTranslation';
import type { Locale, Theme } from '../../models';

const LOCALES: { value: Locale; label: string }[] = [
  { value: 'en', label: 'EN' },
  { value: 'fr', label: 'FR' },
  { value: 'ar', label: 'AR' },
  { value: 'es', label: 'ES' },
];

interface Props {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: Props) {
  const { state, dispatch } = useAppStore();
  const { t } = useTranslation();
  const { theme, locale } = state.settings;

  const toggleTheme = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    dispatch({ type: 'SETTINGS_UPDATE', payload: { theme: next } });
  };

  const setLocale = (l: Locale) => {
    dispatch({ type: 'SETTINGS_UPDATE', payload: { locale: l } });
  };

  return (
    <header className="h-14 flex items-center justify-between px-4 bg-gray-900 border-b border-gray-800 flex-shrink-0 gap-3">
      {/* Hamburger — mobile only */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-xl bg-gray-800 text-gray-400 hover:text-white transition-colors flex-shrink-0"
        aria-label="Open menu"
      >
        <Menu size={18} />
      </button>

      {/* Logo text — mobile only (desktop has sidebar logo) */}
      <span className="lg:hidden font-bold text-white text-base flex-1">FinFlow</span>

      {/* Right controls */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Locale switcher */}
        <div className="flex items-center gap-0.5 bg-gray-800 rounded-xl p-1">
          <Globe size={13} className="text-gray-500 ml-1 hidden sm:block" />
          {LOCALES.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setLocale(value)}
              className={`px-2 py-1 rounded-lg text-xs font-semibold transition-colors ${
                locale === value
                  ? 'bg-emerald-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl bg-gray-800 text-gray-400 hover:text-white transition-colors"
          title={t('settings.theme')}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    </header>
  );
}
