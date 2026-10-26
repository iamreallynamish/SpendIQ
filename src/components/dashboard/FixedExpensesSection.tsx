import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import { formatFromJpy } from '../../utils/currency';
import { CalendarClock, Plus, CheckCircle2, PauseCircle } from 'lucide-react';

export const FixedExpensesSection: React.FC = () => {
  const { data, currency, toggleFixedExpense, openModal } = useFinance();

  const totalFixed = data.fixedExpenses
    .filter((f) => f.active)
    .reduce((sum, f) => sum + f.amountJpy, 0);

  return (
    <div className="bento-card p-5 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.08]">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-xl bg-white/[0.06] border border-white/[0.12] flex items-center justify-center text-amber-400">
            <CalendarClock className="w-4 h-4" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-tight uppercase">
                Fixed Monthly Expenses &amp; Commitments
              </h3>
              <span className="bento-chip bento-chip-amber font-mono">
                {data.fixedExpenses.filter((f) => f.active).length} Active
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Recurring Japan living costs (Tokyo Dorm, Suica commuter pass, insurance, subscriptions).
            </p>
          </div>
        </div>

        {/* Total & Action */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider text-zinc-400 font-medium">Monthly Outflow</div>
            <div className="text-base sm:text-lg font-extrabold text-amber-400 font-mono-num leading-tight">
              {formatFromJpy(totalFixed, currency)}
            </div>
          </div>
          <button
            type="button"
            onClick={() => openModal('addFixedModal')}
            className="bento-btn-secondary h-8 px-3 text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Item</span>
          </button>
        </div>
      </div>

      {/* Grid of Fixed Expense Cards */}
      {data.fixedExpenses.length === 0 ? (
        <div className="py-8 text-center space-y-2 border border-dashed border-white/10 rounded-2xl mt-4">
          <div className="text-xs font-bold text-white">No fixed recurring expenses added</div>
          <p className="text-[11px] text-zinc-400 max-w-sm mx-auto">
            Click &ldquo;Add Item&rdquo; above to record rent, utilities, transit passes, or phone bills.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-4">
          {data.fixedExpenses.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-2xl bg-white/[0.03] border transition-all ${
                item.active
                  ? 'border-white/10 hover:border-white/20'
                  : 'border-white/5 opacity-50 bg-black'
              } flex flex-col justify-between gap-3`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-xs font-bold text-white leading-snug">{item.name}</div>
                  <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                    {item.due} • {item.card}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => toggleFixedExpense(item.id)}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                    item.active
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                  }`}
                >
                  {item.active ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>Active</span>
                    </>
                  ) : (
                    <>
                      <PauseCircle className="w-3 h-3 text-zinc-400" />
                      <span>Paused</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between pt-2.5 border-t border-white/[0.06]">
                <span className="text-[10px] uppercase text-zinc-500 font-medium font-mono">Monthly</span>
                <span className="text-sm font-extrabold text-white font-mono-num">
                  {formatFromJpy(item.amountJpy, currency)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
