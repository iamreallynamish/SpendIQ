import React, { useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { formatFromJpy } from '../../utils/currency';
import { getTxMonthKey } from '../../utils/smsParser';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { ArrowRight, PieChart as PieIcon, Sliders, Zap, Filter, X } from 'lucide-react';

const COLORS = [
  '#E8FF1F', // Neon Lime
  '#34d399', // Emerald
  '#f59e0b', // Amber
  '#a9b2ff', // Lavender
  '#ffb37a', // Orange-peach
  '#38bdf8', // Sky
  '#f43f5e', // Rose
  '#a78bfa', // Purple
  '#ffffff', // White
  '#e2b887', // Champagne
];

export const ExpensesView: React.FC = () => {
  const {
    data,
    currency,
    selectedMonth,
    setSelectedMonth,
    targetAllowance,
    setTargetAllowance,
    openModal,
    selectedCategory,
    setSelectedCategory,
    openCategoryInspector,
  } = useFinance();

  const monthTxs = useMemo(() => {
    if (selectedMonth === 'ALL') return data.transactions;
    return data.transactions.filter((tx) => getTxMonthKey(tx) === selectedMonth);
  }, [data.transactions, selectedMonth]);

  // Aggregate by category
  const { chartData, totalSpendJpy } = useMemo(() => {
    const map: Record<string, number> = {};
    monthTxs.forEach((tx) => {
      map[tx.category] = (map[tx.category] || 0) + (Number(tx.amountJpy) || 0);
    });
    const items = Object.entries(map)
      .map(([name, value]) => ({
        name,
        value,
      }))
      .sort((a, b) => b.value - a.value);

    const total = items.reduce((sum, item) => sum + item.value, 0);
    return { chartData: items, totalSpendJpy: total };
  }, [monthTxs]);

  // ICICI monthly spend
  const iciciMonthSpend = useMemo(() => {
    return monthTxs
      .filter((t) => t.cardCode === 'ICICI')
      .reduce((sum, t) => sum + (Number(t.amountJpy) || 0), 0);
  }, [monthTxs]);

  const netSavedJpy = targetAllowance - iciciMonthSpend;
  const iciciAvail = data.icici.balanceJpy ?? 0;

  // Safe daily burn rate: dynamic based on available balance and days
  const safeDailyBurn = useMemo(() => {
    if (iciciAvail <= 0) return 0;
    try {
      const today = new Date();
      const target = new Date(data.icici.nextDate);
      const diffMs = target.getTime() - today.getTime();
      const diffDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      return Math.round(iciciAvail / diffDays);
    } catch {
      return Math.round(iciciAvail / 30);
    }
  }, [iciciAvail, data.icici.nextDate]);

  return (
    <div className="space-y-6 pb-14">
      {/* Page Header */}
      <div className="bento-card p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-white/[0.06] border border-white/[0.12] flex items-center justify-center text-[#E8FF1F]">
              <PieIcon className="w-4 h-4" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-sans">
              Expenses &amp; Category Allocations
            </h1>
            <span className="bento-chip bento-chip-neon font-mono">
              {selectedMonth === 'ALL' ? 'All Months' : selectedMonth.replace('-', ' ')}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Categorical spending distribution, burn rate velocity, and monthly pocket allowance targets.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => openModal('smsModal')}
            className="bento-btn-primary h-8 px-3 text-xs"
          >
            <span>+ Add SMS Swipes</span>
          </button>
        </div>
      </div>

      {/* Category Filter Active Banner */}
      {selectedCategory && (
        <div className="p-3.5 rounded-2xl bg-[#E8FF1F]/10 border border-[#E8FF1F]/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-xl bg-[#E8FF1F] flex items-center justify-center text-black font-extrabold text-xs">
              <Filter className="w-3.5 h-3.5" />
            </span>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <span>Expenses Filtered by Category:</span>
                <span className="bento-chip bento-chip-neon font-mono text-xs">{selectedCategory}</span>
              </div>
              <div className="text-[11px] text-zinc-300 font-mono mt-0.5">
                Click category badge to inspect highest transactions or clear filter.
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

      {/* Cross-Month Notice when current month has 0 transactions */}
      {chartData.length === 0 && data.transactions.length > 0 && selectedMonth !== 'ALL' && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between">
          <div className="text-xs text-amber-200">
            Current view <strong className="font-mono text-white">{selectedMonth}</strong> has 0 expenses recorded, but you have{' '}
            <strong className="text-white">{data.transactions.length}</strong> total transactions in your ledger.
          </div>
          <button
            type="button"
            onClick={() => setSelectedMonth('ALL')}
            className="bento-btn-primary h-7 px-3 text-xs"
          >
            <span>View All Months</span>
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Category Spend Breakdown (Left 5 cols) */}
        <div className="lg:col-span-5 bento-card p-5 sm:p-6 flex flex-col items-center justify-between">
          <div className="w-full flex items-center justify-between pb-3.5 border-b border-white/[0.08]">
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">Category Breakdown</h2>
              <p className="text-[11px] text-zinc-400">
                Click any slice or category to inspect highest transactions
              </p>
            </div>
            <span className="bento-chip font-mono">
              {chartData.length} active
            </span>
          </div>

          {/* Recharts Pie Chart or Clean Empty State */}
          <div className="w-full h-64 my-4 flex items-center justify-center relative">
            {chartData.length === 0 ? (
              <div className="text-center space-y-2 py-8">
                <div className="w-10 h-10 mx-auto rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-zinc-500">
                  <PieIcon className="w-5 h-5" />
                </div>
                <div className="text-xs font-bold text-white">No expenses recorded</div>
                <p className="text-[11px] text-zinc-400 max-w-[220px] mx-auto font-mono">
                  Upload card swipes or SMS alerts to visualize category distribution.
                </p>
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={68}
                      outerRadius={98}
                      paddingAngle={3}
                      dataKey="value"
                      onClick={(entry: any) => {
                        if (entry && entry.name) {
                          openCategoryInspector(entry.name);
                        }
                      }}
                      className="cursor-pointer"
                    >
                      {chartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val) => [formatFromJpy(Number(val) || 0, currency), 'Spent']}
                      contentStyle={{
                        backgroundColor: '#000000',
                        border: '1px solid rgba(255,255,255,0.18)',
                        borderRadius: '16px',
                        fontSize: '12px',
                        color: '#fff',
                        fontFamily: 'Geist Mono',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center Total Overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[9px] uppercase tracking-wider text-zinc-400 font-mono">Total Spend</span>
                  <span className="text-sm sm:text-base font-extrabold text-white font-mono-num mt-0.5">
                    {formatFromJpy(totalSpendJpy, currency)}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Custom Category Legend with Click-to-Inspect Highest Transactions */}
          <div className="w-full space-y-2 max-h-56 overflow-y-auto pr-1">
            {chartData.length === 0 ? (
              <div className="py-4 text-center text-xs text-zinc-500 font-mono">
                No active categories yet
              </div>
            ) : (
              chartData.map((item, idx) => {
                const color = COLORS[idx % COLORS.length];
                const pct = totalSpendJpy > 0 ? Math.round((item.value / totalSpendJpy) * 100) : 0;
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => openCategoryInspector(item.name)}
                    className="w-full flex items-center justify-between text-xs py-2 px-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.06] hover:border-[#E8FF1F]/30 transition-all text-left cursor-pointer group"
                    title={`Click to inspect highest transactions in ${item.name}`}
                  >
                    <span className="flex items-center gap-2 text-zinc-200 font-medium min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }}></span>
                      <span className="truncate max-w-[130px] group-hover:text-white transition-colors">{item.name}</span>
                    </span>
                    <span className="font-mono-num font-bold text-white shrink-0 ml-2 flex items-center gap-1.5">
                      {formatFromJpy(item.value, currency)}{' '}
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/[0.06] text-zinc-300 font-mono">
                        {pct}%
                      </span>
                      <span className="text-[11px] text-[#E8FF1F] opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                        &rsaquo;
                      </span>
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Monthly Expense & Allowance Calculator (Right 7 cols) */}
        <div className="lg:col-span-7 bento-card p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.08]">
              <div>
                <h2 className="text-sm font-bold text-white tracking-tight">
                  Budget &amp; Burn Rate Simulator
                </h2>
                <p className="text-[11px] text-zinc-400">
                  Calculates monthly spend for the selected month vs target pocket allowance
                </p>
              </div>
              <span className="bento-chip bento-chip-amber font-mono">
                ICICI XX0817
              </span>
            </div>

            {/* Metric KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 my-4">
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                <div className="text-[10px] uppercase text-zinc-400 font-mono font-semibold">ICICI Available</div>
                <div className="text-xl font-extrabold text-white font-mono-num mt-1">
                  {formatFromJpy(iciciAvail, currency)}
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                <div className="text-[10px] uppercase text-zinc-400 font-mono font-semibold">Selected Month Spend</div>
                <div className="text-xl font-extrabold text-rose-400 font-mono-num mt-1">
                  {formatFromJpy(iciciMonthSpend, currency)}
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                <div className="text-[10px] uppercase text-zinc-400 font-mono font-semibold">Net Saved vs Cap</div>
                <div
                  className={`text-xl font-extrabold font-mono-num mt-1 ${
                    netSavedJpy >= 0 ? 'text-[#E8FF1F]' : 'text-rose-400'
                  }`}
                >
                  {(netSavedJpy >= 0 ? '+' : '-') + formatFromJpy(Math.abs(netSavedJpy), currency)}
                </div>
              </div>
            </div>

            {/* Allowance Slider & Daily Burn */}
            <div className="space-y-4 mt-5">
              <label className="block p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-zinc-300 font-semibold">Target Monthly Pocket Allowance</span>
                  <span className="font-mono-num font-bold text-[#E8FF1F] text-sm">
                    {formatFromJpy(targetAllowance, currency)}
                  </span>
                </div>
                <input
                  type="range"
                  min="20000"
                  max="200000"
                  step="5000"
                  value={targetAllowance}
                  onChange={(e) => setTargetAllowance(Number(e.target.value))}
                  className="w-full accent-[#E8FF1F] cursor-pointer"
                />
              </label>

              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">Daily Safe Conbini &amp; Dining Burn Rate</div>
                  <div className="text-[11px] text-zinc-400">
                    {iciciAvail > 0
                      ? `Calculated pace until next reload date: ${data.icici.nextDate}`
                      : 'Set available balance in Card Balances to activate run-rate'}
                  </div>
                </div>
                <div className="text-xl font-extrabold text-emerald-400 font-mono-num">
                  {formatFromJpy(safeDailyBurn, currency)} / day
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-white/[0.08] flex items-center justify-between text-xs text-zinc-400 font-mono">
            <span>Dynamic currency synced to {currency}</span>
            <button
              type="button"
              onClick={() => openModal('smsModal')}
              className="inline-flex items-center gap-1 text-[#E8FF1F] hover:underline font-semibold cursor-pointer"
            >
              <span>Add Transactions</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpensesView;
