import React, { useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { formatFromJpy } from '../../utils/currency';
import { getTxMonthKey } from '../../utils/smsParser';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { TrendingUp, FileText, Sparkles, PieChart, ArrowRight, Filter, X, Layers } from 'lucide-react';

export const SpendingVelocityBento: React.FC = () => {
  const {
    data,
    currency,
    selectedMonth,
    setSelectedMonth,
    availableMonths,
    openModal,
    smartRecategorizeAll,
    setActiveView,
    selectedCategory,
    setSelectedCategory,
    openCategoryInspector,
  } = useFinance();

  // Filter transactions according to selected month and category
  const activeTxs = useMemo(() => {
    let list = data.transactions;
    if (selectedMonth !== 'ALL') {
      list = list.filter((tx) => getTxMonthKey(tx) === selectedMonth);
    }
    if (selectedCategory) {
      list = list.filter((tx) => tx.category === selectedCategory);
    }
    return list;
  }, [data.transactions, selectedMonth, selectedCategory]);

  // Aggregate daily or category data for the chart
  const { totalSpendJpy, categoryList, monthTrend } = useMemo(() => {
    let total = 0;
    const catMap: Record<string, number> = {};

    activeTxs.forEach((tx) => {
      const amt = Number(tx.amountJpy) || 0;
      total += amt;
      catMap[tx.category] = (catMap[tx.category] || 0) + amt;
    });

    const cats = Object.entries(catMap)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);

    // Multi-month trend dynamically from actual months present
    const monthMap: Record<string, number> = {};
    data.transactions.forEach((tx) => {
      const m = getTxMonthKey(tx);
      monthMap[m] = (monthMap[m] || 0) + (Number(tx.amountJpy) || 0);
    });

    // Use available months or fallback
    const candidateMonths = availableMonths.filter((m) => m !== 'ALL');
    const trendMonths = candidateMonths.length > 0 ? candidateMonths.slice(0, 5) : ['Oct-2026'];
    const trend = trendMonths.map((m) => ({
      month: m.split('-')[0],
      monthKey: m,
      spend: monthMap[m] || 0,
    }));

    return { totalSpendJpy: total, categoryList: cats, monthTrend: trend };
  }, [activeTxs, data.transactions, availableMonths]);

  // Top category
  const topCategory = categoryList[0] || { name: 'None', amount: 0 };
  const topCatShare = totalSpendJpy > 0 ? Math.round((topCategory.amount / totalSpendJpy) * 100) : 0;

  // Check if transactions exist in other months
  const hasTransactionsInOtherMonths =
    activeTxs.length === 0 && data.transactions.length > 0 && selectedMonth !== 'ALL';

  return (
    <div className="space-y-4">
      {/* Category Filter Active Banner */}
      {selectedCategory && (
        <div className="p-3.5 rounded-2xl bg-[#E8FF1F]/10 border border-[#E8FF1F]/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-xl bg-[#E8FF1F] flex items-center justify-center text-black font-extrabold text-xs">
              <Filter className="w-3.5 h-3.5" />
            </span>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <span>Dashboard Filtered by Category:</span>
                <span className="bento-chip bento-chip-neon font-mono text-xs">{selectedCategory}</span>
              </div>
              <div className="text-[11px] text-zinc-300 font-mono mt-0.5">
                Showing {activeTxs.length} transactions totaling {formatFromJpy(totalSpendJpy, currency)}.
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => openCategoryInspector(selectedCategory)}
              className="text-xs font-semibold text-[#E8FF1F] hover:underline cursor-pointer"
            >
              Inspect Highest &rsaquo;
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory(null)}
              className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Clear category filter"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Cross-Month Notice when current selected month has 0 transactions */}
      {hasTransactionsInOtherMonths && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between">
          <div className="text-xs text-amber-200">
            Selected view <strong className="font-mono text-white">{selectedMonth}</strong> has 0 transactions, but you have{' '}
            <strong className="text-white">{data.transactions.length}</strong> total transactions in your ledger.
          </div>
          <button
            type="button"
            onClick={() => setSelectedMonth('ALL')}
            className="bento-btn-primary h-7 px-3 text-xs"
          >
            <span>View All Months ({data.transactions.length} Tx)</span>
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
        {/* CARD 1: SPENDING VELOCITY & ACTION HUB (Span 8) */}
        <div className="lg:col-span-8 bento-card p-5 sm:p-6 flex flex-col justify-between">
          <div>
            {/* Top Header & Segmented Timeframe Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.08]">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-white/[0.06] border border-white/[0.12] flex items-center justify-center text-[#E8FF1F]">
                  <TrendingUp className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">Spending Flow &amp; Trend</h3>
                  <p className="text-[11px] text-zinc-400">
                    {selectedMonth === 'ALL'
                      ? 'All historical records'
                      : `${selectedMonth.replace('-', ' ')} monthly outflow`}
                  </p>
                </div>
              </div>

              {/* Bento Segmented Month Switcher */}
              <div className="bento-seg self-start sm:self-auto">
                {availableMonths.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setSelectedMonth(m)}
                    className={`bento-seg-btn ${selectedMonth === m ? 'bento-seg-btn-active' : ''}`}
                  >
                    {m.split('-')[0]}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setSelectedMonth('ALL')}
                  className={`bento-seg-btn ${selectedMonth === 'ALL' ? 'bento-seg-btn-active' : ''}`}
                >
                  All
                </button>
              </div>
            </div>

            {/* Metrics & Mini Chart Row */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 mt-5 items-center">
              {/* Main Spend Figure */}
              <div className="sm:col-span-5 space-y-3">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                    TOTAL RECORDED OUTFLOW
                  </div>
                  <div className="text-3xl sm:text-4xl font-extrabold text-white font-mono-num leading-none">
                    {formatFromJpy(totalSpendJpy, currency)}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                  <span className="bento-chip bento-chip-neon font-mono">
                    {activeTxs.length} {activeTxs.length === 1 ? 'swipe' : 'swipes'}
                  </span>
                  {topCategory.name !== 'None' && (
                    <button
                      type="button"
                      onClick={() => openCategoryInspector(topCategory.name)}
                      className="hover:text-white transition-colors cursor-pointer text-left"
                    >
                      Top: <strong className="text-zinc-200 underline decoration-dotted">{topCategory.name}</strong> ({topCatShare}%)
                    </button>
                  )}
                </div>
              </div>

              {/* Multi-Month Trend Spark Bars */}
              <div className="sm:col-span-7 h-28 w-full bg-white/[0.02] rounded-2xl p-2 border border-white/[0.05]">
                <div className="text-[10px] font-semibold text-zinc-400 px-1 mb-1 flex items-center justify-between">
                  <span>Outflow Velocity Across Months</span>
                  <span className="font-mono text-[9px] text-[#E8FF1F]">Recharts Engine</span>
                </div>
                <ResponsiveContainer width="100%" height={80}>
                  <BarChart data={monthTrend} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                    <XAxis
                      dataKey="month"
                      tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'Geist Mono' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis hide domain={[0, 'auto']} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const d = payload[0].payload;
                        return (
                          <div className="rounded-xl bg-black border border-white/20 p-2 text-xs shadow-xl font-mono">
                            <div className="font-bold text-[#E8FF1F]">{d.month}</div>
                            <div className="text-white mt-0.5">{formatFromJpy(d.spend, currency)}</div>
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="spend" radius={[6, 6, 0, 0]} fill="#E8FF1F" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-4 mt-5 border-t border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => openModal('smsModal')}
                className="bento-btn-primary"
              >
                <FileText className="w-4 h-4" />
                <span>Parse SMS Batch</span>
              </button>
              <button
                type="button"
                onClick={smartRecategorizeAll}
                className="bento-btn-secondary"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Smart Categorize</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setActiveView('insights')}
              className="text-xs font-semibold text-zinc-300 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>View Full Insights</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#E8FF1F]" />
            </button>
          </div>
        </div>

        {/* CARD 2: CATEGORY ALLOCATION BREAKDOWN (Span 4) */}
        <div className="lg:col-span-4 bento-card p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-300">
                  <PieChart className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">Top Categories</h3>
                  <p className="text-[10px] text-zinc-400">Click to view highest transactions</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveView('expenses')}
                className="text-[11px] font-semibold text-[#E8FF1F] hover:underline cursor-pointer"
              >
                All &rsaquo;
              </button>
            </div>

            {/* Clickable Category Progress Bars */}
            <div className="space-y-3 mt-4">
              {categoryList.slice(0, 4).map((cat, idx) => {
                const pct = totalSpendJpy > 0 ? Math.round((cat.amount / totalSpendJpy) * 100) : 0;
                const barColor =
                  idx === 0
                    ? 'bg-[#E8FF1F]'
                    : idx === 1
                    ? 'bg-emerald-400'
                    : idx === 2
                    ? 'bg-amber-400'
                    : 'bg-indigo-400';

                return (
                  <button
                    key={cat.name}
                    type="button"
                    onClick={() => openCategoryInspector(cat.name)}
                    className="w-full text-left space-y-1 p-2 rounded-xl hover:bg-white/[0.04] transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-200 group-hover:text-[#E8FF1F] font-semibold truncate max-w-[150px] transition-colors flex items-center gap-1.5">
                        <span>{cat.name}</span>
                        <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </span>
                      <span className="text-zinc-400 font-mono-num font-semibold">
                        {formatFromJpy(cat.amount, currency)}{' '}
                        <span className="text-[10px] text-zinc-400 font-mono">({pct}%)</span>
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${barColor}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </button>
                );
              })}

              {categoryList.length === 0 && (
                <div className="py-6 text-center text-xs text-zinc-500 font-mono">
                  No expense records for this period.
                </div>
              )}
            </div>
          </div>

          {/* Footer Insight */}
          <div className="pt-3.5 mt-4 border-t border-white/[0.08] flex items-center justify-between text-xs">
            <span className="text-zinc-400 text-[11px]">Active Categories</span>
            <span className="bento-chip font-mono">{categoryList.length} total</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpendingVelocityBento;
