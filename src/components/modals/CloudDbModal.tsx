import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { parseSingleSmsLine } from '../../utils/smsParser';
import { X, Copy, Download, Upload, Zap, Database } from 'lucide-react';

export const CloudDbModal: React.FC = () => {
  const {
    activeModal,
    closeModal,
    cloudDbUrl,
    setCloudDbUrl,
    pushToCloud,
    pullFromCloud,
    exportSyncCode,
    importSyncCode,
    resetToDefault,
    showToast,
    addTransactions,
    isCloudSyncing,
  } = useFinance();

  const [urlInput, setUrlInput] = useState(cloudDbUrl);
  const [syncCodeInput, setSyncCodeInput] = useState('');

  if (activeModal !== 'cloudDbModal') return null;

  const handleSaveUrl = async () => {
    setCloudDbUrl(urlInput.trim());
    await pullFromCloud(true);
  };

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

  const baseWebhook = cloudDbUrl
    .trim()
    .replace(/\/spendiq_family_ledger\.json$/i, '')
    .replace(/\.json$/i, '')
    .replace(/\/+$/, '');
  const webhookUrl = baseWebhook ? `${baseWebhook}/spendiq_raw_sms.json` : 'https://your-firebase-rtdb.firebaseio.com/spendiq_raw_sms.json';

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    showToast('Copied webhook endpoint URL!');
  };

  const handleSimulateWebhook = () => {
    const sampleLine = 'Dear Customer, JPY 1,180 spent on ICICI Bank Forex Card XX0817 at LAWSON STATION on 24/10/2026 12:30. Avl Bal: JPY 58,320.';
    const item = parseSingleSmsLine(sampleLine, 1);
    addTransactions([item]);
    showToast('Simulated incoming SMS webhook & updated balance!');
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bento-card max-w-xl w-full p-6 space-y-4 my-auto">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3.5">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">Shared Family Database &amp; Multi-Device Live Sync</h3>
            <p className="text-[11px] text-zinc-400">
              All changes auto-save in your browser storage. To make edits live for <strong>everyone</strong> (Dad in India &amp; Son in Japan), connect a shared Cloud Database URL or share a Sync Code.
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

        {/* Option 1: Live Cloud Database Endpoint */}
        <div className="p-3.5 rounded-xl bg-[#0e1014] border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-amber-400" />
              <span>1. Live Cloud Database URL (Real-Time Sync)</span>
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              {cloudDbUrl ? 'Cloud Connected' : 'Local DB Active'}
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Paste any free <strong>Firebase Realtime Database URL</strong> or REST JSON endpoint. SpendIQ automatically syncs data across Dad&apos;s and Son&apos;s browsers.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://your-family-db-default-rtdb.firebaseio.com"
              className="flex-1 rounded-lg bg-[#15181e] border border-white/10 px-3 py-2 text-xs text-white font-mono-num focus:outline-none focus:border-emerald-500"
            />
            <button
              type="button"
              onClick={handleSaveUrl}
              disabled={isCloudSyncing}
              className="px-4 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shrink-0 cursor-pointer disabled:opacity-50"
            >
              {isCloudSyncing ? 'Syncing...' : 'Connect & Sync Now'}
            </button>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <button
              type="button"
              onClick={() => pullFromCloud(true)}
              className="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:underline font-semibold cursor-pointer"
            >
              <Download className="w-3 h-3" />
              <span>Pull Latest from Cloud DB</span>
            </button>
            <button
              type="button"
              onClick={() => pushToCloud(true)}
              className="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:underline font-semibold cursor-pointer"
            >
              <Upload className="w-3 h-3" />
              <span>Force Push Local State to Cloud</span>
            </button>
          </div>
        </div>

        {/* Option 1B: Zero-Paste Phone Automation */}
        <div className="p-3.5 rounded-xl bg-[#0e1014] border border-emerald-500/25 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>Zero-Paste Phone Automation (Dad&apos;s Bank SMS)</span>
            </span>
            <button
              type="button"
              onClick={handleSimulateWebhook}
              className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-600/25 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30 cursor-pointer"
            >
              Test Phone Auto-SMS
            </button>
          </div>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Set up an <strong>iPhone Shortcut Automation</strong> (&ldquo;When I get a message from ICICI or Axis&rdquo;) to POST JSON to this endpoint. SpendIQ auto-imports it without manual pasting:
          </p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={webhookUrl}
              className="flex-1 rounded-lg bg-[#15181e] border border-white/10 px-2.5 py-1.5 text-[11px] text-emerald-300 font-mono-num"
            />
            <button
              type="button"
              onClick={handleCopyWebhook}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 shrink-0 cursor-pointer"
            >
              <Copy className="w-3 h-3" />
              <span>Copy URL</span>
            </button>
          </div>
        </div>

        {/* Option 2: Instant Family Sync Code */}
        <div className="p-3.5 rounded-xl bg-[#0e1014] border border-white/[0.07] space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white">
              2. Instant Family Sync Code (WhatsApp / iMessage Backup)
            </span>
            <button
              type="button"
              onClick={handleCopyCode}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-[11px] font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 cursor-pointer"
            >
              <Copy className="w-3 h-3" />
              <span>Copy Current Code</span>
            </button>
          </div>
          <textarea
            rows={2}
            value={syncCodeInput}
            onChange={(e) => setSyncCodeInput(e.target.value)}
            className="w-full rounded-lg bg-[#15181e] border border-white/10 p-2.5 text-[11px] text-zinc-300 font-mono-num"
            placeholder="Paste a Family Sync Code here and click 'Load Sync Code'..."
          />
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={resetToDefault}
              className="text-[11px] text-rose-400 hover:underline cursor-pointer"
            >
              Reset to Initial Screenshot Data
            </button>
            <button
              type="button"
              onClick={handleImportCode}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
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
