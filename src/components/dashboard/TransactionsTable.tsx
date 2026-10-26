import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import { formatFromJpy } from '../../utils/currency';
import { getCategoryBadgeStyle, getTxMonthKey } from '../../utils/smsParser';
import { ReceiptText, Sparkles, Edit2, Trash2, ArrowUpDown, Filter, X } from 'lucide-react';
import { Transaction } from '../../types/finance';

export const TransactionsTable: React.FC = () => {
  const {
    data,
    currency,
    selectedMonth,
    cardFilter,
    setCardFilter,
    role,
    deleteTransaction,
    openModal,
    setEditingTxId,
    smartRecategorizeAll,
    selectedCategory,
    setSelectedCategory,
    openCategoryInspector,
  } = useFinance();

  // Dynamic categories present in transactions
  const availableCategories = React.useMemo(() => {
    const set = new Set<string>();
    data.transactions.forEach((tx) => {
      if (tx.category) set.add(tx.category);
    });
    return Array.from(set).sort();
  }, [data.transactions]);

  // Filter transactions by selectedMonth, cardFilter, and selectedCategory
  const filteredTxs = data.transactions.filter((tx) => {
    if (selectedMonth !== 'ALL' && getTxMonthKey(tx) !== selectedMonth) {
      return false;
    }
    if (cardFilter !== 'ALL' && tx.cardCode !== cardFilter) {
      return false;
    }
    if (selectedCategory && tx.category !== selectedCategory) {
      return false;
    }
    return true;
  });

  const latestIciciTx = data.transactions
    .filter((t) => t.cardCode === 'ICICI' && t.smsBalance !== null && t.smsBalance !== undefined)
    .reduce<Transaction | null>(
      (best, cur) => (!best || (cur.timestampMs || 0) >= (best.timestampMs || 0) ? cur : best),
      null
    );

  const latestAxisTx = data.transactions
    .filter((t) => t.cardCode === 'AXIS' && t.smsBalance !== null && t.smsBalance !== undefined)
    .reduce<Transaction | null>(
      (best, cur) => (!best || (cur.timestampMs || 0) >= (best.timestampMs || 0) ? cur : best),
      null
    );

  const handleEdit = (id: string) => {
    setEditingTxId(id);
    openModal('editTxModal');
  };

  return (
    <div className="bento-card p-5 sm:p-6">
      {/* Table Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.08]">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="w-8 h-8 rounded-xl bg-white/[0.06] border border-white/[0.12] flex items-center justify-center text-emerald-400">
            <ReceiptText className="w-4 h-4" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-tight uppercase">
                Uploaded Transactions
              </h3>
              <span className="bento-chip font-mono">
                {filteredTxs.length} records
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Verified SMS ledger items with automated category tagging and currency conversion.
            </p>
          </div>
        </div>

        {/* Filters Group: Card Filter & Category Dropdown */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Category Dropdown */}
          {availableCategories.length > 0 && (
            <div className="flex items-center gap-1.5">
              <select
                value={selectedCategory || 'ALL'}
                onChange={(e) => setSelectedCategory(e.target.value === 'ALL' ? null : e.target.value)}
                className="bg-black text-[11px] font-mono font-semibold text-zinc-300 border border-white/10 rounded-xl px-2.5 py-1.5 focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Categories</option>
                {availableCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              {selectedCategory && (
                <button
                  type="button"
                  onClick={() => setSelectedCategory(null)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  title="Clear category filter"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Card Filter Segmented Control */}
          <div className="bento-seg">
            {(['ALL', 'ICICI', 'AXIS'] as const).map((code) => {
              const label = code === 'ALL' ? 'All Cards' : code === 'ICICI' ? 'ICICI' : 'Axis';
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => setCardFilter(code)}
                  className={`bento-seg-btn ${
                    cardFilter === code ? 'bento-seg-btn-active' : ''
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Transactions Table Body */}
      <div className="overflow-x-auto mt-3">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/[0.08] text-[10px] font-bold uppercase tracking-wider text-zinc-400 font-mono">
              <th className="py-3 pr-4">Merchant / Source</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Card Used</th>
              <th className="py-3 px-4">Spender</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4 text-right">Amount</th>
              <th className="py-3 pl-4 text-right">
                {role === 'DAD' ? 'Dad Actions' : 'Actions'}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05] text-xs">
            {filteredTxs.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-zinc-500 text-xs">
                  No transactions recorded for this filter. Use &ldquo;Parse SMS Batch&rdquo; to add SMS receipts.
                </td>
              </tr>
            ) : (
              filteredTxs.map((tx) => {
                const isLatestAnchor =
                  (latestIciciTx && latestIciciTx.id === tx.id) ||
                  (latestAxisTx && latestAxisTx.id === tx.id);

                return (
                  <tr
                    key={tx.id}
                    className="hover:bg-white/[0.03] transition-colors group"
                  >
                    {/* Merchant & Subtext */}
                    <td className="py-3.5 pr-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white shrink-0 ${tx.iconBg || 'bg-zinc-800'}`}
                        >
                          {tx.letter || tx.merchant.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-white truncate max-w-[200px]">
                            {tx.merchant}
                          </div>
                          <div className="text-[10px] text-zinc-400 truncate max-w-[200px]">
                            {tx.subtext || 'Card Transaction'}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Category Chip - Clickable to open category inspector */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => openCategoryInspector(tx.category)}
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold cursor-pointer hover:opacity-85 hover:scale-105 transition-all ${getCategoryBadgeStyle(tx.category)}`}
                        title={`Click to inspect highest transactions in ${tx.category}`}
                      >
                        {tx.category}
                      </button>
                    </td>

                    {/* Card Used */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-mono text-[11px] text-zinc-300">
                        {tx.cardUsed}
                      </span>
                    </td>

                    {/* Spender */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          tx.spender === 'Son'
                            ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                        }`}
                      >
                        {tx.spender}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-zinc-400 font-mono text-[11px]">
                      {tx.date}
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="font-bold text-white font-mono-num text-[13px]">
                        {formatFromJpy(tx.amountJpy, currency)}
                      </div>
                      <div className="text-[10px] text-zinc-500 font-mono-num">
                        {tx.cardCode === 'ICICI' ? `¥${tx.amountJpy.toLocaleString()}` : `₹${tx.amountInr.toLocaleString()}`}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 pl-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => handleEdit(tx.id)}
                          title="Edit transaction amount, date, or category"
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {role === 'DAD' && (
                          <button
                            type="button"
                            onClick={() => deleteTransaction(tx.id)}
                            title="Delete transaction (Dad Admin)"
                            className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/15 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
