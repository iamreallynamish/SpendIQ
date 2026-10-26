import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Smartphone, Database, Shield, Zap, Link as LinkIcon } from 'lucide-react';

export const IntegrationsView: React.FC = () => {
  const { openModal } = useFinance();

  return (
    <div className="space-y-6 pb-14">
      {/* Page Header */}
      <div className="bento-card p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-white/[0.06] border border-white/[0.12] flex items-center justify-center text-[#E8FF1F]">
              <LinkIcon className="w-4 h-4" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-sans">
              Integrations &amp; Cloud Sync
            </h1>
            <span className="bento-chip bento-chip-neon font-mono">
              Live Channels
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Connected card channels, Mobile Suica / Apple Pay endpoints, and shared family database.
          </p>
        </div>

        <button
          type="button"
          onClick={() => openModal('cloudDbModal')}
          className="bento-btn-primary h-8 px-4 text-xs"
        >
          <Database className="w-3.5 h-3.5" />
          <span>Configure Cloud Sync</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bento-card p-6 flex flex-col justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Smartphone className="w-4 h-4" />
                </span>
                <span className="text-sm font-bold text-white">Apple Pay &amp; Mobile Suica</span>
              </div>
              <span className="bento-chip bento-chip-emerald font-mono">Connected</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Linked to ICICI Forex Card XX0817 for contactless conbini &amp; train transit payments across Japan (Nagoya, Tokyo, Kansai). Recharging Mobile Suica via Apple Wallet debits ICICI Prepaid Card directly in JPY.
            </p>
          </div>
          <div className="pt-3 border-t border-white/[0.08] text-[11px] text-zinc-500 font-mono">
            ICICI Prepaid XX0817 • JPY Native
          </div>
        </div>

        <div className="bento-card p-6 flex flex-col justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Database className="w-4 h-4" />
                </span>
                <span className="text-sm font-bold text-white">Real-Time Shared Family DB</span>
              </div>
              <span className="bento-chip bento-chip-amber font-mono">Active</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Persists locally in browser storage and syncs across Dad&apos;s and Son&apos;s devices using Firebase Cloud Database with instant 1-Click Family JSON Backup codes.
            </p>
          </div>
          <div className="pt-3 border-t border-white/[0.08] text-[11px] text-zinc-500 font-mono">
            Encrypted Multi-Device Sync
          </div>
        </div>

        <div className="bento-card p-6 flex flex-col justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-[#a9b2ff]/15 border border-[#a9b2ff]/30 flex items-center justify-center text-[#a9b2ff]">
                  <Shield className="w-4 h-4" />
                </span>
                <span className="text-sm font-bold text-white">Card Isolation &amp; Currency Math</span>
              </div>
              <span className="bento-chip font-mono">Dual Engine</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              ICICI Forex Prepaid Card operates natively in JPY, while Axis Bank Credit Card operates in INR with cross-currency JPY swiping conversion.
            </p>
          </div>
          <div className="pt-3 border-t border-white/[0.08] text-[11px] text-zinc-500 font-mono">
            100 JPY ≈ ₹56 INR • 1 USD ≈ ¥150 JPY
          </div>
        </div>

        <div className="bento-card p-6 flex flex-col justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-[#E8FF1F]/15 border border-[#E8FF1F]/30 flex items-center justify-center text-[#E8FF1F]">
                  <Zap className="w-4 h-4" />
                </span>
                <span className="text-sm font-bold text-white">Automated SMS Regex Parser</span>
              </div>
              <span className="bento-chip bento-chip-neon font-mono">Ready</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Parses Indian bank SMS alerts from ICICI Bank and Axis Bank, automatically extracting merchant, amount in foreign &amp; domestic currency, remaining balance, and date.
            </p>
          </div>
          <div className="pt-3 border-t border-white/[0.08] text-[11px] text-zinc-500 font-mono">
            Supports Bulk Multi-Line Pasting
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntegrationsView;
