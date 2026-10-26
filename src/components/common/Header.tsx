import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Camera, ScanLine, Sparkles, FileText, Database, Calendar } from 'lucide-react';
import { Currency } from '../../types/finance';

export const Header: React.FC = () => {
  const {
    role,
    currency,
    setCurrency,
    selectedMonth,
    setSelectedMonth,
    availableMonths,
    dbStatusMsg,
    openModal,
    openReceiptScannerForTx,
  } = useFinance();

  const currencies: Currency[] = ['JPY', 'INR', 'USD'];

  return (
    <header className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 pb-5 border-b border-white/[0.08]">
      <div>
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-sans">
            Family Financial Dashboard
          </h1>
          <span
            className={`bento-chip font-mono ${
              role === 'DAD' ? 'bento-chip-emerald' : 'bento-chip-amber'
            }`}
          >
            {role === 'DAD' ? "DAD'S ADMIN" : "SON'S VIEWER"}
          </span>
          <button
            type="button"
            onClick={() => openModal('cloudDbModal')}
            className="inline-flex items-center gap-1.5 bento-chip text-zinc-300 hover:border-emerald-500/40 transition-colors cursor-pointer"
            title="Configure Shared Family Cloud Database"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>{dbStatusMsg}</span>
          </button>
        </div>
        <p className="text-xs text-zinc-400 mt-1">
          Live tracking for ICICI Forex Card (XX0817) &amp; Axis Bank Card (XX7117).
        </p>
      </div>

      {/* Top Right Controls */}
      <div className="flex flex-wrap items-center gap-2.5">
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
    </header>
  );
};
