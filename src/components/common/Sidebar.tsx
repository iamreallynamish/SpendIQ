import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  LayoutDashboard,
  CreditCard,
  PieChart,
  CalendarDays,
  TrendingUp,
  LineChart,
  Sliders,
  PlusCircle,
  Database,
  Link as LinkIcon,
  ShieldCheck,
  User,
  LogOut,
  Sparkles,
} from 'lucide-react';

interface SidebarProps {
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, setIsMobileOpen }) => {
  const {
    role,
    setRole,
    activeView,
    setActiveView,
    data,
    openModal,
    showToast,
  } = useFinance();

  const handleNavClick = (view: string) => {
    setActiveView(view);
    setIsMobileOpen(false);
  };

  const toggleRole = () => {
    const next = role === 'DAD' ? 'SON' : 'DAD';
    setRole(next);
    showToast(`Switched to ${next === 'DAD' ? "Dad's Admin" : "Son's Viewer"} Session`);
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

  return (
    <aside
      className={`w-full lg:w-[250px] shrink-0 sidebar-bg flex flex-col justify-between p-4 ${
        isMobileOpen ? 'flex fixed inset-y-0 left-0 z-40 bg-black' : 'hidden lg:flex'
      }`}
    >
      <div>
        {/* Brand Header */}
        <div className="flex items-center justify-between px-1 pt-1 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-white flex items-center justify-center text-black shadow-sm font-black text-xs">
              <span className="border-2 border-black rounded-sm w-3 h-3 inline-block"></span>
            </div>
            <span className="font-bold text-[18px] tracking-tight text-white font-sans">SpendIQ</span>
          </div>
          <span className="bento-chip bento-chip-emerald font-mono">
            LIVE
          </span>
        </div>

        {/* Role Switcher Pill Container */}
        <div className="bento-seg w-full grid grid-cols-2 p-1 mb-5 bg-white/[0.04]">
          <button
            type="button"
            onClick={() => {
              setRole('DAD');
              showToast("Switched to Dad's Admin Session");
            }}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-xs transition-all cursor-pointer ${
              role === 'DAD'
                ? 'bg-emerald-500 text-white font-bold shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Dad (Admin)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setRole('SON');
              showToast("Switched to Son's Viewer Session");
            }}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-xs transition-all cursor-pointer ${
              role === 'SON'
                ? 'bg-amber-500 text-white font-bold shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Son (Viewer)</span>
          </button>
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

        {/* DAD QUICK CONTROLS */}
        <div className="mb-4">
          <div className="px-2 mb-2 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400/90 font-mono">
              DAD CONTROLS
            </span>
            {role === 'SON' && (
              <span className="text-[9px] text-amber-400 font-mono font-semibold">VIEW ONLY</span>
            )}
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

            <button
              type="button"
              onClick={() => openModal('cloudDbModal')}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-zinc-300 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] transition-all cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Database className="w-3.5 h-3.5 text-amber-400" />
                <span>Cloud DB &amp; Sync</span>
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
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
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow shrink-0 ${
              role === 'DAD'
                ? 'bg-gradient-to-tr from-emerald-600 to-teal-600'
                : 'bg-gradient-to-tr from-amber-600 to-orange-600'
            }`}
          >
            {role === 'DAD' ? <ShieldCheck className="w-4 h-4" /> : <User className="w-4 h-4" />}
          </div>
          <div className="truncate">
            <div className="text-xs font-bold text-white truncate">
              {role === 'DAD' ? 'Manish (Dad)' : 'Aarav (Son)'}
            </div>
            <div className="text-[10px] text-zinc-400 truncate font-mono">
              {role === 'DAD' ? 'Primary Cardholder' : 'Japan Forex Viewer'}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={toggleRole}
          title="Switch Session Role"
          className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
