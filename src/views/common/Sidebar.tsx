import React from 'react';
import {
  LayoutDashboard, Wallet, Receipt, TrendingUp,
  PiggyBank, Target, Moon, Settings, ChevronRight,
} from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import type { AppState } from '../../models';

export type Page =
  | 'dashboard' | 'income' | 'expenses' | 'investments'
  | 'savings' | 'budget' | 'shariah' | 'settings';

interface Props {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  shariahEnabled: boolean;
  theme: AppState['settings']['theme'];
}

const NAV_ITEMS: { key: Page; icon: React.ReactNode; labelKey: string }[] = [
  { key: 'dashboard',   icon: <LayoutDashboard size={18} />, labelKey: 'nav.dashboard' },
  { key: 'income',      icon: <Wallet size={18} />,          labelKey: 'nav.income' },
  { key: 'expenses',    icon: <Receipt size={18} />,         labelKey: 'nav.expenses' },
  { key: 'investments', icon: <TrendingUp size={18} />,      labelKey: 'nav.investments' },
  { key: 'savings',     icon: <PiggyBank size={18} />,       labelKey: 'nav.savings' },
  { key: 'budget',      icon: <Target size={18} />,          labelKey: 'nav.budget' },
  { key: 'shariah',     icon: <Moon size={18} />,            labelKey: 'nav.shariah' },
  { key: 'settings',    icon: <Settings size={18} />,        labelKey: 'nav.settings' },
];

export function Sidebar({ currentPage, onNavigate, shariahEnabled }: Props) {
  const { t } = useTranslation();
  const visible = NAV_ITEMS.filter(
    (item) => item.key !== 'shariah' || shariahEnabled
  );

  return (
    <aside className="w-56 flex-shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col py-5 px-3">
      {/* Logo */}
      <div className="px-3 mb-8">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-black text-sm">FF</span>
          </div>
          <span className="font-bold text-white text-lg">FinFlow</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-0.5 flex-1">
        {visible.map(({ key, icon, labelKey }) => {
          const active = currentPage === key;
          return (
            <button
              key={key}
              onClick={() => onNavigate(key)}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full text-start
                transition-colors group
                ${active
                  ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/20'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800 border border-transparent'
                }
              `}
            >
              <span className={active ? 'text-emerald-400' : 'text-gray-500 group-hover:text-gray-300'}>
                {icon}
              </span>
              <span className="flex-1">{t(labelKey)}</span>
              {active && <ChevronRight size={14} className="text-emerald-500" />}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 pt-4 border-t border-gray-800">
        <p className="text-xs text-gray-600">FinFlow v0.1.0</p>
      </div>
    </aside>
  );
}
