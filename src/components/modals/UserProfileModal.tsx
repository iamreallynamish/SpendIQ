import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useFinance } from '../../context/FinanceContext';
import { BANKING_METHOD_OPTIONS } from '../../types/auth';
import { PinPad } from '../onboarding/PinPad';
import {
  X,
  User,
  Mail,
  Lock,
  Globe,
  Coins,
  LogOut,
  ShieldAlert,
  Check,
  KeyRound,
  ShieldCheck,
} from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const {
    currentUser,
    userProfile,
    updateUserProfile,
    setAppPin,
    lockApp,
    signOutUser,
  } = useAuth();
  const { setCurrency } = useFinance();

  const [activeTab, setActiveTab] = useState<'profile' | 'pin'>('profile');
  const [displayName, setDisplayName] = useState(userProfile?.displayName || 'Namish');
  const [primaryCurrency, setPrimaryCurrency] = useState<'JPY' | 'INR' | 'USD'>(
    userProfile?.primaryCurrency || 'JPY'
  );
  const [secondaryCurrency, setSecondaryCurrency] = useState<'JPY' | 'INR' | 'USD'>(
    userProfile?.secondaryCurrency || 'INR'
  );
  const [selectedMethods, setSelectedMethods] = useState<string[]>(
    userProfile?.bankingMethods || ['forex', 'credit_card']
  );
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateUserProfile({
        displayName: displayName.trim() || 'Namish',
        primaryCurrency,
        secondaryCurrency,
        bankingMethods: selectedMethods,
      });
      setCurrency(primaryCurrency);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleMethod = (id: string) => {
    setSelectedMethods((prev) =>
      prev.includes(id)
        ? prev.length > 1
          ? prev.filter((m) => m !== id)
          : prev
        : [...prev, id]
    );
  };

  const handlePinUpdated = async (newPin: string) => {
    await setAppPin(newPin);
    setActiveTab('profile');
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleLockNow = () => {
    onClose();
    lockApp();
  };

  const handleSignOut = async () => {
    onClose();
    await signOutUser();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-zinc-950 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center text-[#E8FF1F]">
              <User className="w-5 h-5 text-[#E8FF1F]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-sans">Account &amp; Security Settings</h2>
              <p className="text-xs text-zinc-400 font-mono">{currentUser?.email || 'Authenticated User'}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-white/5">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`pb-3 text-xs font-bold transition-colors cursor-pointer border-b-2 ${
              activeTab === 'profile'
                ? 'border-[#E8FF1F] text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Profile &amp; Preferences
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pin')}
            className={`pb-3 text-xs font-bold transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 ${
              activeTab === 'pin'
                ? 'border-[#E8FF1F] text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Change 4-Digit PIN</span>
          </button>
        </div>

        {/* Body content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {activeTab === 'profile' ? (
            <form onSubmit={handleSaveProfile} className="space-y-5">
              {/* Display Name */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Your Display Name
                </label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#E8FF1F] transition-all font-sans"
                />
              </div>

              {/* Currency selection */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  Primary Currency
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['JPY', 'INR', 'USD'] as const).map((curr) => (
                    <button
                      key={curr}
                      type="button"
                      onClick={() => setPrimaryCurrency(curr)}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        primaryCurrency === curr
                          ? 'bg-[#E8FF1F] text-black border-[#E8FF1F]'
                          : 'bg-zinc-900 border-white/10 text-white hover:border-white/20'
                      }`}
                    >
                      {curr}
                    </button>
                  ))}
                </div>
              </div>

              {/* Banking Methods */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  Enabled Banking Channels
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {BANKING_METHOD_OPTIONS.map((opt) => {
                    const isChecked = selectedMethods.includes(opt.id);
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => toggleMethod(opt.id)}
                        className={`p-2.5 rounded-xl border text-left text-xs transition-all flex items-center justify-between cursor-pointer ${
                          isChecked
                            ? 'bg-zinc-900 border-[#E8FF1F]/40 text-white'
                            : 'bg-zinc-900/40 border-white/5 text-zinc-400'
                        }`}
                      >
                        <span className="font-semibold">{opt.label}</span>
                        {isChecked && <Check className="w-4 h-4 text-[#E8FF1F]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-3 rounded-2xl bg-[#E8FF1F] hover:bg-[#f2ff5c] text-black font-extrabold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  {savedSuccess ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Saved!</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleLockNow}
                  className="py-3 px-4 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
                  title="Test PIN lock screen immediately"
                >
                  <Lock className="w-3.5 h-3.5 text-[#E8FF1F]" />
                  <span>Lock Screen</span>
                </button>
              </div>
            </form>
          ) : (
            <div>
              <div className="mb-4 text-center">
                <h3 className="text-base font-bold text-white">Reset 4-Digit Security PIN</h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Create a new 4-digit code to update your local app lock.
                </p>
              </div>
              <PinPad
                mode="setup"
                title="Set new PIN"
                subtitle="Enter your new 4-digit code"
                onSuccess={handlePinUpdated}
                onCancel={() => setActiveTab('profile')}
              />
            </div>
          )}

          {/* Account session control */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-between">
            <div className="text-[11px] text-zinc-500">
              User ID: <span className="font-mono">{currentUser?.uid.slice(0, 10)}...</span>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
