import React, { useState, useEffect } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { extractSmsDate } from '../../utils/smsParser';
import { CATEGORY_LIST } from '../../constants/initialData';
import { CardCode } from '../../types/finance';
import { X, Trash2 } from 'lucide-react';

export const EditTransactionModal: React.FC = () => {
  const {
    activeModal,
    closeModal,
    data,
    editingTxId,
    updateTransaction,
    deleteTransaction,
  } = useFinance();

  const [merchant, setMerchant] = useState('');
  const [category, setCategory] = useState('Convenience Store');
  const [cardCode, setCardCode] = useState<CardCode>('ICICI');
  const [spender, setSpender] = useState<'Son' | 'Dad'>('Son');
  const [dateStr, setDateStr] = useState('');
  const [amountJpy, setAmountJpy] = useState('');
  const [smsBalance, setSmsBalance] = useState('');

  const targetTx = data.transactions.find((t) => t.id === editingTxId);

  useEffect(() => {
    if (targetTx) {
      setMerchant(targetTx.merchant);
      setCategory(targetTx.category);
      setCardCode(targetTx.cardCode);
      setSpender(targetTx.spender);
      setDateStr(targetTx.date);
      setAmountJpy(String(targetTx.amountJpy));
      setSmsBalance(
        targetTx.smsBalance !== null && targetTx.smsBalance !== undefined
          ? String(targetTx.smsBalance)
          : ''
      );
    }
  }, [targetTx]);

  if (activeModal !== 'editTxModal' || !targetTx) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const dInfo = extractSmsDate(dateStr);
    const amt = Number(amountJpy) || 0;
    const cleanMerchant = merchant.trim().toUpperCase() || targetTx.merchant;

    updateTransaction(targetTx.id, {
      merchant: cleanMerchant,
      category,
      cardCode,
      cardUsed: cardCode === 'AXIS' ? 'Axis Bank XX7117' : 'ICICI Forex XX0817',
      spender,
      date: dInfo.dateStr,
      timestampMs: dInfo.timestampMs,
      amountJpy: amt,
      amountInr: Math.round(amt / 1.8),
      smsBalance: smsBalance.trim() !== '' ? Number(smsBalance) : null,
      subtext: `${
        cardCode === 'AXIS' ? 'Axis Bank Card XX7117' : 'ICICI Bank Forex Prepaid Card XX0817'
      } • ${dInfo.dateStr}`,
    });
    closeModal();
  };

  const handleDelete = () => {
    deleteTransaction(targetTx.id);
    closeModal();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bento-card max-w-lg w-full p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3.5">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">Edit Transaction &amp; Card Balance Anchor</h3>
            <p className="text-[11px] text-zinc-400">
              Modify merchant, category, card, date, spent amount, or the SMS-reported balance.
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block text-xs text-zinc-300">
              Merchant / Source Name
              <input
                type="text"
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                className="mt-1 w-full rounded-lg bg-[#0e1014] border border-white/10 px-3 py-2 text-xs text-white font-semibold"
                required
              />
            </label>

            <label className="block text-xs text-zinc-300">
              Category
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1 w-full rounded-lg bg-[#0e1014] border border-white/10 px-3 py-2 text-xs text-white font-medium cursor-pointer"
              >
                {CATEGORY_LIST.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-xs text-zinc-300">
              Card Used
              <select
                value={cardCode}
                onChange={(e) => setCardCode(e.target.value as CardCode)}
                className="mt-1 w-full rounded-lg bg-[#0e1014] border border-white/10 px-3 py-2 text-xs text-white"
              >
                <option value="ICICI">ICICI Forex XX0817 (JPY)</option>
                <option value="AXIS">Axis Bank XX7117 (INR/JPY)</option>
              </select>
            </label>

            <label className="block text-xs text-zinc-300">
              Spender
              <select
                value={spender}
                onChange={(e) => setSpender(e.target.value as 'Son' | 'Dad')}
                className="mt-1 w-full rounded-lg bg-[#0e1014] border border-white/10 px-3 py-2 text-xs text-white"
              >
                <option value="Son">Son</option>
                <option value="Dad">Dad</option>
              </select>
            </label>

            <label className="block text-xs text-zinc-300">
              Transaction Date
              <input
                type="text"
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                placeholder="e.g. 24-Oct-2026 or 24/10/26"
                className="mt-1 w-full rounded-lg bg-[#0e1014] border border-white/10 px-3 py-2 text-xs text-white font-mono-num"
                required
              />
            </label>

            <label className="block text-xs text-zinc-300">
              Spent Amount (JPY)
              <input
                type="number"
                value={amountJpy}
                onChange={(e) => setAmountJpy(e.target.value)}
                className="mt-1 w-full rounded-lg bg-[#0e1014] border border-white/10 px-3 py-2 text-xs text-white font-mono-num"
                required
              />
            </label>

            <label className="block text-xs text-zinc-300 sm:col-span-2">
              SMS Reported Balance After Transaction ({cardCode === 'ICICI' ? 'JPY' : 'INR'} — optional)
              <input
                type="number"
                value={smsBalance}
                onChange={(e) => setSmsBalance(e.target.value)}
                placeholder="Leave blank if SMS had no balance"
                className="mt-1 w-full rounded-lg bg-[#0e1014] border border-emerald-500/30 px-3 py-2 text-xs text-emerald-300 font-mono-num"
              />
              <span className="text-[10px] text-zinc-400 block mt-1">
                If this transaction is the latest by date for its card, this balance automatically anchors the card&apos;s available balance.
              </span>
            </label>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleDelete}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
            <div className="flex items-center gap-2">
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
                Save to DB
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
