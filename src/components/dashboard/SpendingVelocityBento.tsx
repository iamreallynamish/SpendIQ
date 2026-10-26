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
  Cell,
} from 'recharts';
import { TrendingUp, FileText, Sparkles, PieChart, Database, ArrowRight } from 'lucide-react';

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
  } = useFinance();

  // Filter transactions according to selected month
  const activeTxs = useMemo(() => {
    if (selectedMonth === 'ALL') return data.transactions;
    return data.transactions.filter((tx) => getTxMonthKey(tx) === selectedMonth);
  }, [data.transactions, selectedMonth]);

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

    // Multi-month trend
    const monthMap: Record<string, number> = {};
    data.transactions.forEach((tx) => {
      const m = getTxMonthKey(tx);
      monthMap[m] = (monthMap[m] || 0) + (Number(tx.amountJpy) || 0);
    });

    const months = ['Aug-2026', 'Sep-2026', 'Oct-2026'];
    const trend = months.map((m) => ({
      month: m.split('-')[0],
      spend: monthMap[m] || 0,
    }));

    return { totalSpendJpy: total, categoryList: cats, monthTrend: trend };
  }, [activeTxs, data.transactions]);

  // Top category
  const topCategory = categoryList[0] || { name: 'None', amount: 0 };
  const topCatShare = totalSpendJpy > 0 ? Math.round((topCategory.amount / totalSpendJpy) * 100) : 0;

  return (
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
                  {selectedMonth === 'ALL' ? 'All historical records' : `${selectedMonth.replace('-', ' ')} monthly burn`}
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
                  className={`bento-seg-btn ${
                    selectedMonth === m ? 'bento-seg-btn-active' : ''
                  }`}
                >
                  {m.split('-')[0]}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setSelectedMonth('ALL')}
                className={`bento-seg-btn ${
                  selectedMonth === 'ALL' ? 'bento-seg-btn-active' : ''
                }`}
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

              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <span className="bento-chip bento-chip-neon font-mono">
                  {activeTxs.length} swipes
                </span>
                <span>
                  Top: <strong className="text-zinc-200">{topCategory.name}</strong> ({topCatShare}%)
                </span>
              </div>
            </div>

            {/* 3-Month Trend Spark Bars */}
            <div className="sm:col-span-7 h-28 w-full bg-white/[0.02] rounded-2xl p-2 border border-white/[0.05]">
              <div className="text-[10px] font-semibold text-zinc-400 px-1 mb-1 flex items-center justify-between">
                <span>3-Month Outflow Velocity</span>
                <span className="font-mono text-[9px]">Aug – Oct 2026</span>
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
                          <div className="font-bold text-[#E8FF1F]">{d.month} 2026</div>
                          <div className="text-white mt-0.5">{formatFromJpy(d.spend, currency)}</div>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="spend" radius={[8, 8, 8, 8]}>
                    {monthTrend.map((entry) => (
                      <Cell
                        key={entry.month}
                        fill={entry.month === 'Oct' ? '#E8FF1F' : 'rgba(255, 255, 255, 0.25)'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Action Bar Footer */}
        <div className="pt-4 mt-5 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-2.5">
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
              <h3 className="text-sm font-bold text-white tracking-tight">Top Categories</h3>
            </div>
            <button
              type="button"
              onClick={() => setActiveView('expenses')}
              className="text-[11px] font-semibold text-zinc-400 hover:text-white cursor-pointer"
            >
              All &rsaquo;
            </button>
          </div>

          {/* Category Progress Bars */}
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
                <div key={cat.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-300 font-medium truncate max-w-[150px]">
                      {cat.name}
                    </span>
                    <span className="text-zinc-400 font-mono-num font-semibold">
                      {formatFromJpy(cat.amount, currency)} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${barColor}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}

            {categoryList.length === 0 && (
              <div className="py-6 text-center text-xs text-zinc-500">
                No expense data for this period.
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
  );
};
