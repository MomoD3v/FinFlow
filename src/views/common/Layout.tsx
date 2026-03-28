import React, { type ReactNode, useState } from 'react';
import { Sidebar, type Page } from './Sidebar';
import { Header } from './Header';
import { useAppStore } from '../../store/AppContext';

interface Props {
  children: ReactNode;
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

export function Layout({ children, currentPage, onNavigate }: Props) {
  const { state } = useAppStore();

  return (
    <div className="flex h-screen bg-gray-950 text-white overflow-hidden">
      <Sidebar
        currentPage={currentPage}
        onNavigate={onNavigate}
        shariahEnabled={state.shariahSettings.enabled}
        theme={state.settings.theme}
      />
      <div className="flex flex-col flex-1 min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
