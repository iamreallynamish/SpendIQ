import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { X, Copy, Download, Upload, Database, Trash2, CheckCircle2 } from 'lucide-react';
import firebaseConfig from '../../../firebase-applet-config.json';

export const CloudDbModal: React.FC = () => {
  const {
    activeModal,
    closeModal,
    pushToCloud,
    pullFromCloud,
    exportSyncCode,
    importSyncCode,
    wipeToBlankSlate,
    showToast,
    isCloudSyncing,
    isFirestoreConnected,
    dbStatusMsg,
    data,
  } = useFinance();

  const [syncCodeInput, setSyncCodeInput] = useState('');
  const [showConfirmWipe, setShowConfirmWipe] = useState(false);

  if (activeModal !== 'cloudDbModal') return null;

  const handleCopyCode = () => {
    const code = exportSyncCode();
    navigator.clipboard.writeText(code);
    showToast('Copied current database sync code to clipboard!');
  };

  const handleImportCode = () => {
    if (!syncCodeInput.trim()) {
      showToast('Paste a sync code first');
      return;
    }
    const success = importSyncCode(syncCodeInput.trim());
    if (success) {
      setSyncCodeInput('');
    }
  };

  const handleExecuteWipe = async () => {
    await wipeToBlankSlate();
    setShowConfirmWipe(false);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bento-card max-w-xl w-full p-6 space-y-4 my-auto">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3.5">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-tight">Shared Cloud Database &amp; Multi-Device Sync</h3>
              <span className={`bento-chip font-mono ${isFirestoreConnected ? 'bento-chip-emerald' : 'bento-chip-amber'}`}>
                {isFirestoreConnected ? 'Firestore Connected' : 'Connecting'}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Powered by <strong>Google Cloud Firestore</strong>. Any change made on the live website is synced across all devices (Dad in India &amp; Son in Japan) in real time.
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

        {/* 1. Firestore Cloud Engine Status */}
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-[#E8FF1F]" />
              <span>Google Cloud Firestore Status</span>
            </span>
            <span className="text-[11px] font-mono text-zinc-300 flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isFirestoreConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              {dbStatusMsg}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
            <div className="p-2.5 rounded-xl bg-black border border-white/10">
              <div className="text-[10px] text-zinc-400 uppercase">Project ID</div>
              <div className="text-white font-bold truncate mt-0.5">{firebaseConfig.projectId}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-black border border-white/10">
              <div className="text-[10px] text-zinc-400 uppercase">Database ID</div>
              <div className="text-emerald-300 font-bold truncate mt-0.5">{firebaseConfig.firestoreDatabaseId}</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <button
              type="button"
              onClick={() => pullFromCloud(true)}
              disabled={isCloudSyncing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/[0.06] hover:bg-white/[0.12] text-zinc-200 border border-white/10 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Pull Fresh from Cloud</span>
            </button>
            <button
              type="button"
              onClick={() => pushToCloud(true)}
              disabled={isCloudSyncing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/[0.06] hover:bg-white/[0.12] text-zinc-200 border border-white/10 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Upload className="w-3.5 h-3.5 text-[#E8FF1F]" />
              <span>Force Sync to Cloud</span>
            </button>
          </div>
        </div>

        {/* 2. Blank Slate Manager */}
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.08] space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-rose-400" />
              <span className="text-xs font-bold text-white">Reset to Blank Slate</span>
            </div>
            <span className="text-[10px] font-mono text-zinc-400">
              {data.transactions.length} Transactions in DB
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Wipe all stored transactions, notes, and records from both your browser and the shared Firestore database to start completely fresh.
          </p>

          {!showConfirmWipe ? (
            <button
              type="button"
              onClick={() => setShowConfirmWipe(true)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 transition-colors cursor-pointer"
            >
              Wipe All Transactions (Start Fresh)
            </button>
          ) : (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 flex items-center justify-between gap-3">
              <span className="text-xs text-rose-200 font-semibold">
                Confirm wipe? All transactions will be cleared from Firestore.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmWipe(false)}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium text-zinc-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteWipe}
                  className="px-3 py-1 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white cursor-pointer"
                >
                  Yes, Wipe Everything
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 3. Instant Family Sync Code (Offline Backup) */}
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.08] space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white">
              Instant Family Sync Code (WhatsApp / iMessage Backup)
            </span>
            <button
              type="button"
              onClick={handleCopyCode}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 cursor-pointer"
            >
              <Copy className="w-3 h-3" />
              <span>Copy Current Code</span>
            </button>
          </div>
          <textarea
            rows={2}
            value={syncCodeInput}
            onChange={(e) => setSyncCodeInput(e.target.value)}
            className="w-full rounded-xl bg-black border border-white/10 p-2.5 text-[11px] text-zinc-300 font-mono-num focus:outline-none focus:border-emerald-500"
            placeholder="Paste a Family Sync Code here to restore a snapshot..."
          />
          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={handleImportCode}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
            >
              Load Sync Code &amp; Save
            </button>
          </div>
        </div>

        <div className="flex items-center justify-end pt-1">
          <button
            type="button"
            onClick={closeModal}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-800 text-zinc-200 hover:bg-zinc-700 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
