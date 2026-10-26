import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { formatFromJpy } from '../../utils/currency';
import { getCategoryBadgeStyle } from '../../utils/smsParser';
import { Trash2, Download, RotateCcw, TrendingUp, Calendar, Plus } from 'lucide-react';

export const NextMonthView: React.FC = () => {
  const {
    data,
    currency,
    addNextMonthItem,
    toggleNextMonthItem,
    deleteNextMonthItem,
    importFixedToNextMonth,
    resetNextMonthPlan,
    setNextMonthTarget,
  } = useFinance();

  const [inputName, setInputName] = useState('');
  const [inputType, setInputType] = useState('Lodging & Dorm Rent');
  const [inputAmount, setInputAmount] = useState('');
  const [inputWhen, setInputWhen] = useState('');
  const [inputHowPaid, setInputHowPaid] = useState('ICICI Forex Card XX0817');

  const config = data.nextMonthConfig || {
    targetMonth: 'November 2026 (30 Days)',
    dailyAvgJpy: 500,
    daysInMonth: 30,
  };

  const dailyBaselineJpy = config.dailyAvgJpy * config.daysInMonth;
  const includedItems = data.nextMonthPlan.filter((i) => i.included);
  const plannedCostsJpy = includedItems.reduce((sum, item) => sum + (Number(item.amountJpy) || 0), 0);
  const grandTotalJpy = dailyBaselineJpy + plannedCostsJpy;
  const grandTotalInr = Math.round(grandTotalJpy / 1.8);

  const axisPlannedJpy = includedItems
    .filter((i) => /axis/i.test(i.howPaid || ''))
    .reduce((sum, i) => sum + (Number(i.amountJpy) || 0), 0);
  const japanSideNeededJpy = grandTotalJpy - axisPlannedJpy;
  const iciciAvail = data.icici.balanceJpy ?? 0;
  const topUpNeededJpy = Math.max(0, japanSideNeededJpy - iciciAvail);

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    const days = val.includes('31') ? 31 : 30;
    setNextMonthTarget(val, days);
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputName.trim() || !inputAmount) return;
    addNextMonthItem({
      name: inputName.trim(),
      type: inputType,
      amountJpy: Number(inputAmount),
      whenOccurs: inputWhen.trim() || 'Mid-Month',
      howPaid: inputHowPaid,
      included: true,
    });
    setInputName('');
    setInputAmount('');
    setInputWhen('');
  };

  return (
    <div className="space-y-6 pb-14">
      {/* Page Header */}
      <div className="bento-card p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-white/[0.06] border border-white/[0.12] flex items-center justify-center text-[#E8FF1F]">
              <TrendingUp className="w-4 h-4" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-sans">
              Next Month Financial Forecast
            </h1>
            <span className="bento-chip bento-chip-neon font-mono">
              ¥500/day Baseline
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Budget modeling for {config.targetMonth}: routine allowance plus planned recurring commitments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={config.targetMonth}
            onChange={handleMonthChange}
            className="rounded-xl bg-black border border-white/10 px-3 py-2 text-xs font-bold text-white font-mono cursor-pointer focus:outline-none"
          >
            <option value="November 2026 (30 Days)">November 2026 (30d)</option>
            <option value="December 2026 (31 Days)">December 2026 (31d)</option>
            <option value="January 2027 (31 Days)">January 2027 (31d)</option>
          </select>
        </div>
      </div>

      {/* 4 Bento Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bento-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider font-mono font-bold text-zinc-400">
              Daily Baseline Total
            </span>
            <span className="bento-chip bento-chip-neon font-mono text-[10px]">
              ¥500/day
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono-num mt-3">
            {formatFromJpy(dailyBaselineJpy, currency)}
          </div>
          <div className="text-[11px] text-zinc-400 mt-1.5 font-mono">
            ¥500 × {config.daysInMonth} days variable spend
          </div>
        </div>

        <div className="bento-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider font-mono font-bold text-zinc-400">
              Planned Costs Added
            </span>
            <span className="bento-chip bento-chip-amber font-mono text-[10px]">
              Set Aside
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-300 font-mono-num mt-3">
            {formatFromJpy(plannedCostsJpy, currency)}
          </div>
          <div className="text-[11px] text-zinc-400 mt-1.5 font-mono">
            {includedItems.length} planned items active
          </div>
        </div>

        <div className="bento-card p-5 flex flex-col justify-between border-emerald-500/30">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider font-mono font-bold text-emerald-400">
              Total Budget Needed
            </span>
            <span className="bento-chip bento-chip-emerald font-mono text-[10px]">
              Combined
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono-num mt-3">
            {formatFromJpy(grandTotalJpy, currency)}
          </div>
          <div className="text-[11px] text-zinc-400 font-mono-num mt-1.5">
            ≈ ₹{grandTotalInr.toLocaleString('en-IN')} total needed
          </div>
        </div>

        <div className="bento-card p-5 flex flex-col justify-between border-rose-500/30">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider font-mono font-bold text-rose-400">
              ICICI Reload Needed
            </span>
            <span className="bento-chip font-mono text-[10px]">
              XX0817
            </span>
          </div>
          <div
            className={`text-2xl sm:text-3xl font-extrabold font-mono-num mt-3 ${
              topUpNeededJpy > 0 ? 'text-rose-400' : 'text-emerald-400'
            }`}
          >
            {topUpNeededJpy > 0 ? formatFromJpy(topUpNeededJpy, currency) : '¥0 (Covered!)'}
          </div>
          <div className="text-[11px] text-zinc-400 mt-1.5 font-mono">
            After {formatFromJpy(iciciAvail, currency)} ICICI Avl
          </div>
        </div>
      </div>

      {/* Planned Expenses Bento Section */}
      <div className="bento-card p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <h3 className="text-sm font-bold text-white tracking-tight uppercase">
              Planned Next Month Commitments ({data.nextMonthPlan.length})
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={importFixedToNextMonth}
              className="bento-btn-secondary h-8 px-3 text-xs"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Pull Fixed Items</span>
            </button>
            <button
              type="button"
              onClick={resetNextMonthPlan}
              className="bento-btn-secondary h-8 px-3 text-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Plan</span>
            </button>
          </div>
        </div>

        {/* Compact Entry Strip */}
        <form onSubmit={handleAddExpense} className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.08]">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5">
            <input
              type="text"
              placeholder="Name (e.g. Groceries / Rent)"
              value={inputName}
              onChange={(e) => setInputName(e.target.value)}
              className="rounded-xl bg-black border border-white/10 px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30"
              required
            />

            <select
              value={inputType}
              onChange={(e) => setInputType(e.target.value)}
              className="rounded-xl bg-black border border-white/10 px-2.5 py-2 text-xs text-white cursor-pointer focus:outline-none"
            >
              <option value="Lodging & Dorm Rent">Lodging &amp; Dorm Rent</option>
              <option value="Groceries & Supermarket">Groceries &amp; Supermarket</option>
              <option value="Shopping & Clothes">Shopping &amp; Clothes</option>
              <option value="Utilities & Wifi/SIM">Utilities &amp; Wifi/SIM</option>
              <option value="Travel & Suica Pass">Travel &amp; Suica Pass</option>
              <option value="Convenience Store">Convenience Store</option>
              <option value="Food & Dining Out">Food &amp; Dining Out</option>
              <option value="Cash Withdrawal">Cash Withdrawal</option>
              <option value="University & Books">University &amp; Books</option>
              <option value="Regular Transaction">Regular Transaction</option>
            </select>

            <input
              type="number"
              placeholder="Amount (JPY ¥)"
              value={inputAmount}
              onChange={(e) => setInputAmount(e.target.value)}
              className="rounded-xl bg-black border border-white/10 px-3 py-2 text-xs text-white font-mono focus:outline-none"
              required
            />

            <input
              type="text"
              placeholder="When (e.g. 5th Nov)"
              value={inputWhen}
              onChange={(e) => setInputWhen(e.target.value)}
              className="rounded-xl bg-black border border-white/10 px-3 py-2 text-xs text-white focus:outline-none"
            />

            <select
              value={inputHowPaid}
              onChange={(e) => setInputHowPaid(e.target.value)}
              className="rounded-xl bg-black border border-white/10 px-2.5 py-2 text-xs text-white cursor-pointer focus:outline-none"
            >
              <option value="ICICI Forex Card XX0817">ICICI Forex XX0817</option>
              <option value="Axis Bank Card XX7117">Axis Bank XX7117</option>
              <option value="Cash (JPY Notes/Coins)">Cash (JPY)</option>
              <option value="Mobile Suica / IC Card">Mobile Suica</option>
            </select>

            <button
              type="submit"
              className="bento-btn-primary h-auto py-2 text-xs"
            >
              + Add Item
            </button>
          </div>
        </form>

        {/* Planned Expenses Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/[0.08] text-[10px] font-bold uppercase tracking-wider text-zinc-400 font-mono">
                <th className="py-3 pr-4">Name of Expense</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">When</th>
                <th className="py-3 px-4">How Paid</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 pl-4 text-right">Set Aside / Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05] text-xs">
              {data.nextMonthPlan.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-zinc-500 text-xs font-mono">
                    No planned expenses added for next month yet. Use the form above to add upcoming expenses or click &ldquo;Import Fixed&rdquo; to pull recurring costs.
                  </td>
                </tr>
              ) : (
                data.nextMonthPlan.map((item) => (
                  <tr
                    key={item.id}
                    className={`hover:bg-white/[0.02] transition-colors ${item.included ? '' : 'opacity-40'}`}
                  >
                  <td className="py-3.5 pr-4">
                    <div className="font-bold text-white text-xs">{item.name}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold ${getCategoryBadgeStyle(item.type)}`}>
                      {item.type}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-zinc-300 font-mono text-[11px]">
                    {item.whenOccurs}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[11px] text-zinc-400">
                    {item.howPaid}
                  </td>
                  <td className="py-3.5 px-4 text-right font-extrabold text-white font-mono-num text-xs">
                    {formatFromJpy(item.amountJpy, currency)}
                  </td>
                  <td className="py-3.5 pl-4 text-right">
                    <div className="inline-flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => toggleNextMonthItem(item.id)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                          item.included
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                        }`}
                      >
                        {item.included ? '✓ Set Aside' : 'Skipped'}
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteNextMonthItem(item.id)}
                        className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/15 transition-colors cursor-pointer"
                        title="Remove Planned Item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default NextMonthView;
