import React from 'react';
import {
  LayoutDashboard, Wallet, Receipt, TrendingUp,
  PiggyBank, Target, Moon, Settings, ChevronRight, X,
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
  /** mobile only: whether the drawer is open */
  mobileOpen: boolean;
  onMobileClose: () => void;
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

function SidebarContent({
  currentPage,
  onNavigate,
  shariahEnabled,
  onMobileClose,
  isMobileDrawer = false,
}: {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  shariahEnabled: boolean;
  onMobileClose?: () => void;
  isMobileDrawer?: boolean;
}) {
  const { t } = useTranslation();
  const visible = NAV_ITEMS.filter(
    (item) => item.key !== 'shariah' || shariahEnabled
  );

  const handleNav = (key: Page) => {
    onNavigate(key);
    onMobileClose?.();
  };

  return (
    <div className="flex flex-col h-full py-5 px-3">
      {/* Logo */}
      <div className="px-3 mb-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-black text-sm">FF</span>
          </div>
          <span className="font-bold text-white text-lg">FinFlow</span>
        </div>
        {isMobileDrawer && (
          <button
            onClick={onMobileClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-0.5 flex-1">
        {visible.map(({ key, icon, labelKey }) => {
          const active = currentPage === key;
          return (
            <button
              key={key}
              onClick={() => handleNav(key)}
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
    </div>
  );
}

export function Sidebar({ currentPage, onNavigate, shariahEnabled, theme, mobileOpen, onMobileClose }: Props) {
  return (
    <>
      {/* ── Desktop sidebar (lg+) ── */}
      <aside className="hidden lg:flex w-56 flex-shrink-0 flex-col bg-gray-900 border-r border-gray-800">
        <SidebarContent
          currentPage={currentPage}
          onNavigate={onNavigate}
          shariahEnabled={shariahEnabled}
        />
      </aside>

      {/* ── Mobile drawer overlay ── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onMobileClose}
          />
          {/* Drawer panel */}
          <aside className="absolute left-0 top-0 h-full w-64 bg-gray-900 border-r border-gray-800 shadow-2xl">
            <SidebarContent
              currentPage={currentPage}
              onNavigate={onNavigate}
              shariahEnabled={shariahEnabled}
              onMobileClose={onMobileClose}
              isMobileDrawer
            />
          </aside>
        </div>
      )}
    </>
  );
}
