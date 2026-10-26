import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import { formatFromJpy } from '../../utils/currency';
import { getCategoryBadgeStyle } from '../../utils/smsParser';
import {
  X,
  Receipt,
  Store,
  Calendar,
  Clock,
  ShoppingBag,
  Camera,
  CheckCircle2,
  Trash2,
  ExternalLink,
} from 'lucide-react';

export const ReceiptDetailModal: React.FC = () => {
  const {
    activeModal,
    closeModal,
    selectedTxForReceipt,
    openReceiptScannerForTx,
    attachReceiptToTransaction,
    updateTransaction,
    currency,
  } = useFinance();

  const isOpen = activeModal === 'receiptDetailModal';
  if (!isOpen || !selectedTxForReceipt) return null;

  const receipt = selectedTxForReceipt.receipt;
  if (!receipt) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
        <div className="bento-card max-w-md w-full p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-zinc-400 mx-auto">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">No Receipt Attached</h3>
            <p className="text-xs text-zinc-400 mt-1">
              There is no itemized bill saved for this transaction yet.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={closeModal}
              className="bento-btn-secondary h-8 px-3 text-xs"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => openReceiptScannerForTx(selectedTxForReceipt)}
              className="bento-btn-primary h-8 px-3 text-xs"
            >
              Scan Receipt Now
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleRemoveReceipt = () => {
    updateTransaction(selectedTxForReceipt.id, {
      receipt: undefined,
    });
    closeModal();
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bento-card max-w-2xl w-full p-5 sm:p-6 space-y-4 my-auto border-white/[0.15]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3.5">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Receipt className="w-4 h-4" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-tight">
                  Itemized Bill &bull; {receipt.storeName}
                </h3>
                <span className="bento-chip bento-chip-emerald font-mono text-[10px]">
                  Verified Items
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Visual Intelligence item breakdown &amp; item price ledger for future records.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeModal}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Info Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
          <div>
            <div className="text-[10px] uppercase font-mono text-zinc-400 font-semibold">Store / Branch</div>
            <div className="text-sm font-bold text-white truncate mt-0.5">
              {receipt.storeName}
            </div>
            <div className="text-[10px] text-zinc-400 font-mono">
              {receipt.storeBranch || 'Retail Store'}
            </div>
          </div>

          <div>
            <div className="text-[10px] uppercase font-mono text-zinc-400 font-semibold">Purchase Date</div>
            <div className="text-sm font-bold text-white mt-0.5 flex items-center gap-1.5 font-mono">
              <Calendar className="w-3.5 h-3.5 text-zinc-400" />
              <span>{receipt.date || selectedTxForReceipt.date}</span>
            </div>
            {receipt.time && (
              <div className="text-[10px] text-zinc-400 font-mono flex items-center gap-1 mt-0.5">
                <Clock className="w-3 h-3" />
                <span>{receipt.time}</span>
              </div>
            )}
          </div>

          <div>
            <div className="text-[10px] uppercase font-mono text-zinc-400 font-semibold">Total Paid</div>
            <div className="text-lg font-extrabold text-[#E8FF1F] font-mono-num mt-0.5">
              {formatFromJpy(receipt.totalAmount || selectedTxForReceipt.amountJpy, currency)}
            </div>
            <div className="text-[10px] text-zinc-400 font-mono">
              {receipt.taxAmount ? `Tax: ¥${receipt.taxAmount.toLocaleString()}` : 'Tax Included'}
            </div>
          </div>
        </div>

        {/* AI Summary Quote */}
        {receipt.summary && (
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs text-zinc-300 italic flex items-start gap-2">
            <span className="text-[#E8FF1F] font-serif text-base leading-none">&ldquo;</span>
            <span>{receipt.summary}</span>
          </div>
        )}

        {/* Bill Preview + Itemized Table Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
          {/* Bill Photo Thumbnail if available */}
          {receipt.imageUrl && (
            <div className="sm:col-span-4 rounded-xl bg-[#08090b] border border-white/10 p-2 flex flex-col items-center justify-center">
              <img
                src={receipt.imageUrl}
                alt="Receipt Bill"
                className="max-h-56 w-auto object-contain rounded-lg border border-white/10"
              />
              <span className="text-[9px] text-zinc-400 font-mono mt-1.5">Scanned Bill Record</span>
            </div>
          )}

          {/* Items Table (Span 8 or full) */}
          <div className={receipt.imageUrl ? 'sm:col-span-8' : 'sm:col-span-12'}>
            <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-3 space-y-2">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-white/[0.06]">
                <span className="text-[11px] font-bold text-white flex items-center gap-1.5 uppercase font-mono">
                  <ShoppingBag className="w-3.5 h-3.5 text-[#E8FF1F]" />
                  <span>Purchased Items ({receipt.items?.length || 0})</span>
                </span>
                <span className="text-[10px] font-mono text-zinc-400">Item Price</span>
              </div>

              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1 divide-y divide-white/[0.03]">
                {receipt.items && receipt.items.length > 0 ? (
                  receipt.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="pt-1.5 first:pt-0 flex items-center justify-between text-xs"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="font-medium text-white truncate text-xs">
                          {item.name}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-mono mt-0.5">
                          {item.category && <span>{item.category}</span>}
                          {item.qty && item.qty > 1 && <span>Qty: {item.qty}</span>}
                        </div>
                      </div>
                      <span className="font-mono-num font-bold text-[#E8FF1F] shrink-0 text-xs">
                        {formatFromJpy(item.price, currency)}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="py-4 text-center text-xs text-zinc-500 font-mono">
                    No individual items itemized for this bill.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={handleRemoveReceipt}
            className="text-rose-400 hover:text-rose-300 text-xs inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Remove Bill</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => openReceiptScannerForTx(selectedTxForReceipt)}
              className="bento-btn-secondary h-8 px-3 text-xs inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Re-scan Bill</span>
            </button>
            <button
              type="button"
              onClick={closeModal}
              className="bento-btn-primary h-8 px-4 text-xs font-bold cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
