import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { useAuth } from '../../context/AuthContext';
import { Camera, FileText, Calendar, Lock } from 'lucide-react';
import { Currency } from '../../types/finance';
import { UserProfileModal } from '../modals/UserProfileModal';

export const Header: React.FC = () => {
  const {
    currency,
    setCurrency,
    selectedMonth,
    setSelectedMonth,
    availableMonths,
    openModal,
    openReceiptScannerForTx,
  } = useFinance();

  const { userProfile, lockApp } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const currencies: Currency[] = ['JPY', 'INR', 'USD'];

  const getGreeting = () => {
    const hour = new Date().getHours();
    const name = userProfile?.displayName || 'Namish';
    if (hour < 12) return `Good morning, ${name}`;
    if (hour < 18) return `Good afternoon, ${name}`;
    return `Good evening, ${name}`;
  };

  return (
    <header className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 pb-5 border-b border-white/[0.08]">
      <div>
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-sans">
            {getGreeting()}
          </h1>
          <span className="bento-chip bento-chip-emerald font-mono">
            VAULT ACTIVE
          </span>
        </div>
        <p className="text-xs text-zinc-400 mt-1">
          Personal Financial Intelligence &bull; Live Card &amp; Expense Tracking
        </p>
      </div>

      {/* Top Right Controls */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* User Profile & Lock Trigger */}
        <div className="inline-flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsProfileOpen(true)}
            className="inline-flex items-center gap-2 bento-chip bg-zinc-900 hover:bg-zinc-800 border-white/10 hover:border-[#E8FF1F]/30 text-white transition-all cursor-pointer"
            title="Account & Security Settings"
          >
            <div className="w-4 h-4 rounded-full bg-[#E8FF1F] text-black font-extrabold text-[10px] flex items-center justify-center">
              {(userProfile?.displayName || 'N').charAt(0).toUpperCase()}
            </div>
            <span className="font-semibold text-xs">{userProfile?.displayName || 'Namish'}</span>
          </button>
          <button
            type="button"
            onClick={lockApp}
            className="p-1.5 rounded-xl bg-zinc-900 border border-white/10 text-zinc-400 hover:text-[#E8FF1F] hover:border-white/20 transition-all cursor-pointer"
            title="Lock App Screen with 4-Digit PIN"
          >
            <Lock className="w-3.5 h-3.5 text-[#E8FF1F]" />
          </button>
        </div>

        {/* Global Month Filter */}
        <div className="inline-flex items-center gap-1.5 bg-black px-2.5 py-1 rounded-xl border border-white/10">
          <Calendar className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer font-mono"
          >
            {availableMonths.map((m) => (
              <option key={m} value={m} className="bg-black text-white">
                {m.replace('-', ' ')}
              </option>
            ))}
            <option value="ALL" className="bg-black text-white">
              All Months
            </option>
          </select>
        </div>

        {/* Bento Currency Switcher */}
        <div className="bento-seg">
          {currencies.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCurrency(c)}
              className={`bento-seg-btn ${currency === c ? 'bento-seg-btn-active' : ''}`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Visual Intelligence Receipt Scanner Button */}
        <button
          type="button"
          onClick={() => openReceiptScannerForTx(null)}
          className="bento-btn-primary h-8 px-3 text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(232,255,31,0.25)] hover:shadow-[0_0_20px_rgba(232,255,31,0.4)] transition-all cursor-pointer"
          title="Scan store receipt / bill with Visual Intelligence"
        >
          <Camera className="w-3.5 h-3.5 text-black" />
          <span className="font-bold text-black">Scan Bill (AI)</span>
        </button>

        {/* Bulk SMS Parser Button */}
        <button
          type="button"
          onClick={() => openModal('smsModal')}
          className="bento-btn-secondary h-8 px-3 text-xs"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>SMS Parser</span>
        </button>
      </div>

      {/* User Profile Modal */}
      <UserProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </header>
  );
};
