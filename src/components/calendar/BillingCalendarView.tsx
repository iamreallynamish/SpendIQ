import React, { useMemo, useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { formatFromJpy } from '../../utils/currency';
import { getTxMonthKey, extractSmsDate } from '../../utils/smsParser';
import { Edit2, Plus, Calendar as CalendarIcon, Clock, CheckCircle2 } from 'lucide-react';

export const BillingCalendarView: React.FC = () => {
  const {
    data,
    currency,
    selectedMonth,
    selectedCalDay,
    setSelectedCalDay,
    setCalendarDayNote,
    setEditingTxId,
    openModal,
  } = useFinance();

  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteInput, setNoteInput] = useState('');

  const monthKey = selectedMonth === 'ALL' ? 'Oct-2026' : selectedMonth;
  const [monShort, yrStr] = monthKey.split('-');
  const daysInCal = monShort === 'Sep' || monShort === 'Nov' ? 30 : 31;

  // Filter transactions for this month
  const monthTxs = useMemo(() => {
    return data.transactions.filter((tx) => getTxMonthKey(tx) === monthKey);
  }, [data.transactions, monthKey]);

  // Group by day of month
  const byDay = useMemo(() => {
    const map: Record<number, typeof monthTxs> = {};
    for (let d = 1; d <= daysInCal; d++) map[d] = [];

    monthTxs.forEach((tx) => {
      const match = (tx.date || '').match(/^(\d{1,2})\-/);
      const dayNum = match ? parseInt(match[1], 10) : extractSmsDate(tx.date).dayOfMonth;
      if (dayNum >= 1 && dayNum <= daysInCal) {
        map[dayNum].push(tx);
      }
    });
    return map;
  }, [monthTxs, daysInCal]);

  const selDay = Math.min(daysInCal, Math.max(1, selectedCalDay));
  const selPad = String(selDay).padStart(2, '0');
  const selTxs = byDay[selDay] || [];
  const selTotalJpy = selTxs.reduce((sum, t) => sum + (Number(t.amountJpy) || 0), 0);
  const selNote = data.calendarNotes[String(selDay)];

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteInput.trim()) return;
    setCalendarDayNote(String(selDay), noteInput.trim(), 'fixed');
    setNoteInput('');
    setIsEditingNote(false);
  };

  const handleEditTx = (id: string) => {
    setEditingTxId(id);
    openModal('editTxModal');
  };

  return (
    <div className="space-y-6 pb-14">
      {/* Page Header */}
      <div className="bento-card p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-white/[0.06] border border-white/[0.12] flex items-center justify-center text-[#E8FF1F]">
              <CalendarIcon className="w-4 h-4" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-sans">
              Billing Calendar &amp; Daily Ledger
            </h1>
            <span className="bento-chip bento-chip-neon font-mono">
              {monShort} {yrStr}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Day-by-day Japan card transactions, recurring due dates, and reload checkpoints.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-400"></span> Day Outflow
            </span>
            <span className="flex items-center gap-1.5 ml-2">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span> Bill / Reload
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left 8 Cols: Monthly Calendar Grid */}
        <div className="lg:col-span-8 bento-card p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-white/[0.08]">
            <h2 className="text-sm font-bold text-white tracking-tight">
              {monShort} {yrStr} Days
            </h2>
            <span className="text-[11px] text-zinc-400 font-mono">
              Select any day to inspect receipt breakdown
            </span>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-bold uppercase tracking-wider text-zinc-400 font-mono mt-4 mb-2">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
            {Array.from({ length: daysInCal }, (_, i) => i + 1).map((day) => {
              const dayTxs = byDay[day] || [];
              const daySpendJpy = dayTxs.reduce((sum, t) => sum + (Number(t.amountJpy) || 0), 0);
              const note = data.calendarNotes[String(day)];
              const isSelected = selectedCalDay === day;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedCalDay(day)}
                  className={`p-3 rounded-2xl border text-left min-h-[76px] flex flex-col justify-between transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#E8FF1F] bg-white/[0.08] shadow-[0_0_20px_rgba(232,255,31,0.2)]'
                      : daySpendJpy > 0
                      ? 'border-white/15 bg-white/[0.02] hover:bg-white/[0.05]'
                      : 'border-white/[0.06] bg-black hover:bg-white/[0.02]'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-[11px] font-mono font-bold ${
                        isSelected
                          ? 'text-[#E8FF1F]'
                          : daySpendJpy > 0
                          ? 'text-white'
                          : 'text-zinc-500'
                      }`}
                    >
                      {day}
                    </span>
                    {daySpendJpy > 0 && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-300 font-mono font-bold">
                        {dayTxs.length}
                      </span>
                    )}
                  </div>

                  {daySpendJpy > 0 ? (
                    <div className="mt-1">
                      <div className="text-[11px] font-extrabold text-rose-400 font-mono-num leading-tight">
                        -{formatFromJpy(daySpendJpy, currency)}
                      </div>
                      <div className="text-[9px] text-zinc-400 truncate mt-0.5">
                        {dayTxs[0]?.merchant}
                      </div>
                    </div>
                  ) : note && note.type !== 'spend' ? (
                    <div className="mt-1">
                      <div className="text-[10px] font-semibold text-amber-300 truncate">
                        {note.title}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-1 text-[10px] text-zinc-600 font-mono-num">¥0</div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right 4 Cols: Selected Day Spend Inspector */}
        <div className="lg:col-span-4 bento-card p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 font-mono">
                  Day Inspector
                </span>
                <h3 className="text-lg font-extrabold text-white font-mono mt-0.5">
                  {selPad}-{monShort}-{yrStr}
                </h3>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase text-zinc-400 block font-mono">Spent Outflow</span>
                <span
                  className={`text-lg font-extrabold font-mono-num ${
                    selTotalJpy > 0 ? 'text-rose-400' : 'text-emerald-400'
                  }`}
                >
                  {selTotalJpy > 0 ? `-${formatFromJpy(selTotalJpy, currency)}` : '¥0'}
                </span>
              </div>
            </div>

            {/* List of transactions on clicked day */}
            <div className="mt-4">
              <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 font-mono mb-2">
                Transactions ({selTxs.length})
              </div>
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {selTxs.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-center space-y-1">
                    <CalendarIcon className="w-5 h-5 text-zinc-600 mx-auto mb-1" />
                    <div className="text-xs font-bold text-zinc-300">
                      No card spend on this day
                    </div>
                    <div className="text-[11px] text-zinc-500">
                      Zero transactions recorded for {selPad} {monShort}.
                    </div>
                  </div>
                ) : (
                  selTxs.map((tx) => (
                    <div
                      key={tx.id}
                      className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-xl ${
                            tx.iconBg || 'bg-emerald-600 text-white'
                          } flex items-center justify-center font-extrabold text-xs shrink-0`}
                        >
                          {tx.letter || tx.merchant.charAt(0)}
                        </div>
                        <div className="truncate">
                          <div className="text-xs font-bold text-white truncate">{tx.merchant}</div>
                          <div className="text-[10px] text-zinc-400 truncate font-mono">
                            {tx.category} • {tx.cardUsed}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-xs font-bold text-white font-mono-num">
                          {formatFromJpy(tx.amountJpy, currency)}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleEditTx(tx.id)}
                          className="text-[10px] text-emerald-400 hover:underline cursor-pointer font-mono"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Day Note Input */}
            <div className="mt-4 pt-3.5 border-t border-white/[0.08]">
              <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 font-mono mb-1.5 flex items-center justify-between">
                <span>Day Note / Reminder</span>
                {selNote && (
                  <span className="text-[10px] text-amber-300 font-semibold">{selNote.title}</span>
                )}
              </div>
              <form onSubmit={handleSaveNote} className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Suica pass auto-renew"
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  className="flex-1 rounded-xl bg-black border border-white/10 px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/30"
                />
                <button
                  type="submit"
                  className="bento-btn-secondary h-8 px-3 text-xs"
                >
                  Save
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingCalendarView;
