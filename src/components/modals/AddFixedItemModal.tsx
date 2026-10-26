import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { X } from 'lucide-react';

export const AddItemModal: React.FC = () => {
  const { activeModal, closeModal, addFixedExpense, addStock } = useFinance();

  const isStock = activeModal === 'addStockModal';
  const isFixed = activeModal === 'addFixedModal';

  // Fixed Expense form
  const [fixedName, setFixedName] = useState('');
  const [fixedAmount, setFixedAmount] = useState('');
  const [fixedDue, setFixedDue] = useState('Due 1st Monthly');
  const [fixedCard, setFixedCard] = useState('ICICI Forex XX0817');

  // Stock form
  const [ticker, setTicker] = useState('');
  const [stockName, setStockName] = useState('');
  const [units, setUnits] = useState('100 Shares');
  const [valueJpy, setValueJpy] = useState('');
  const [gain, setGain] = useState('+5.0%');

  if (!isStock && !isFixed) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isFixed) {
      if (!fixedName.trim() || !fixedAmount) return;
      addFixedExpense(fixedName.trim(), Number(fixedAmount), fixedDue, fixedCard);
      setFixedName('');
      setFixedAmount('');
    } else {
      if (!ticker.trim() || !stockName.trim() || !valueJpy) return;
      addStock(ticker.trim(), stockName.trim(), units, Number(valueJpy), gain);
      setTicker('');
      setStockName('');
      setValueJpy('');
    }
    closeModal();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bento-card max-w-md w-full p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3.5">
          <h3 className="text-sm font-bold text-white tracking-tight">
            {isFixed ? 'Add Fixed Monthly Expense' : 'Add Equity / Stock Holding'}
          </h3>
          <button
            type="button"
            onClick={closeModal}
            className="text-zinc-400 hover:text-white text-lg font-bold px-2 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {isFixed ? (
            <>
              <label className="block text-xs text-zinc-300">
                Title / Name
                <input
                  type="text"
                  placeholder="e.g. Dormitory Rent / JR Pass"
                  value={fixedName}
                  onChange={(e) => setFixedName(e.target.value)}
                  className="mt-1 w-full rounded-lg bg-[#0e1014] border border-white/10 px-3 py-2 text-xs text-white"
                  required
                />
              </label>

              <div className="grid grid-cols-2 gap-2.5">
                <label className="block text-xs text-zinc-300">
                  Amount (JPY)
                  <input
                    type="number"
                    placeholder="42000"
                    value={fixedAmount}
                    onChange={(e) => setFixedAmount(e.target.value)}
                    className="mt-1 w-full rounded-lg bg-[#0e1014] border border-white/10 px-3 py-2 text-xs text-white font-mono-num"
                    required
                  />
                </label>
                <label className="block text-xs text-zinc-300">
                  Billing Day / Tag
                  <input
                    type="text"
                    placeholder="Due 1st of month"
                    value={fixedDue}
                    onChange={(e) => setFixedDue(e.target.value)}
                    className="mt-1 w-full rounded-lg bg-[#0e1014] border border-white/10 px-3 py-2 text-xs text-white"
                  />
                </label>
              </div>

              <label className="block text-xs text-zinc-300">
                Card / Account
                <select
                  value={fixedCard}
                  onChange={(e) => setFixedCard(e.target.value)}
                  className="mt-1 w-full rounded-lg bg-[#0e1014] border border-white/10 px-3 py-2 text-xs text-white"
                >
                  <option value="ICICI Forex XX0817">ICICI Forex XX0817</option>
                  <option value="Axis Bank XX7117">Axis Bank XX7117</option>
                </select>
              </label>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2.5">
                <label className="block text-xs text-zinc-300">
                  Ticker Symbol
                  <input
                    type="text"
                    placeholder="e.g. 7203.T or INFY.NS"
                    value={ticker}
                    onChange={(e) => setTicker(e.target.value)}
                    className="mt-1 w-full rounded-lg bg-[#0e1014] border border-white/10 px-3 py-2 text-xs text-white font-mono-num"
                    required
                  />
                </label>
                <label className="block text-xs text-zinc-300">
                  Units / Shares
                  <input
                    type="text"
                    placeholder="e.g. 50 Shares"
                    value={units}
                    onChange={(e) => setUnits(e.target.value)}
                    className="mt-1 w-full rounded-lg bg-[#0e1014] border border-white/10 px-3 py-2 text-xs text-white"
                  />
                </label>
              </div>

              <label className="block text-xs text-zinc-300">
                Company / Fund Name
                <input
                  type="text"
                  placeholder="e.g. Toyota Motor Corp"
                  value={stockName}
                  onChange={(e) => setStockName(e.target.value)}
                  className="mt-1 w-full rounded-lg bg-[#0e1014] border border-white/10 px-3 py-2 text-xs text-white"
                  required
                />
              </label>

              <div className="grid grid-cols-2 gap-2.5">
                <label className="block text-xs text-zinc-300">
                  Current Value (JPY)
                  <input
                    type="number"
                    placeholder="150000"
                    value={valueJpy}
                    onChange={(e) => setValueJpy(e.target.value)}
                    className="mt-1 w-full rounded-lg bg-[#0e1014] border border-white/10 px-3 py-2 text-xs text-white font-mono-num"
                    required
                  />
                </label>
                <label className="block text-xs text-zinc-300">
                  Gain / Return
                  <input
                    type="text"
                    placeholder="+12.5%"
                    value={gain}
                    onChange={(e) => setGain(e.target.value)}
                    className="mt-1 w-full rounded-lg bg-[#0e1014] border border-white/10 px-3 py-2 text-xs text-white"
                  />
                </label>
              </div>
            </>
          )}

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
              Save {isFixed ? 'Fixed Item' : 'Holding'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
