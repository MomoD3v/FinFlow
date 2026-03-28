import React, { useState } from 'react';
import { Layout } from './views/common/Layout';
import type { Page } from './views/common/Sidebar';
import { DashboardView }   from './views/Dashboard/DashboardView';
import { IncomeView }      from './views/Income/IncomeView';
import { ExpensesView }    from './views/Expenses/ExpensesView';
import { InvestmentsView } from './views/Investments/InvestmentsView';
import { SavingsView }     from './views/Savings/SavingsView';
import { BudgetView }      from './views/Budget/BudgetView';
import { ShariahView }     from './views/Shariah/ShariahView';
import { SettingsView }    from './views/Settings/SettingsView';

const PAGE_COMPONENTS: Record<Page, React.ReactElement> = {
  dashboard:   <DashboardView />,
  income:      <IncomeView />,
  expenses:    <ExpensesView />,
  investments: <InvestmentsView />,
  savings:     <SavingsView />,
  budget:      <BudgetView />,
  shariah:     <ShariahView />,
  settings:    <SettingsView />,
};

export default function App() {
  const [page, setPage] = useState<Page>('dashboard');

  return (
    <Layout currentPage={page} onNavigate={setPage}>
      {PAGE_COMPONENTS[page]}
    </Layout>
  );
}
