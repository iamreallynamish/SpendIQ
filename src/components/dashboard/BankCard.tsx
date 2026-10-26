import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import { formatFromJpy, formatInrCard } from '../../utils/currency';
import { getTxMonthKey } from '../../utils/smsParser';
import { CreditCard, Clock, Edit2, ShieldCheck, User, Zap, ArrowUpRight, TrendingDown } from 'lucide-react';

export const BankCards: React.FC = () => {
  const { data, currency, openModal, role, setRole, showToast, targetAllowance, selectedMonth } = useFinance();

  // Dynamically compute real spent amounts from actual transactions in selected month
  const monthTxs = React.useMemo(() => {
    if (selectedMonth === 'ALL') return data.transactions;
    return data.transactions.filter((tx) => getTxMonthKey(tx) === selectedMonth);
  }, [data.transactions, selectedMonth]);

  const iciciTxSpentJpy = React.useMemo(() => {
    return monthTxs
      .filter((t) => t.cardCode === 'ICICI')
      .reduce((sum, t) => sum + (Number(t.amountJpy) || 0), 0);
  }, [monthTxs]);

  const axisTxSpentInr = React.useMemo(() => {
    return monthTxs
      .filter((t) => t.cardCode === 'AXIS')
      .reduce((sum, t) => sum + (Number(t.amountInr) || 0), 0);
  }, [monthTxs]);

  // Calculate combined spending power in active currency
  const iciciJpy = data.icici.balanceJpy ?? 0;
  const axisInr = data.axis.balanceInr ?? 0;
  
  // Total spend this cycle - automatically driven by uploaded transactions if available
  const iciciSpentJpy = iciciTxSpentJpy > 0 ? iciciTxSpentJpy : (data.icici.spentJpy ?? 0);
  const axisSpentInr = axisTxSpentInr > 0 ? axisTxSpentInr : (data.axis.spentInr ?? 0);

  // Compute burn rate dynamically
  const currentDailyBurnJpy = Math.max(0, Math.round(iciciSpentJpy / Math.max(1, new Date().getDate())));
  const isOverPace = currentDailyBurnJpy > targetAllowance;

  const toggleRole = () => {
    const next = role === 'DAD' ? 'SON' : 'DAD';
    setRole(next);
    showToast(`Switched session to ${next === 'DAD' ? "Dad's Admin" : "Son's Viewer"}`);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
      {/* CARD 1: ICICI FOREX PREPAID CARD (Span 4) */}
      <div className="lg:col-span-4 icici-card-bg p-5 sm:p-6 flex flex-col justify-between relative group">
        <div>
          {/* Top Row: Network & Chip */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-300">
                <CreditCard className="w-4 h-4" />
              </span>
              <div>
                <span className="text-[13px] font-bold text-white block leading-tight">ICICI Forex Prepaid</span>
                <span className="text-[10px] text-zinc-400 font-medium">Japan Living &amp; Transit</span>
              </div>
            </div>
            <span className="bento-chip bento-chip-emerald font-mono">
              XX0817
            </span>
          </div>

          {/* Balance Figure */}
          <div className="mt-4">
            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400/90 mb-1 flex items-center gap-1.5">
              <span>AVAILABLE BALANCE</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>
            <div className="text-3xl sm:text-[34px] font-extrabold text-white font-mono-num tracking-tight leading-none">
              {formatFromJpy(iciciJpy, currency)}
            </div>
          </div>

          {/* Cycle Spending & SMS Info */}
          <div className="mt-4 pt-3.5 border-t border-white/[0.08] flex items-center justify-between">
            <div>
              <div className="text-[10px] text-zinc-400 font-medium">Cycle Spend</div>
              <div className="text-xs sm:text-sm font-bold text-zinc-200 font-mono-num">
                {formatFromJpy(iciciSpentJpy, currency)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-zinc-400 font-medium">Latest SMS Bal</div>
              <div className="text-[11px] font-mono-num font-semibold text-emerald-300">
                {data.icici.lastSyncInfo}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 mt-4 border-t border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
            <Clock className="w-3.5 h-3.5 text-zinc-500" />
            <span>Next: <strong className="text-zinc-200 font-medium">{data.icici.nextDate}</strong></span>
          </div>
          <button
            type="button"
            onClick={() => openModal('cardBalancesModal')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/25 transition-all cursor-pointer"
          >
            <Edit2 className="w-3 h-3" />
            <span>Adjust</span>
          </button>
        </div>
      </div>

      {/* CARD 2: AXIS BANK CREDIT CARD (Span 4) */}
      <div className="lg:col-span-4 axis-card-bg p-5 sm:p-6 flex flex-col justify-between relative group">
        <div>
          {/* Top Row: Network & Chip */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-300">
                <CreditCard className="w-4 h-4" />
              </span>
              <div>
                <span className="text-[13px] font-bold text-white block leading-tight">Axis Bank Credit Card</span>
                <span className="text-[10px] text-zinc-400 font-medium">Dad Primary &amp; Online</span>
              </div>
            </div>
            <span className="bento-chip bento-chip-amber font-mono">
              XX7117
            </span>
          </div>

          {/* Balance Figure */}
          <div className="mt-4">
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400/90 mb-1 flex items-center gap-1.5">
              <span>AVAILABLE CREDIT LIMIT</span>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            </div>
            <div className="text-3xl sm:text-[34px] font-extrabold text-white font-mono-num tracking-tight leading-none">
              {formatInrCard(axisInr, currency)}
            </div>
          </div>

          {/* Cycle Spending & SMS Info */}
          <div className="mt-4 pt-3.5 border-t border-white/[0.08] flex items-center justify-between">
            <div>
              <div className="text-[10px] text-zinc-400 font-medium">Cycle Spend</div>
              <div className="text-xs sm:text-sm font-bold text-zinc-200 font-mono-num">
                {formatInrCard(axisSpentInr, currency)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-zinc-400 font-medium">Latest SMS Bal</div>
              <div className="text-[11px] font-mono-num font-semibold text-amber-300">
                {data.axis.lastSyncInfo}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 mt-4 border-t border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
            <Clock className="w-3.5 h-3.5 text-zinc-500" />
            <span>Due: <strong className="text-zinc-200 font-medium">{data.axis.nextDate}</strong></span>
          </div>
          <button
            type="button"
            onClick={() => openModal('cardBalancesModal')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/25 transition-all cursor-pointer"
          >
            <Edit2 className="w-3 h-3" />
            <span>Adjust</span>
          </button>
        </div>
      </div>

      {/* CARD 3: FAMILY NET CASH FLOW & ALLOWANCE BURN (Span 4) */}
      <div className="lg:col-span-4 funds-card-bg p-5 sm:p-6 flex flex-col justify-between relative group">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-[#a9b2ff]/15 border border-[#a9b2ff]/30 flex items-center justify-center text-[#a9b2ff]">
                <Zap className="w-4 h-4" />
              </span>
              <div>
                <span className="text-[13px] font-bold text-white block leading-tight">Allowance Pace &amp; Session</span>
                <span className="text-[10px] text-zinc-400 font-medium">Target: ¥{targetAllowance}/day</span>
              </div>
            </div>
            <button
              type="button"
              onClick={toggleRole}
              className={`bento-chip cursor-pointer transition-all ${
                role === 'DAD' ? 'bento-chip-emerald' : 'bento-chip-amber'
              }`}
            >
              {role === 'DAD' ? 'Dad (Admin)' : 'Son (Viewer)'}
            </button>
          </div>

          {/* Daily Burn Rate vs Target */}
          <div className="mt-4">
            <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1 flex items-center justify-between">
              <span>CURRENT DAILY BURN</span>
              <span className={`text-[11px] font-mono-num font-semibold ${isOverPace ? 'text-amber-400' : 'text-emerald-400'}`}>
                {isOverPace ? '+ Over target' : '✓ Within budget'}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <div className="text-3xl sm:text-[34px] font-extrabold text-white font-mono-num tracking-tight leading-none">
                {formatFromJpy(currentDailyBurnJpy, currency)}
              </div>
              <span className="text-xs text-zinc-400 font-medium">/ day</span>
            </div>
          </div>

          {/* Progress Bar of Daily Allowance */}
          <div className="mt-3">
            <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isOverPace ? 'bg-amber-400' : 'bg-[#E8FF1F]'
                }`}
                style={{ width: `${Math.min(100, Math.round((currentDailyBurnJpy / targetAllowance) * 100))}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-1 text-[10px] text-zinc-400 font-mono-num">
              <span>Target ¥{targetAllowance}</span>
              <span>{Math.round((currentDailyBurnJpy / targetAllowance) * 100)}% pace</span>
            </div>
          </div>
        </div>

        {/* Quick Action Footer */}
        <div className="pt-4 mt-4 border-t border-white/[0.08] flex items-center justify-between">
          <span className="text-[11px] text-zinc-400 truncate">
            {role === 'DAD' ? 'Full admin rights' : 'Read-only view'}
          </span>
          <button
            type="button"
            onClick={toggleRole}
            className="text-[11px] font-semibold text-[#E8FF1F] hover:underline cursor-pointer flex items-center gap-1"
          >
            <span>Switch Role</span>
            <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

export const BankCard = BankCards;
export default BankCards;
