import React, { useMemo, useState } from 'react';
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
  Legend,
  CartesianGrid,
} from 'recharts';
import { TrendingUp, Layers, PieChart as PieIcon, Sparkles } from 'lucide-react';

const CATEGORY_COLORS: Record<string, string> = {
  'Convenience Store': '#10b981',
  'Food & Dining': '#f97316',
  'Clothing & Apparel': '#d97706',
  'Travel & Transit': '#A9B2FF',
  'Cash Withdrawal': '#f43f5e',
  'Regular Transaction': '#ffffff',
  'Furniture & Home': '#e2b887',
  'Electronics & Tech': '#E8FF1F',
  'Utilities & Telecom': '#38bdf8',
  'Healthcare & Pharmacy': '#a78bfa',
  'Education & Dorm': '#FFB37A',
};

export const ThreeMonthSpendSummaryCard: React.FC = () => {
  const { data, currency, openModal } = useFinance();
  const [chartMode, setChartMode] = useState<'stacked' | 'grouped'>('stacked');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');

  // Determine the last 3 months present in transactions or fallback to Aug, Sep, Oct 2026
  const { monthsList, monthlyData, categorySummary, totals } = useMemo(() => {
    const months = ['Aug-2026', 'Sep-2026', 'Oct-2026'];
    const monthLabels = ['Aug 2026', 'Sep 2026', 'Oct 2026'];

    // Map: month -> category -> total JPY
    const matrix: Record<string, Record<string, number>> = {
      'Aug-2026': {},
      'Sep-2026': {},
      'Oct-2026': {},
    };

    const catTotalsOverall: Record<string, number> = {};

    data.transactions.forEach((tx) => {
      const mKey = getTxMonthKey(tx);
      const amt = Number(tx.amountJpy) || 0;
      const cat = tx.category || 'Regular Transaction';

      if (matrix[mKey]) {
        matrix[mKey][cat] = (matrix[mKey][cat] || 0) + amt;
      }
      catTotalsOverall[cat] = (catTotalsOverall[cat] || 0) + amt;
    });

    // Recharts format: 1 item per month with category keys
    const chartBars = months.map((mKey, idx) => {
      const row: Record<string, string | number> = {
        month: monthLabels[idx],
        monthKey: mKey,
      };
      let monthTotal = 0;
      Object.keys(catTotalsOverall).forEach((cat) => {
        const val = matrix[mKey][cat] || 0;
        row[cat] = val;
        monthTotal += val;
      });
      row.total = monthTotal;
      return row;
    });

    const grandTotal3Months = Object.values(catTotalsOverall).reduce((a, b) => a + b, 0);
    const monthlyAverage = grandTotal3Months / 3;

    // Sort categories by highest spend
    const sortedCats = Object.entries(catTotalsOverall)
      .map(([category, amount]) => ({
        category,
        amount,
        share: grandTotal3Months > 0 ? (amount / grandTotal3Months) * 100 : 0,
        color: CATEGORY_COLORS[category] || '#94a3b8',
      }))
      .sort((a, b) => b.amount - a.amount);

    const topCategory = sortedCats[0] || { category: 'None', amount: 0, share: 0 };

    // Delta between Month 2 (Sep) and Month 3 (Oct)
    const sepTotal = Number(chartBars[1]?.total) || 0;
    const octTotal = Number(chartBars[2]?.total) || 0;
    const deltaPct = sepTotal > 0 ? ((octTotal - sepTotal) / sepTotal) * 100 : 0;

    return {
      monthsList: monthLabels,
      monthlyData: chartBars,
      categorySummary: sortedCats,
      totals: {
        grandTotal3Months,
        monthlyAverage,
        topCategory,
        deltaPct,
        octTotal,
        sepTotal,
      },
    };
  }, [data.transactions]);

  // Unique categories
  const activeCategories = categorySummary.map((c) => c.category);

  if (data.transactions.length === 0) {
    return (
      <div className="bento-card p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-600"></span>
              <span className="bento-chip">Quarterly Intelligence</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1.5 flex items-center gap-2">
              <span>Quarterly Category Spending Breakdown</span>
              <Sparkles className="w-4 h-4 text-[#E8FF1F]" />
            </h2>
            <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
              Multi-month trend analysis across Japan &amp; India card ledgers, highlighting category drift, surge velocity, and recurring commitments.
            </p>
          </div>
        </div>

        <div className="py-12 px-4 max-w-md mx-auto text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-zinc-400">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">No transactions recorded yet</h3>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              Your 3-month Recharts category breakdown and velocity trends will populate automatically as soon as you add your first transactions or paste bank SMS alerts.
            </p>
          </div>
          <button
            type="button"
            onClick={() => openModal('smsModal')}
            className="bento-btn-primary h-9 px-4 text-xs font-semibold inline-flex items-center gap-2 cursor-pointer"
          >
            <span>+ Add Transactions / SMS</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bento-card p-6 sm:p-7 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E8FF1F] animate-pulse"></span>
            <span className="bento-chip">Last 3 Months Intelligence</span>
            <span className="text-xs font-semibold text-zinc-400 font-mono-num">
              Aug 2026 · Sep 2026 · Oct 2026
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1.5 flex items-center gap-2">
            <span>Quarterly Category Spending Breakdown</span>
            <Sparkles className="w-4 h-4 text-[#E8FF1F]" />
          </h2>
          <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
            Multi-month trend analysis across Japan &amp; India card ledgers, highlighting category drift, surge velocity, and recurring commitments.
          </p>
        </div>

        {/* View Switchers */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="bento-seg">
            <button
              type="button"
              onClick={() => setChartMode('stacked')}
              className={`px-3 py-1 rounded-[11px] text-xs font-semibold transition-all cursor-pointer ${
                chartMode === 'stacked'
                  ? 'bg-white text-black font-bold shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Stacked Total
            </button>
            <button
              type="button"
              onClick={() => setChartMode('grouped')}
              className={`px-3 py-1 rounded-[11px] text-xs font-semibold transition-all cursor-pointer ${
                chartMode === 'grouped'
                  ? 'bg-white text-black font-bold shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Category Split
            </button>
          </div>
        </div>
      </div>

      {/* 4 Bento KPI Metric Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: 3-Month Total */}
        <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-zinc-400">
              3-Month Total Spend
            </span>
            <span className="bento-chip text-[#E8FF1F]">90 Days</span>
          </div>
          <div className="text-2xl sm:text-3xl font-light text-white font-mono-num mt-3">
            {formatFromJpy(totals.grandTotal3Months, currency)}
          </div>
          <div className="text-[11px] text-zinc-400 mt-1">
            Across {data.transactions.length} verified transactions
          </div>
        </div>

        {/* Metric 2: Monthly Average */}
        <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-zinc-400">
              Monthly Average Burn
            </span>
            <span className="text-[10px] text-zinc-400 font-mono-num">Run rate</span>
          </div>
          <div className="text-2xl sm:text-3xl font-light text-white font-mono-num mt-3">
            {formatFromJpy(totals.monthlyAverage, currency)}
          </div>
          <div className="text-[11px] text-zinc-400 mt-1">
            Normalized monthly burn rate
          </div>
        </div>

        {/* Metric 3: Top Category */}
        <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-zinc-400">
              Top Expense Bucket
            </span>
            <span className="bento-chip bg-[#E8FF1F] text-black font-bold">
              {totals.topCategory.share.toFixed(0)}% Share
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-white truncate mt-3">
            {totals.topCategory.category}
          </div>
          <div className="text-[11px] text-[#A9B2FF] font-mono-num mt-1">
            {formatFromJpy(totals.topCategory.amount, currency)} total spent
          </div>
        </div>

        {/* Metric 4: Month-over-Month Velocity */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#1b1c24] to-[#0a0a0c] border border-white/[0.1] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-zinc-400">
              Sep &rarr; Oct Trend
            </span>
            <span
              className={`text-[10px] font-mono-num font-bold px-2 py-0.5 rounded-full ${
                totals.deltaPct <= 0
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-amber-500/20 text-[#E8FF1F]'
              }`}
            >
              {totals.deltaPct >= 0 ? '+' : ''}
              {totals.deltaPct.toFixed(1)}%
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-light text-white font-mono-num mt-3">
            {formatFromJpy(totals.octTotal, currency)}
          </div>
          <div className="text-[11px] text-zinc-400 mt-1">
            vs {formatFromJpy(totals.sepTotal, currency)} in September
          </div>
        </div>
      </div>

      {/* Main Recharts Visualization */}
      <div className="p-5 rounded-2xl bg-[#070709] border border-white/[0.08] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#A9B2FF]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Month-by-Month Category Stack (Recharts Engine)
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedCategoryFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all cursor-pointer ${
                selectedCategoryFilter === 'ALL'
                  ? 'bg-white text-black font-bold'
                  : 'bg-white/[0.05] text-zinc-400 hover:text-white'
              }`}
            >
              All Categories
            </button>
            {categorySummary.slice(0, 4).map((c) => (
              <button
                key={c.category}
                type="button"
                onClick={() => setSelectedCategoryFilter(c.category)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all cursor-pointer ${
                  selectedCategoryFilter === c.category
                    ? 'bg-white text-black font-bold'
                    : 'bg-white/[0.05] text-zinc-400 hover:text-white'
                }`}
              >
                {c.category}
              </button>
            ))}
          </div>
        </div>

        {/* Recharts Bar Chart */}
        <div className="w-full h-80 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={monthlyData}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis
                dataKey="month"
                stroke="rgba(255,255,255,0.4)"
                tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12, fontFamily: 'Geist Mono' }}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                tickLine={false}
              />
              <YAxis
                stroke="rgba(255,255,255,0.4)"
                tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontFamily: 'Geist Mono' }}
                tickFormatter={(val) => `¥${(val / 1000).toFixed(0)}k`}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(val, name) => [formatFromJpy(Number(val) || 0, currency), String(name)]}
                labelStyle={{ color: '#fff', fontWeight: 600, fontFamily: 'Geist Mono' }}
                contentStyle={{
                  backgroundColor: 'rgba(14, 14, 16, 0.94)',
                  border: '1px solid rgba(255, 255, 255, 0.14)',
                  borderRadius: '16px',
                  boxShadow: '0 12px 30px -10px rgba(0,0,0,0.8)',
                  backdropFilter: 'blur(16px)',
                  fontSize: '12px',
                  color: '#fff',
                }}
              />
              <Legend
                wrapperStyle={{ paddingTop: '14px', fontSize: '11px', fontFamily: 'Geist' }}
                formatter={(value) => <span className="text-zinc-300">{value}</span>}
              />
              {activeCategories.map((cat) => {
                if (selectedCategoryFilter !== 'ALL' && selectedCategoryFilter !== cat) {
                  return null;
                }
                const color = CATEGORY_COLORS[cat] || '#a1a1aa';
                return (
                  <Bar
                    key={cat}
                    dataKey={cat}
                    stackId={chartMode === 'stacked' ? 'a' : undefined}
                    fill={color}
                    radius={chartMode === 'stacked' ? [0, 0, 0, 0] : [6, 6, 0, 0]}
                  />
                );
              })}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category Breakdown Progress Grid */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between text-xs text-zinc-400">
          <span className="font-semibold uppercase tracking-wider text-[11px] text-zinc-300 flex items-center gap-1.5">
            <PieIcon className="w-3.5 h-3.5 text-[#E8FF1F]" />
            <span>Category Contribution Ledger</span>
          </span>
          <span>Ranked by cumulative spend</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {categorySummary.map((item) => (
            <div
              key={item.category}
              className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.15] transition-all flex flex-col justify-between gap-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  ></span>
                  <span className="text-xs font-semibold text-white truncate">
                    {item.category}
                  </span>
                </div>
                <span className="bento-chip text-[10px]">
                  {item.share.toFixed(1)}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-white/[0.06] h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min(100, item.share)}%`,
                    backgroundColor: item.color,
                  }}
                ></div>
              </div>

              <div className="flex items-center justify-between pt-1 text-[11px] text-zinc-400">
                <span>3-Mo Total</span>
                <span className="font-mono-num font-bold text-white">
                  {formatFromJpy(item.amount, currency)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
