import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PinPad } from './PinPad';
import { LogOut } from 'lucide-react';

export const PinUnlockOverlay: React.FC = () => {
  const { userProfile, unlockApp, signOutUser } = useAuth();
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleUnlock = async (pin: string) => {
    setIsVerifying(true);
    setErrorMsg(null);
    try {
      const success = await unlockApp(pin);
      if (!success) {
        throw new Error('Incorrect PIN');
      }
    } catch {
      setErrorMsg('Incorrect PIN. Please try again.');
      throw new Error('Incorrect PIN');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleForgotPin = async () => {
    if (window.confirm('Signing out will require your email and password to log in again. Proceed?')) {
      await signOutUser();
    }
  };

  const displayName = userProfile?.displayName || 'Namish';

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-between p-6 sm:p-10 select-none animate-fade-in">
      {/* Top Header */}
      <div className="w-full max-w-sm flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-white flex items-center justify-center text-black font-extrabold text-xs">
            <span className="border-2 border-black rounded-sm w-3 h-3 inline-block"></span>
          </div>
          <span className="font-bold text-sm tracking-tight text-white font-sans">SpendIQ</span>
        </div>

        <button
          type="button"
          onClick={handleForgotPin}
          title="Sign out to log in with password"
          className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {/* Center Pin Pad */}
      <div className="w-full max-w-sm my-auto">
        <PinPad
          mode="unlock"
          title={`Welcome back, ${displayName}`}
          subtitle="Enter your 4-digit PIN to securely unlock SpendIQ."
          onSuccess={handleUnlock}
          onForgotPin={handleForgotPin}
          isVerifying={isVerifying}
          externalError={errorMsg}
        />
      </div>

      {/* Bottom Footer */}
      <div className="text-center">
        <span className="text-[11px] text-zinc-600 font-mono">
          Session Locked &bull; SpendIQ Vault
        </span>
      </div>
    </div>
  );
};
