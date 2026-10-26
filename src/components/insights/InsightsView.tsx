import React, { useMemo, useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { formatFromJpy } from '../../utils/currency';
import { ThreeMonthSpendSummaryCard } from './ThreeMonthSpendSummaryCard';
import {
  BarChart3,
  Store,
  DollarSign,
  CreditCard,
} from 'lucide-react';

export const InsightsView: React.FC = () => {
  const { data, currency, targetAllowance, openModal } = useFinance();
  const [selectedMerchantCategory, setSelectedMerchantCategory] = useState<string>('ALL');

  // Dynamic list of categories present in transactions
  const categoriesPresent = useMemo(() => {
    const set = new Set<string>();
    data.transactions.forEach((t) => {
      if (t.category) set.add(t.category);
    });
    return Array.from(set);
  }, [data.transactions]);

  // Compute vendor frequency & total spent per merchant
  const merchantAnalytics = useMemo(() => {
    const map: Record<string, { count: number; totalJpy: number; category: string; card: string }> = {};

    data.transactions.forEach((tx) => {
      if (selectedMerchantCategory !== 'ALL' && tx.category !== selectedMerchantCategory) {
        return;
      }
      if (!map[tx.merchant]) {
        map[tx.merchant] = {
          count: 0,
          totalJpy: 0,
          category: tx.category,
          card: tx.cardUsed,
        };
      }
      map[tx.merchant].count += 1;
      map[tx.merchant].totalJpy += Number(tx.amountJpy) || 0;
    });

    return Object.entries(map)
      .map(([name, stats]) => ({
        name,
        count: stats.count,
        totalJpy: stats.totalJpy,
        category: stats.category,
        card: stats.card,
      }))
      .sort((a, b) => b.totalJpy - a.totalJpy);
  }, [data.transactions, selectedMerchantCategory]);

  // Overall metrics across transactions
  const totalSpendAllTimeJpy = useMemo(() => {
    return data.transactions.reduce((acc, tx) => acc + (Number(tx.amountJpy) || 0), 0);
  }, [data.transactions]);

  const iciciShare = useMemo(() => {
    const iciciTotal = data.transactions
      .filter((t) => t.cardCode === 'ICICI')
      .reduce((acc, tx) => acc + (Number(tx.amountJpy) || 0), 0);
    return totalSpendAllTimeJpy > 0 ? Math.round((iciciTotal / totalSpendAllTimeJpy) * 100) : 0;
  }, [data.transactions, totalSpendAllTimeJpy]);

  return (
    <div className="space-y-6 pb-16">
      {/* 1. Insights Page Header */}
      <div className="bento-card p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-[#E8FF1F]/15 border border-[#E8FF1F]/30 flex items-center justify-center text-[#E8FF1F]">
              <BarChart3 className="w-4 h-4" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-sans">
              Financial Insights &amp; Analytics
            </h1>
            <span className="bento-chip bento-chip-neon font-mono">
              3-Month Ledger
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Category spending breakdown, merchant analytics, and currency velocity across your active ledgers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bento-chip bento-chip-emerald font-mono">
            {data.transactions.length} Verified Transactions
          </div>
        </div>
      </div>

      {/* 2. Primary 3-Month Spending Breakdown Summary Card (Recharts) */}
      <ThreeMonthSpendSummaryCard />

      {/* 3. Bento Grid: Merchant Outflow & Multi-Currency Dynamic Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Top Merchants & Frequency (Span 7) */}
        <div className="lg:col-span-7 bento-card p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-white/[0.08]">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-white/[0.06] border border-white/[0.12] flex items-center justify-center text-amber-400">
                  <Store className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    Merchant Outflow &amp; Frequency
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Highest volume merchants and visit frequencies across your card transactions
                  </p>
                </div>
              </div>

              {/* Dynamic Category Filter */}
              {categoriesPresent.length > 0 && (
                <select
                  value={selectedMerchantCategory}
                  onChange={(e) => setSelectedMerchantCategory(e.target.value)}
                  className="bg-black text-[11px] font-mono font-semibold text-zinc-300 border border-white/10 rounded-xl px-2.5 py-1.5 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Categories</option>
                  {categoriesPresent.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Merchant Rows or Clean Blank State */}
            {merchantAnalytics.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-10 h-10 mx-auto rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-zinc-500">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">No merchant outflow recorded</div>
                  <p className="text-[11px] text-zinc-400 max-w-xs mx-auto mt-0.5">
                    Start adding transactions or parse SMS receipts to view top vendor volume, visit counts, and category breakdowns.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openModal('smsModal')}
                  className="bento-btn-primary h-7 px-3 text-[11px] inline-flex items-center gap-1.5 mx-auto cursor-pointer"
                >
                  <span>+ Add Transactions</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2.5 mt-4">
                {merchantAnalytics.slice(0, 5).map((m, idx) => {
                  const pct = totalSpendAllTimeJpy > 0 ? Math.round((m.totalJpy / totalSpendAllTimeJpy) * 100) : 0;
                  return (
                    <div
                      key={m.name}
                      className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between gap-3 hover:bg-white/[0.05] transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-[11px] font-bold text-zinc-300 font-mono">
                          #{idx + 1}
                        </span>
                        <div className="truncate">
                          <div className="text-xs font-bold text-white truncate">{m.name}</div>
                          <div className="text-[10px] text-zinc-400 font-mono">
                            {m.category} • {m.count} {m.count === 1 ? 'visit' : 'visits'}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-xs sm:text-sm font-bold text-white font-mono-num">
                          {formatFromJpy(m.totalJpy, currency)}
                        </div>
                        <div className="text-[10px] text-zinc-400 font-mono-num">
                          {pct}% total volume
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-3.5 mt-4 border-t border-white/[0.08] flex items-center justify-between text-xs text-zinc-400 font-mono">
            <span>
              {merchantAnalytics.length === 0
                ? '0 merchants tracked'
                : `Tracking ${merchantAnalytics.length} unique ${merchantAnalytics.length === 1 ? 'merchant' : 'merchants'}`}
            </span>
            <span className={merchantAnalytics.length > 0 ? 'text-[#E8FF1F]' : 'text-zinc-500'}>
              {merchantAnalytics.length > 0 ? 'Live ledger match' : 'Awaiting data'}
            </span>
          </div>
        </div>

        {/* Currency & Card Allocation Breakdown (Span 5) */}
        <div className="lg:col-span-5 bento-card p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 pb-4 border-b border-white/[0.08]">
              <span className="w-8 h-8 rounded-xl bg-white/[0.06] border border-white/[0.12] flex items-center justify-center text-emerald-400">
                <DollarSign className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight">
                  Card &amp; Currency Distribution
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Forex (JPY) vs Domestic Credit (INR) allocation
                </p>
              </div>
            </div>

            {totalSpendAllTimeJpy === 0 ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-10 h-10 mx-auto rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-zinc-500">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">No card spending recorded</div>
                  <p className="text-[11px] text-zinc-400 max-w-xs mx-auto mt-0.5">
                    As you record transactions on ICICI Forex or Axis Bank, spending volume and distribution will appear here.
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-emerald-400">ICICI Forex XX0817 ({iciciShare}%)</span>
                    <span className="font-semibold text-amber-400">Axis Credit XX7117 ({100 - iciciShare}%)</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden flex">
                    <div
                      className="bg-emerald-400 h-full transition-all duration-500"
                      style={{ width: `${iciciShare}%` }}
                    />
                    <div
                      className="bg-amber-400 h-full transition-all duration-500"
                      style={{ width: `${100 - iciciShare}%` }}
                    />
                  </div>
                </div>

                {/* Conversion Preview Matrix */}
                <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    Real-time Reference Pegs
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="p-2 rounded-xl bg-black border border-white/10">
                      <div className="text-[10px] text-zinc-400">100 JPY ≈</div>
                      <div className="text-white font-bold font-mono-num">₹56.00 INR</div>
                    </div>
                    <div className="p-2 rounded-xl bg-black border border-white/10">
                      <div className="text-[10px] text-zinc-400">1 USD ≈</div>
                      <div className="text-white font-bold font-mono-num">¥150 JPY</div>
                    </div>
                  </div>
                </div>

                {/* Allowance Target Pace */}
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-white">Target Allowance Pace</div>
                    <div className="text-[11px] text-zinc-300">¥{targetAllowance.toLocaleString()}/day cap for daily variable spend</div>
                  </div>
                  <span className="bento-chip bento-chip-emerald font-mono">
                    Active
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="pt-3.5 mt-4 border-t border-white/[0.08] flex items-center justify-between text-xs text-zinc-400">
            <span>Selected display: <strong className="text-white font-mono">{currency}</strong></span>
            <span className="text-[11px] text-zinc-400">Converted live</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InsightsView;
