import React, { useMemo, useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { formatFromJpy } from '../../utils/currency';
import { getCategoryBadgeStyle, getTxMonthKey } from '../../utils/smsParser';
import { X, Trophy, Layers, Filter, Edit2, ArrowUpDown, CreditCard, User, Sparkles } from 'lucide-react';

export const CategoryDetailModal: React.FC = () => {
  const {
    activeModal,
    closeModal,
    inspectingCategory,
    setInspectingCategory,
    selectedCategory,
    setSelectedCategory,
    data,
    currency,
    selectedMonth,
    setEditingTxId,
    openModal,
  } = useFinance();

  const [timeScope, setTimeScope] = useState<'month' | 'all'>('month');

  if (activeModal !== 'categoryDetailModal' || !inspectingCategory) {
    return null;
  }

  // Filter transactions for this category
  const categoryTransactions = useMemo(() => {
    let list = data.transactions.filter((t) => t.category === inspectingCategory);
    if (timeScope === 'month' && selectedMonth !== 'ALL') {
      list = list.filter((t) => getTxMonthKey(t) === selectedMonth);
    }
    // Sort by highest amount first!
    return list.sort((a, b) => (Number(b.amountJpy) || 0) - (Number(a.amountJpy) || 0));
  }, [data.transactions, inspectingCategory, timeScope, selectedMonth]);

  // Aggregate category stats
  const totalCategorySpendJpy = useMemo(() => {
    return categoryTransactions.reduce((sum, t) => sum + (Number(t.amountJpy) || 0), 0);
  }, [categoryTransactions]);

  const totalAllTxsJpy = useMemo(() => {
    let list = data.transactions;
    if (timeScope === 'month' && selectedMonth !== 'ALL') {
      list = list.filter((t) => getTxMonthKey(t) === selectedMonth);
    }
    return list.reduce((sum, t) => sum + (Number(t.amountJpy) || 0), 0);
  }, [data.transactions, timeScope, selectedMonth]);

  const categoryShare = totalAllTxsJpy > 0 ? Math.round((totalCategorySpendJpy / totalAllTxsJpy) * 100) : 0;
  const avgSpendJpy = categoryTransactions.length > 0 ? Math.round(totalCategorySpendJpy / categoryTransactions.length) : 0;
  const highestSpendTx = categoryTransactions[0] || null;

  const iciciCount = categoryTransactions.filter((t) => t.cardCode === 'ICICI').length;
  const axisCount = categoryTransactions.filter((t) => t.cardCode === 'AXIS').length;

  const handleEdit = (id: string) => {
    setEditingTxId(id);
    openModal('editTxModal');
  };

  const handleToggleGlobalFilter = () => {
    if (selectedCategory === inspectingCategory) {
      setSelectedCategory(null);
    } else {
      setSelectedCategory(inspectingCategory);
    }
    closeModal();
  };

  const handleClose = () => {
    setInspectingCategory(null);
    closeModal();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bento-card max-w-2xl w-full p-6 space-y-5 my-auto max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-[#E8FF1F]/15 border border-[#E8FF1F]/30 flex items-center justify-center text-[#E8FF1F]">
              <Layers className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  {inspectingCategory}
                </h3>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${getCategoryBadgeStyle(inspectingCategory)}`}>
                  Category Drilldown
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Highest transactions, spend distribution, and merchant frequency in this bucket.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="bento-seg">
              <button
                type="button"
                onClick={() => setTimeScope('month')}
                className={`bento-seg-btn text-[11px] py-1 px-2.5 ${timeScope === 'month' ? 'bento-seg-btn-active' : ''}`}
              >
                {selectedMonth === 'ALL' ? 'All Months' : selectedMonth.split('-')[0]}
              </button>
              <button
                type="button"
                onClick={() => setTimeScope('all')}
                className={`bento-seg-btn text-[11px] py-1 px-2.5 ${timeScope === 'all' ? 'bento-seg-btn-active' : ''}`}
              >
                All-Time
              </button>
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 4 Stat KPI Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
            <div className="text-[10px] uppercase font-mono text-zinc-400 font-bold">Category Outflow</div>
            <div className="text-lg sm:text-xl font-extrabold text-[#E8FF1F] font-mono-num mt-1">
              {formatFromJpy(totalCategorySpendJpy, currency)}
            </div>
            <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
              {categoryShare}% of total spend
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
            <div className="text-[10px] uppercase font-mono text-zinc-400 font-bold flex items-center gap-1">
              <Trophy className="w-3 h-3 text-amber-400" />
              <span>Highest Single Spend</span>
            </div>
            <div className="text-lg sm:text-xl font-extrabold text-white font-mono-num mt-1 truncate">
              {highestSpendTx ? formatFromJpy(highestSpendTx.amountJpy, currency) : '¥0'}
            </div>
            <div className="text-[10px] text-zinc-400 truncate mt-0.5 font-mono">
              {highestSpendTx ? highestSpendTx.merchant : 'None'}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
            <div className="text-[10px] uppercase font-mono text-zinc-400 font-bold">Average Transaction</div>
            <div className="text-lg sm:text-xl font-extrabold text-white font-mono-num mt-1">
              {formatFromJpy(avgSpendJpy, currency)}
            </div>
            <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
              Across {categoryTransactions.length} swipe{categoryTransactions.length === 1 ? '' : 's'}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
            <div className="text-[10px] uppercase font-mono text-zinc-400 font-bold">Card Breakdown</div>
            <div className="text-sm font-bold text-white font-mono mt-1.5 flex items-center gap-2">
              <span className="text-emerald-400">{iciciCount} ICICI</span>
              <span className="text-zinc-500">•</span>
              <span className="text-amber-400">{axisCount} Axis</span>
            </div>
            <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
              Active ledger split
            </div>
          </div>
        </div>

        {/* Highest Transactions List Header */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-[#E8FF1F]" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-white font-mono">
              Highest Transactions in {inspectingCategory} ({categoryTransactions.length})
            </h4>
          </div>
          <span className="text-[10px] text-zinc-400 font-mono">
            Sorted by highest amount
          </span>
        </div>

        {/* Scrollable Ranked Transactions List */}
        <div className="overflow-y-auto space-y-2.5 flex-1 pr-1 max-h-72">
          {categoryTransactions.length === 0 ? (
            <div className="py-12 text-center space-y-2 border border-dashed border-white/10 rounded-2xl">
              <div className="text-xs font-bold text-white">No transactions in this category</div>
              <p className="text-[11px] text-zinc-400 max-w-xs mx-auto">
                No recorded swipes match &ldquo;{inspectingCategory}&rdquo; for this timeframe.
              </p>
            </div>
          ) : (
            categoryTransactions.map((tx, idx) => (
              <div
                key={tx.id}
                className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] transition-all flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Rank Badge */}
                  <span
                    className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-extrabold font-mono shrink-0 ${
                      idx === 0
                        ? 'bg-[#E8FF1F] text-black shadow-[0_0_12px_rgba(232,255,31,0.4)]'
                        : idx === 1
                        ? 'bg-amber-400 text-black'
                        : idx === 2
                        ? 'bg-zinc-200 text-black'
                        : 'bg-white/10 text-zinc-300'
                    }`}
                  >
                    #{idx + 1}
                  </span>

                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate flex items-center gap-2">
                      <span className="truncate">{tx.merchant}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/10 text-zinc-400 shrink-0">
                        {tx.date}
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-400 font-mono mt-0.5 truncate flex items-center gap-2">
                      <span>{tx.cardUsed}</span>
                      <span>•</span>
                      <span className={tx.spender === 'Son' ? 'text-emerald-300' : 'text-amber-300'}>
                        {tx.spender}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div className="text-sm font-extrabold text-white font-mono-num">
                      {formatFromJpy(tx.amountJpy, currency)}
                    </div>
                    <div className="text-[10px] text-zinc-500 font-mono-num">
                      {tx.cardCode === 'ICICI' ? `¥${tx.amountJpy.toLocaleString()}` : `₹${tx.amountInr.toLocaleString()}`}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleEdit(tx.id)}
                    title="Edit transaction"
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer with Global Category Filter Toggle */}
        <div className="pt-3 border-t border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-zinc-400 font-mono">
            {selectedCategory === inspectingCategory ? (
              <span className="text-[#E8FF1F] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Dashboard currently filtered to {inspectingCategory}</span>
              </span>
            ) : (
              <span>Filter entire dashboard by this category to focus your outflow.</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleGlobalFilter}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedCategory === inspectingCategory
                  ? 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30'
                  : 'bento-btn-primary h-auto py-1.5'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>
                {selectedCategory === inspectingCategory
                  ? 'Clear Category Filter'
                  : `Filter Dashboard by ${inspectingCategory}`}
              </span>
            </button>

            <button
              type="button"
              onClick={handleClose}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-zinc-800 text-zinc-200 hover:bg-zinc-700 transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryDetailModal;
