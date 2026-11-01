import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  CreditCard,
  PieChart,
  CalendarDays,
  TrendingUp,
  LineChart,
  Sliders,
  PlusCircle,
  Link as LinkIcon,
  LogOut,
  Sparkles,
  Lock,
} from 'lucide-react';

interface SidebarProps {
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, setIsMobileOpen }) => {
  const {
    activeView,
    setActiveView,
    data,
    openModal,
  } = useFinance();

  const { userProfile, currentUser, signOutUser, lockApp } = useAuth();

  const handleNavClick = (view: string) => {
    setActiveView(view);
    setIsMobileOpen(false);
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: 'Live' },
    { id: 'insights', label: 'Insights & 3M', icon: Sparkles, badge: 'Recharts' },
    { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard, badge: String(data.subscriptions.length) },
    { id: 'expenses', label: 'Expenses', icon: PieChart, badge: 'Pie' },
    { id: 'calendar', label: 'Billing Calendar', icon: CalendarDays, badge: 'Daily' },
    { id: 'nextmonth', label: 'Next Month Plan', icon: TrendingUp, badge: '¥500/d' },
    { id: 'savings', label: 'Savings Plan', icon: LineChart, badge: 'Goals' },
  ];

  const displayName = userProfile?.displayName || 'Namish';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <aside
      className={`w-full lg:w-[250px] shrink-0 sidebar-bg flex flex-col justify-between p-4 ${
        isMobileOpen ? 'flex fixed inset-y-0 left-0 z-40 bg-black' : 'hidden lg:flex'
      }`}
    >
      <div>
        {/* Brand Header */}
        <div className="flex items-center justify-between px-1 pt-1 pb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-white flex items-center justify-center text-black shadow-sm font-black text-xs">
              <span className="border-2 border-black rounded-sm w-3 h-3 inline-block"></span>
            </div>
            <span className="font-bold text-[18px] tracking-tight text-white font-sans">SpendIQ</span>
          </div>
          <span className="bento-chip bento-chip-emerald font-mono">
            VAULT
          </span>
        </div>

        {/* MAIN MENU */}
        <div className="mb-5">
          <div className="px-2 mb-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-mono">
            MAIN MENU
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white text-black font-bold shadow-lg shadow-white/5'
                      : 'text-zinc-400 hover:text-white hover:bg-white/[0.04] font-medium'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <span
                      className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                        isActive
                          ? 'bg-black text-white'
                          : 'bg-white/[0.04] border border-white/[0.08] text-zinc-400'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </span>
                    <span>{item.label}</span>
                  </span>
                  <span
                    className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-black text-white'
                        : 'bg-white/[0.05] text-zinc-400 border border-white/[0.08]'
                    }`}
                  >
                    {item.badge}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* QUICK CONTROLS */}
        <div className="mb-4">
          <div className="px-2 mb-2 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 font-mono">
              QUICK ACTIONS
            </span>
          </div>
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={() => openModal('cardBalancesModal')}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-zinc-300 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] transition-all cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                <span>Card Balances</span>
              </span>
              <span className="text-zinc-500">&rsaquo;</span>
            </button>

            <button
              type="button"
              onClick={() => openModal('addStockModal')}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-zinc-300 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] transition-all cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>Add Holding</span>
              </span>
              <span className="text-zinc-500">&rsaquo;</span>
            </button>
          </div>
        </div>

        {/* CONNECTIONS */}
        <div>
          <div className="px-2 mb-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-mono">
            CONNECTIONS
          </div>
          <button
            type="button"
            onClick={() => handleNavClick('integrations')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all cursor-pointer ${
              activeView === 'integrations'
                ? 'bg-white text-black font-bold shadow-lg shadow-white/5'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.04] font-medium'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <span className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                activeView === 'integrations' ? 'bg-black text-white' : 'bg-white/[0.04] border border-white/[0.08] text-zinc-400'
              }`}>
                <LinkIcon className="w-3.5 h-3.5" />
              </span>
              <span>Integrations</span>
            </span>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-white/[0.05] text-zinc-400 border border-white/[0.08]">
              Apple Pay
            </span>
          </button>
        </div>
      </div>

      {/* Bottom User Profile */}
      <div className="pt-3.5 mt-3 border-t border-white/[0.08] flex items-center justify-between px-1">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center text-[#E8FF1F] font-bold text-xs shadow shrink-0">
            {initial}
          </div>
          <div className="truncate">
            <div className="text-xs font-bold text-white truncate">
              {displayName}
            </div>
            <div className="text-[10px] text-zinc-400 truncate font-mono">
              {currentUser?.email || 'Logged In'}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={lockApp}
            title="Lock Session with PIN"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-[#E8FF1F] hover:bg-white/5 transition-colors cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={signOutUser}
            title="Sign Out"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
