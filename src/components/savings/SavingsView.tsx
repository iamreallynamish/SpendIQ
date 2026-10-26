import React, { useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { formatFromJpy } from '../../utils/currency';
import { getTxMonthKey } from '../../utils/smsParser';
import { Plus, TrendingUp, Trash2, LineChart, ShieldCheck } from 'lucide-react';

export const SavingsView: React.FC = () => {
  const {
    data,
    currency,
    selectedMonth,
    targetAllowance,
    openModal,
    role,
    deleteStock,
  } = useFinance();

  const monthKey = selectedMonth === 'ALL' ? 'Oct-2026' : selectedMonth;

  // Actual spend for ICICI in the selected month
  const monthTxs = useMemo(() => {
    return data.transactions.filter((t) => getTxMonthKey(t) === monthKey);
  }, [data.transactions, monthKey]);

  const iciciMonthSpent = useMemo(() => {
    return monthTxs
      .filter((t) => t.cardCode === 'ICICI')
      .reduce((sum, t) => sum + (Number(t.amountJpy) || 0), 0);
  }, [monthTxs]);

  const netSavedThisMonth = targetAllowance - iciciMonthSpent;
  const savedPct = targetAllowance > 0 ? Math.round((netSavedThisMonth / targetAllowance) * 100) : 0;
  const totalEquityJpy = data.stocks.reduce((sum, s) => sum + (Number(s.valueJpy) || 0), 0);

  const monthsToCompare = ['Aug-2026', 'Sep-2026', 'Oct-2026'];

  return (
    <div className="space-y-6 pb-14">
      {/* Page Header */}
      <div className="bento-card p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-white/[0.06] border border-white/[0.12] flex items-center justify-center text-[#E8FF1F]">
              <LineChart className="w-4 h-4" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-sans">
              Savings &amp; Equity Portfolio
            </h1>
            <span className="bento-chip bento-chip-neon font-mono">
              Family Reserve
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Tracking monthly allowance savings surplus, reserve buffer, and long-term equity holdings.
          </p>
        </div>

        {role === 'DAD' && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => openModal('addStockModal')}
              className="bento-btn-primary h-8 px-3 text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Stock Holding</span>
            </button>
          </div>
        )}
      </div>

      {/* Monthly Savings Calculator Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bento-card p-5 flex flex-col justify-between">
          <div className="text-[10px] uppercase tracking-wider font-mono font-bold text-zinc-400">
            Monthly Target Budget
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono-num mt-2">
            {formatFromJpy(targetAllowance, currency)}
          </div>
          <div className="text-[11px] text-zinc-400 mt-1 font-mono">
            {monthKey.replace('-', ' ')} Pocket Allowance
          </div>
        </div>

        <div className="bento-card p-5 flex flex-col justify-between">
          <div className="text-[10px] uppercase tracking-wider font-mono font-bold text-zinc-400">
            Actual Spent This Month
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-rose-400 font-mono-num mt-2">
            {formatFromJpy(iciciMonthSpent, currency)}
          </div>
          <div className="text-[11px] text-zinc-400 mt-1 font-mono">
            {monthTxs.filter((t) => t.cardCode === 'ICICI').length} ICICI swipes in {monthKey.replace('-', ' ')}
          </div>
        </div>

        <div className="bento-card p-5 flex flex-col justify-between border-emerald-500/30">
          <div className="text-[10px] uppercase tracking-wider font-mono font-bold text-emerald-400">
            Net Saved vs Budget
          </div>
          <div
            className={`text-2xl sm:text-3xl font-extrabold font-mono-num mt-2 ${
              netSavedThisMonth >= 0 ? 'text-[#E8FF1F]' : 'text-rose-400'
            }`}
          >
            {(netSavedThisMonth >= 0 ? '+' : '-') + formatFromJpy(Math.abs(netSavedThisMonth), currency)}
          </div>
          <div className="text-[11px] text-zinc-400 mt-1 font-mono">
            {netSavedThisMonth >= 0
              ? `${savedPct}% of ${monthKey.replace('-', ' ')} budget saved`
              : `Over budget by ${formatFromJpy(Math.abs(netSavedThisMonth), currency)}`}
          </div>
        </div>

        <div className="bento-card p-5 flex flex-col justify-between border-[#a9b2ff]/30">
          <div className="text-[10px] uppercase tracking-wider font-mono font-bold text-[#a9b2ff]">
            Total Equity Portfolio
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#a9b2ff] font-mono-num mt-2">
            {formatFromJpy(totalEquityJpy, currency)}
          </div>
          <div className="text-[11px] text-zinc-400 mt-1 font-mono">
            {data.stocks.length} Long-Term Holdings
          </div>
        </div>
      </div>

      {/* Month-by-Month Savings & Spend History Table + Equity Holdings */}
      <div className="bento-card p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.08]">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-tight uppercase">
                Monthly Savings Breakdown (3-Month Comparison)
              </h2>
              <span className="bento-chip bento-chip-emerald font-mono">
                Exact Math
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              August, September, and October transactions calculated separately against monthly allowance.
            </p>
          </div>
        </div>

        {/* Monthly Breakdown Strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {monthsToCompare.map((mKey) => {
            const txs = data.transactions.filter((t) => getTxMonthKey(t) === mKey);
            const iciciSpent = txs
              .filter((t) => t.cardCode === 'ICICI')
              .reduce((s, t) => s + (Number(t.amountJpy) || 0), 0);
            const axisSpent = txs
              .filter((t) => t.cardCode === 'AXIS')
              .reduce((s, t) => s + (Number(t.amountJpy) || 0), 0);
            const saved = targetAllowance - iciciSpent;
            const isCurrent = mKey === monthKey;

            return (
              <div
                key={mKey}
                className={`p-4 rounded-2xl bg-white/[0.02] border space-y-2 transition-all ${
                  isCurrent
                    ? 'border-[#E8FF1F] shadow-[0_0_20px_rgba(232,255,31,0.15)]'
                    : 'border-white/[0.06]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-white font-mono">{mKey.replace('-', ' ')}</span>
                  <span
                    className={`bento-chip font-mono text-[10px] ${
                      saved >= 0
                        ? 'bento-chip-emerald'
                        : 'text-rose-400 border-rose-500/30'
                    }`}
                  >
                    {saved >= 0 ? `+${formatFromJpy(saved, currency)}` : `-${formatFromJpy(Math.abs(saved), currency)}`}
                  </span>
                </div>
                <div className="text-[11px] text-zinc-400 space-y-1 pt-1 font-mono">
                  <div className="flex justify-between">
                    <span>ICICI Japan Spent:</span>
                    <strong className="text-white font-mono-num">{formatFromJpy(iciciSpent, currency)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Axis India Spent:</span>
                    <strong className="text-zinc-300 font-mono-num">{formatFromJpy(axisSpent, currency)}</strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Stock Holdings Grid */}
        <div className="pt-4 border-t border-white/[0.08]">
          <div className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center justify-between">
            <span>Family Stock Holdings</span>
            <span className="text-zinc-500 font-mono text-[11px]">{data.stocks.length} assets</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {data.stocks.map((stock) => (
              <div
                key={stock.id}
                className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between gap-3 hover:border-white/15 transition-all"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bento-chip font-mono text-[11px]">{stock.ticker}</span>
                    <span className="text-xs font-bold text-white truncate max-w-[120px]">{stock.name}</span>
                  </div>
                  <div className="text-[11px] text-zinc-400 font-mono mt-1">
                    {stock.units} units
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-extrabold text-white font-mono-num">
                    {formatFromJpy(stock.valueJpy, currency)}
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 font-mono">
                    {stock.gain}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SavingsView;
