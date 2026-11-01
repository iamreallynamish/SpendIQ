import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { OnboardingFlow } from './components/onboarding/OnboardingFlow';
import { PinUnlockOverlay } from './components/onboarding/PinUnlockOverlay';
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
import { AddItemModal } from './components/modals/AddFixedItemModal';
import { CategoryDetailModal } from './components/modals/CategoryDetailModal';
import { ReceiptScannerModal } from './components/modals/ReceiptScannerModal';
import { ReceiptDetailModal } from './components/modals/ReceiptDetailModal';
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
      <AddItemModal />
      <CategoryDetailModal />
      <ReceiptScannerModal />
      <ReceiptDetailModal />

      {/* TOAST NOTIFICATION */}
      <Toast />
    </div>
  );
};

const AppContent: React.FC = () => {
  const { currentUser, userProfile, isAuthLoading, isPinLocked } = useAuth();

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 select-none font-sans">
        <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center text-white mb-6 shadow-2xl relative">
          <span className="w-6 h-6 border-2 border-white/20 border-t-[#E8FF1F] rounded-full animate-spin" />
        </div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-5 h-5 rounded-md bg-white flex items-center justify-center text-black font-extrabold text-[10px]">
            <span className="border-2 border-black rounded-sm w-2 h-2 inline-block"></span>
          </div>
          <span className="font-extrabold text-base tracking-tight text-white">SpendIQ Vault</span>
        </div>
        <p className="text-xs text-zinc-500 font-mono">Initializing secure ledger...</p>
      </div>
    );
  }

  if (!currentUser || !userProfile?.onboardingCompleted) {
    return <OnboardingFlow />;
  }

  return (
    <FinanceProvider>
      <MainLayout />
      {isPinLocked && <PinUnlockOverlay />}
    </FinanceProvider>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
