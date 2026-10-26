import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { formatFromJpy } from '../../utils/currency';
import { CreditCard, Trash2, Plus, Calendar, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const SubscriptionsView: React.FC = () => {
  const { data, currency, addSubscription, deleteSubscription, role } = useFinance();
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [cycle, setCycle] = useState('Monthly on 1st');
  const [amountJpy, setAmountJpy] = useState('');
  const [card, setCard] = useState('ICICI Forex XX0817');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !amountJpy) return;
    addSubscription(name.trim(), cycle, Number(amountJpy), card, 'Active Auto-Debit');
    setName('');
    setAmountJpy('');
    setShowAddForm(false);
  };

  const totalMonthlyJpy = data.subscriptions.reduce((sum, s) => sum + (Number(s.amountJpy) || 0), 0);
  const totalYearlyJpy = totalMonthlyJpy * 12;

  return (
    <div className="space-y-6 pb-14">
      {/* Page Header */}
      <div className="bento-card p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-white/[0.06] border border-white/[0.12] flex items-center justify-center text-[#E8FF1F]">
              <CreditCard className="w-4 h-4" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-sans">
              Subscriptions &amp; Auto-Debits
            </h1>
            <span className="bento-chip bento-chip-neon font-mono">
              {data.subscriptions.length} Mandates
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Recurring digital, mobile, and software services billed to ICICI Forex (XX0817) and Axis Bank (XX7117).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[10px] uppercase text-zinc-400 font-mono">Monthly Burn</div>
            <div className="text-lg font-extrabold text-white font-mono-num">
              {formatFromJpy(totalMonthlyJpy, currency)}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="bento-btn-primary h-9 px-3 text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{showAddForm ? 'Close' : 'Add Subscription'}</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bento-card p-5">
          <div className="text-[10px] uppercase font-mono font-semibold text-zinc-400">Total Monthly Commitments</div>
          <div className="text-2xl font-extrabold text-white font-mono-num mt-1">
            {formatFromJpy(totalMonthlyJpy, currency)}
          </div>
          <div className="text-[11px] text-zinc-400 mt-1 font-mono">
            {data.subscriptions.length} recurring auto-debits
          </div>
        </div>

        <div className="bento-card p-5">
          <div className="text-[10px] uppercase font-mono font-semibold text-zinc-400">Annualized Outflow</div>
          <div className="text-2xl font-extrabold text-[#E8FF1F] font-mono-num mt-1">
            {formatFromJpy(totalYearlyJpy, currency)}
          </div>
          <div className="text-[11px] text-zinc-400 mt-1 font-mono">
            Projected 12-month total
          </div>
        </div>

        <div className="bento-card p-5">
          <div className="text-[10px] uppercase font-mono font-semibold text-zinc-400">Primary Billing Card</div>
          <div className="text-xl font-extrabold text-emerald-400 font-mono-num mt-1">
            ICICI Forex XX0817
          </div>
          <div className="text-[11px] text-zinc-400 mt-1 font-mono">
            Forex direct auto-debits
          </div>
        </div>
      </div>

      {/* Inline Add Form */}
      {showAddForm && (
        <form onSubmit={handleAdd} className="bento-card p-5 space-y-4 border-emerald-500/40">
          <div className="text-xs font-bold text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Create New Subscription Mandate</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <input
              type="text"
              placeholder="Subscription Name (e.g. Netflix, Spotify)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-xl bg-black border border-white/10 px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/30"
              required
            />
            <input
              type="text"
              placeholder="Billing Cycle (e.g. Monthly on 15th)"
              value={cycle}
              onChange={(e) => setCycle(e.target.value)}
              className="rounded-xl bg-black border border-white/10 px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/30"
              required
            />
            <input
              type="number"
              placeholder="Amount in JPY (e.g. 1980)"
              value={amountJpy}
              onChange={(e) => setAmountJpy(e.target.value)}
              className="rounded-xl bg-black border border-white/10 px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 font-mono focus:outline-none focus:border-white/30"
              required
            />
            <select
              value={card}
              onChange={(e) => setCard(e.target.value)}
              className="rounded-xl bg-black border border-white/10 px-3 py-2.5 text-xs text-white focus:outline-none cursor-pointer"
            >
              <option value="ICICI Forex XX0817">ICICI Forex XX0817</option>
              <option value="Axis Bank XX7117">Axis Bank XX7117</option>
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="bento-btn-secondary h-8 px-3 text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bento-btn-primary h-8 px-4 text-xs"
            >
              Save Subscription
            </button>
          </div>
        </form>
      )}

      {/* Subscriptions Grid */}
      {data.subscriptions.length === 0 ? (
        <div className="bento-card p-10 text-center space-y-3">
          <div className="w-10 h-10 mx-auto rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-zinc-400">
            <CreditCard className="w-5 h-5" />
          </div>
          <div className="text-sm font-bold text-white">No active subscriptions</div>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            Track recurring software, streaming services, and memberships billed to your cards.
          </p>
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="bento-btn-primary h-8 px-3 text-xs inline-flex items-center gap-1.5 mx-auto cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Subscription</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.subscriptions.map((sub) => (
            <div
              key={sub.id}
              className="bento-card p-5 flex flex-col justify-between gap-4 hover:border-white/20 transition-all group"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-tight">{sub.name}</h3>
                    <div className="text-[11px] text-zinc-400 font-mono mt-0.5 flex items-center gap-1.5">
                      <Calendar className="w-3 h-3 text-zinc-500" />
                      <span>{sub.cycle}</span>
                    </div>
                  </div>
                  <span className="bento-chip bento-chip-emerald font-mono text-[10px]">
                    {sub.status || 'Active'}
                  </span>
                </div>

                <div className="mt-4 flex items-baseline justify-between">
                  <span className="text-[10px] uppercase text-zinc-400 font-mono">Cost</span>
                  <div className="text-xl font-extrabold text-white font-mono-num">
                    {formatFromJpy(sub.amountJpy, currency)}
                  </div>
                </div>

                <div className="mt-2 text-[10px] text-zinc-400 font-mono">
                  Billed to: <strong className="text-zinc-200">{sub.card}</strong>
                </div>
              </div>

              <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between text-xs">
                <span className="text-[10px] text-zinc-500 font-mono">Auto-renews monthly</span>
                {role === 'DAD' && (
                  <button
                    type="button"
                    onClick={() => deleteSubscription(sub.id)}
                    title="Delete subscription"
                    className="text-zinc-500 hover:text-rose-400 transition-colors p-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SubscriptionsView;
