import React, { useState, useEffect } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { StagedSmsItem, CardCode, Transaction } from '../../types/finance';
import { parseSingleSmsLine, extractSmsDate, smartCategorizeExpense } from '../../utils/smsParser';
import { CATEGORY_LIST } from '../../constants/initialData';
import { X, Sparkles } from 'lucide-react';

export const BulkSmsModal: React.FC = () => {
  const {
    activeModal,
    closeModal,
    addTransactions,
    showToast,
    data,
    role,
  } = useFinance();

  const [smsText, setSmsText] = useState('');
  const [stagedItems, setStagedItems] = useState<StagedSmsItem[]>([]);

  // Manual entry fields
  const [manualMerchant, setManualMerchant] = useState('');
  const [manualCard, setManualCard] = useState<CardCode>('ICICI');
  const [manualCategory, setManualCategory] = useState('');
  const [manualDate, setManualDate] = useState('2026-10-24');
  const [manualAmount, setManualAmount] = useState('');
  const [manualBal, setManualBal] = useState('');

  // Auto-parse lines whenever smsText or manual inputs change
  useEffect(() => {
    const lines = smsText.trim() ? smsText.split(/\n+/).map((l) => l.trim()).filter(Boolean) : [];
    const parsed = lines.map((line, idx) => parseSingleSmsLine(line, idx + 1));

    if (manualMerchant.trim() && Number(manualAmount) > 0) {
      const amt = Number(manualAmount);
      const dInfo = extractSmsDate(manualDate);
      parsed.push({
        merchant: manualMerchant.trim().toUpperCase(),
        cardCode: manualCard,
        cardUsed: manualCard === 'AXIS' ? 'Axis Bank XX7117' : 'ICICI Forex XX0817',
        category: manualCategory.trim() || smartCategorizeExpense(manualMerchant.trim(), ''),
        spender: role === 'DAD' ? 'Dad' : 'Son',
        date: dInfo.dateStr,
        dateRecognized: true,
        timestampMs: dInfo.timestampMs + 99,
        amountJpy: manualCard === 'AXIS' ? Math.round(amt * 1.8) : amt,
        amountInr: manualCard === 'AXIS' ? amt : Math.round(amt / 1.8),
        nativeCurrency: manualCard === 'AXIS' ? 'INR' : 'JPY',
        smsBalance: manualBal.trim() !== '' ? Number(manualBal) : null,
      });
    }

    setStagedItems(parsed);
  }, [smsText, manualMerchant, manualCard, manualCategory, manualDate, manualAmount, manualBal, role]);

  if (activeModal !== 'smsModal') return null;

  const handleLoadSample = () => {
    setSmsText(
      "Dear Customer, JPY 840 spent on ICICI Bank Forex Card XX0817 at FAMILYMART NISSHIN on 19/10/2026. Avl Bal: JPY 62,916.\n" +
      "ICICI Bank Forex Card XX0817 debited for JPY 2,000 at MOBILE SUICA on 21-10-26. Available Balance: JPY 60,916.\n" +
      "Dear Customer, JPY 3,490 spent on ICICI Bank Forex Card XX0817 at GU NAGOYA on 23-Oct-2026. Avl Bal: JPY 57,426.\n" +
      "ATM Cash Withdrawal of JPY 10,000 on ICICI Bank Forex Card XX0817 at SEVEN BANK ATM on 25/10/2026. Avl Bal: JPY 47,426."
    );
  };

  const handleStageFieldChange = (index: number, field: keyof StagedSmsItem, value: string | number | null) => {
    setStagedItems((prev) => {
      const next = [...prev];
      const item = { ...next[index] };
      if (field === 'merchant' && typeof value === 'string') {
        item.merchant = value.toUpperCase();
        item.category = smartCategorizeExpense(item.merchant, item.rawLine || '');
      } else if (field === 'category' && typeof value === 'string') {
        item.category = value;
      } else if (field === 'cardCode' && (value === 'ICICI' || value === 'AXIS')) {
        item.cardCode = value;
        item.cardUsed = value === 'AXIS' ? 'Axis Bank XX7117' : 'ICICI Forex XX0817';
      } else if (field === 'date' && typeof value === 'string') {
        const dObj = extractSmsDate(value);
        item.date = dObj.dateStr;
        item.timestampMs = dObj.timestampMs + index + 1;
      } else if (field === 'amountJpy') {
        item.amountJpy = Number(value) || 0;
        item.amountInr = Math.round(item.amountJpy / 1.8);
      } else if (field === 'smsBalance') {
        item.smsBalance = value === '' || value === null ? null : Number(value);
      }
      next[index] = item;
      return next;
    });
  };

  const handleCommit = () => {
    if (stagedItems.length === 0) {
      showToast('Paste bank SMS or fill the manual entry row');
      return;
    }
    const count = addTransactions(stagedItems);
    setSmsText('');
    setManualMerchant('');
    setManualAmount('');
    setManualBal('');
    setStagedItems([]);
    closeModal();
    showToast(`Saved ${count} transaction(s) to Database & updated card balances!`);
  };

  // Find latest by date to indicate which transaction will update the card balance
  const combinedIcici: (Transaction | StagedSmsItem)[] = [
    ...data.transactions.filter((t) => t.cardCode === 'ICICI'),
    ...stagedItems.filter((s) => s.cardCode === 'ICICI'),
  ].filter((t) => t.smsBalance !== null && t.smsBalance !== undefined);

  const latestIcici = combinedIcici.reduce<Transaction | StagedSmsItem | null>(
    (best, cur) => (!best || (cur.timestampMs || 0) >= (best.timestampMs || 0) ? cur : best),
    null
  );

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bento-card max-w-3xl w-full p-6 space-y-4 my-auto">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3.5">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">Dad&apos;s Bulk Bank SMS Parser &amp; Editable Importer</h3>
            <p className="text-[11px] text-zinc-400">
              Paste SMS messages below. You can <strong>edit any parsed field</strong> (merchant, date, amount, or card balance) right in the preview before saving!
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

        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="text-xs font-semibold text-zinc-300">
              Bank SMS Messages (1 per line — auto-stages below on paste)
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSmsText('')}
                className="text-[11px] font-medium text-zinc-400 hover:text-white cursor-pointer"
              >
                Clear Text
              </button>
              <button
                type="button"
                onClick={handleLoadSample}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 underline cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
                <span>Load Sample ICICI &amp; Axis SMS</span>
              </button>
            </div>
          </div>
          <textarea
            rows={4}
            value={smsText}
            onChange={(e) => setSmsText(e.target.value)}
            className="w-full rounded-xl bg-[#0c0d10] border border-white/10 p-3 text-xs text-zinc-100 font-mono-num focus:outline-none focus:border-emerald-500"
            placeholder="Paste bank SMS messages here...&#10;Examples:&#10;Dear Customer, JPY 1,420 spent on ICICI Bank Forex Card XX0817 at FAMILYMART on 19/10/2026. Avl Bal: JPY 62,336.&#10;ICICI Forex Card XX0817 debited for JPY 2,836.00 at DON QUIJOTE on 24-10-26. Avl Bal JPY 59,500."
          />
        </div>

        {/* LIVE INCOMING TRANSACTIONS PREVIEW PANEL */}
        <div className="rounded-xl bg-[#0e1014] border border-white/10 p-3.5 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-white">
                INCOMING TRANSACTIONS PREVIEW ({stagedItems.length} GOING IN)
              </span>
            </div>
            <span className="text-[10px] font-mono-num px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-white/[0.08]">
              {stagedItems.length === 0
                ? 'Paste SMS or enter manual item below to preview'
                : `${stagedItems.length} transaction(s) ready to commit`}
            </span>
          </div>

          <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
            {stagedItems.length === 0 ? (
              <div className="text-[11px] text-zinc-500 py-3 text-center">
                No incoming transactions staged yet. Paste SMS lines above or click &ldquo;Load Sample ICICI &amp; Axis SMS&rdquo;.
              </div>
            ) : (
              stagedItems.map((item, idx) => {
                const isAnchor = item.cardCode === 'ICICI' && latestIcici === item;
                return (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-lg bg-[#15181e] border ${
                      isAnchor ? 'border-emerald-500/40 ring-1 ring-emerald-500/20' : 'border-white/[0.06]'
                    } space-y-2 text-xs`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded bg-emerald-500/20 text-emerald-300 font-mono-num font-bold text-[10px] flex items-center justify-center">
                          #{idx + 1}
                        </span>
                        <span className="text-[11px] font-bold text-white">{item.merchant}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-500/15 text-teal-300 font-mono-num">
                          {item.date}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono-num px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                        {isAnchor ? '★ LATEST BY DATE → UPDATES CARD BALANCE' : 'Parsed & Editable'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                      <label className="block text-[10px] text-zinc-400">
                        Merchant
                        <input
                          type="text"
                          value={item.merchant}
                          onChange={(e) => handleStageFieldChange(idx, 'merchant', e.target.value)}
                          className="mt-0.5 w-full rounded bg-[#0c0d10] border border-white/10 px-2 py-1 text-xs text-white font-semibold"
                        />
                      </label>

                      <label className="block text-[10px] text-zinc-400">
                        Category
                        <select
                          value={item.category}
                          onChange={(e) => handleStageFieldChange(idx, 'category', e.target.value)}
                          className="mt-0.5 w-full rounded bg-[#0c0d10] border border-white/10 px-2 py-1 text-xs text-amber-300 font-semibold cursor-pointer"
                        >
                          {CATEGORY_LIST.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="block text-[10px] text-zinc-400">
                        Card
                        <select
                          value={item.cardCode}
                          onChange={(e) => handleStageFieldChange(idx, 'cardCode', e.target.value)}
                          className="mt-0.5 w-full rounded bg-[#0c0d10] border border-white/10 px-2 py-1 text-xs text-white"
                        >
                          <option value="ICICI">ICICI XX0817</option>
                          <option value="AXIS">Axis XX7117</option>
                        </select>
                      </label>

                      <label className="block text-[10px] text-zinc-400">
                        Date
                        <input
                          type="text"
                          value={item.date}
                          onChange={(e) => handleStageFieldChange(idx, 'date', e.target.value)}
                          className="mt-0.5 w-full rounded bg-[#0c0d10] border border-white/10 px-2 py-1 text-xs text-teal-300 font-mono-num"
                        />
                      </label>

                      <label className="block text-[10px] text-zinc-400">
                        Spent (JPY)
                        <input
                          type="number"
                          value={item.amountJpy}
                          onChange={(e) => handleStageFieldChange(idx, 'amountJpy', Number(e.target.value))}
                          className="mt-0.5 w-full rounded bg-[#0c0d10] border border-white/10 px-2 py-1 text-xs text-rose-300 font-mono-num"
                        />
                      </label>

                      <label className="block text-[10px] text-zinc-400">
                        Card Bal ({item.cardCode === 'ICICI' ? 'JPY' : 'INR'})
                        <input
                          type="number"
                          value={item.smsBalance !== null && item.smsBalance !== undefined ? item.smsBalance : ''}
                          placeholder="None"
                          onChange={(e) => handleStageFieldChange(idx, 'smsBalance', e.target.value)}
                          className="mt-0.5 w-full rounded bg-[#0c0d10] border border-emerald-500/30 px-2 py-1 text-xs text-emerald-300 font-mono-num"
                        />
                      </label>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Quick Manual Single Entry */}
        <div className="p-3.5 rounded-xl bg-[#0e1014] border border-white/[0.06] space-y-2.5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
            Or Quick Manual Transaction Entry
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-6 gap-2">
            <input
              type="text"
              placeholder="Merchant (e.g. Daiso)"
              value={manualMerchant}
              onChange={(e) => setManualMerchant(e.target.value)}
              className="rounded-lg bg-[#15181e] border border-white/10 px-2.5 py-1.5 text-xs text-white"
            />
            <select
              value={manualCard}
              onChange={(e) => setManualCard(e.target.value as CardCode)}
              className="rounded-lg bg-[#15181e] border border-white/10 px-2.5 py-1.5 text-xs text-white"
            >
              <option value="ICICI">ICICI Forex XX0817 (JPY)</option>
              <option value="AXIS">Axis Bank XX7117 (INR/JPY)</option>
            </select>
            <select
              value={manualCategory}
              onChange={(e) => setManualCategory(e.target.value)}
              className="rounded-lg bg-[#15181e] border border-white/10 px-2.5 py-1.5 text-xs text-white"
            >
              <option value="">Auto-Detect Category</option>
              {CATEGORY_LIST.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={manualDate}
              onChange={(e) => setManualDate(e.target.value)}
              className="rounded-lg bg-[#15181e] border border-white/10 px-2 py-1.5 text-xs text-white"
            />
            <input
              type="number"
              placeholder="Spent (e.g. 950)"
              value={manualAmount}
              onChange={(e) => setManualAmount(e.target.value)}
              className="rounded-lg bg-[#15181e] border border-white/10 px-2.5 py-1.5 text-xs text-white font-mono-num"
            />
            <input
              type="number"
              placeholder="Avl Bal (optional)"
              value={manualBal}
              onChange={(e) => setManualBal(e.target.value)}
              className="rounded-lg bg-[#15181e] border border-white/10 px-2.5 py-1.5 text-xs text-white font-mono-num"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
          <span className="text-[11px] text-emerald-400 font-medium font-mono">
            ✓ Automatically saves to persistent Database &amp; syncs latest date balance
          </span>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={closeModal}
              className="bento-btn-secondary h-9 px-4 text-xs"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCommit}
              className="bento-btn-primary h-9 px-5 text-xs"
            >
              {stagedItems.length > 0
                ? `Parse & Save ${stagedItems.length} Transaction${stagedItems.length > 1 ? 's' : ''}`
                : 'Parse & Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
