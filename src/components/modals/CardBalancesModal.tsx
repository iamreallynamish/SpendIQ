import React, { useState, useEffect } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { X } from 'lucide-react';

export const CardBalancesModal: React.FC = () => {
  const { activeModal, closeModal, data, updateCardBalancesOverride } = useFinance();

  const [iciciBal, setIciciBal] = useState(data.icici.balanceJpy ?? 63756);
  const [iciciDate, setIciciDate] = useState(data.icici.nextDate || '2026-11-05');
  const [axisBal, setAxisBal] = useState(data.axis.balanceInr ?? 140000);
  const [axisDate, setAxisDate] = useState(data.axis.nextDate || '2026-11-18');

  useEffect(() => {
    if (activeModal === 'cardBalancesModal') {
      setIciciBal(data.icici.balanceJpy ?? 63756);
      setIciciDate(data.icici.nextDate || '2026-11-05');
      setAxisBal(data.axis.balanceInr ?? 140000);
      setAxisDate(data.axis.nextDate || '2026-11-18');
    }
  }, [activeModal, data.icici, data.axis]);

  if (activeModal !== 'cardBalancesModal') return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateCardBalancesOverride(Number(iciciBal), iciciDate, Number(axisBal), axisDate);
    closeModal();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bento-card max-w-md w-full p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3.5">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">Update Card Balances &amp; Reload Dates</h3>
            <p className="text-[11px] text-zinc-400">
              Dad&apos;s Admin override for ICICI Forex XX0817 &amp; Axis Card XX7117.
            </p>
          </div>
          <button
            type="button"
            onClick={closeModal}
            className="text-zinc-400 hover:text-white text-lg font-bold px-2 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-3">
          <div className="p-3 rounded-xl bg-[#0e1014] border border-white/[0.08] hover:border-emerald-500/30 space-y-2">
            <div className="text-xs font-bold text-emerald-400">
              ICICI Bank Forex Prepaid Card (XX0817)
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <label className="block text-[11px] text-zinc-400">
                Available Balance (JPY)
                <input
                  type="number"
                  value={iciciBal}
                  onChange={(e) => setIciciBal(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg bg-[#15181e] border border-white/10 px-2.5 py-1.5 text-xs text-white font-mono-num"
                  required
                />
              </label>
              <label className="block text-[11px] text-zinc-400">
                Next Reload Date
                <input
                  type="date"
                  value={iciciDate}
                  onChange={(e) => setIciciDate(e.target.value)}
                  className="mt-1 w-full rounded-lg bg-[#15181e] border border-white/10 px-2.5 py-1.5 text-xs text-white"
                  required
                />
              </label>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#0e1014] border border-amber-500/20 space-y-2">
            <div className="text-xs font-bold text-amber-400">
              Axis Bank Credit Card (XX7117)
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <label className="block text-[11px] text-zinc-400">
                Available Limit (INR)
                <input
                  type="number"
                  value={axisBal}
                  onChange={(e) => setAxisBal(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg bg-[#15181e] border border-white/10 px-2.5 py-1.5 text-xs text-white font-mono-num"
                  required
                />
              </label>
              <label className="block text-[11px] text-zinc-400">
                Next Billing Date
                <input
                  type="date"
                  value={axisDate}
                  onChange={(e) => setAxisDate(e.target.value)}
                  className="mt-1 w-full rounded-lg bg-[#15181e] border border-white/10 px-2.5 py-1.5 text-xs text-white"
                  required
                />
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={closeModal}
              className="bento-btn-secondary h-9 px-4 text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bento-btn-primary h-9 px-4 text-xs"
            >
              Save Balances
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
