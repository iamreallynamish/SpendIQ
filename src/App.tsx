import React, { useState } from 'react';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { Toast } from './components/common/Toast';
import { DashboardView } from './components/dashboard/DashboardView';
import { SubscriptionsView } from './components/subscriptions/SubscriptionsView';
import { ExpensesView } from './components/expenses/ExpensesView';
import { BillingCalendarView } from './components/calendar/BillingCalendarView';
import { NextMonthView } from './components/nextmonth/NextMonthView';
import { SavingsView } from './components/savings/SavingsView';
import { IntegrationsView } from './components/integrations/IntegrationsView';
import { InsightsView } from './components/insights/InsightsView';
import { BulkSmsModal } from './components/modals/BulkSmsModal';
import { CardBalancesModal } from './components/modals/CardBalancesModal';
import { EditTransactionModal } from './components/modals/EditTransactionModal';
import { CloudDbModal } from './components/modals/CloudDbModal';
import { AddItemModal } from './components/modals/AddFixedItemModal';
import { Edit3, Menu, X } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { activeView, openModal } = useFinance();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-black text-white select-none">
      {/* MOBILE TOP BAR */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-black border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-white flex items-center justify-center text-black font-extrabold text-xs shadow">
            <span className="border-2 border-black rounded-sm w-3 h-3 inline-block"></span>
          </div>
          <span className="font-bold text-base tracking-tight text-white font-sans">SpendIQ</span>
          <span className="bento-chip bento-chip-emerald font-mono">
            LIVE
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-1.5 rounded-xl bg-white/10 text-white border border-white/10 cursor-pointer"
        >
          {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* LEFT SIDEBAR */}
      <Sidebar isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />

      {/* MAIN WORKSPACE */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:px-8 lg:py-6 overflow-y-auto">
        <Header />

        <div className="mt-6">
          {activeView === 'dashboard' && <DashboardView />}
          {activeView === 'insights' && <InsightsView />}
          {activeView === 'subscriptions' && <SubscriptionsView />}
          {activeView === 'expenses' && <ExpensesView />}
          {activeView === 'calendar' && <BillingCalendarView />}
          {activeView === 'nextmonth' && <NextMonthView />}
          {activeView === 'savings' && <SavingsView />}
          {activeView === 'integrations' && <IntegrationsView />}
        </div>
      </main>

      {/* FLOATING QUICK EDIT / SMS BUTTON */}
      <button
        type="button"
        onClick={() => openModal('smsModal')}
        title="Quick SMS Input / Edit"
        className="fixed bottom-6 right-6 w-12 h-12 rounded-2xl bg-[#E8FF1F] hover:bg-[#f1ff52] text-black shadow-[0_8px_30px_rgba(232,255,31,0.4)] flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 z-30 cursor-pointer"
      >
        <Edit3 className="w-5 h-5" />
      </button>

      {/* MODALS */}
      <BulkSmsModal />
      <CardBalancesModal />
      <EditTransactionModal />
      <CloudDbModal />
      <AddItemModal />

      {/* TOAST NOTIFICATION */}
      <Toast />
    </div>
  );
};

export default function App() {
  return (
    <FinanceProvider>
      <MainLayout />
    </FinanceProvider>
  );
}
