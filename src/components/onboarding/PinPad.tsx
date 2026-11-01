import React, { useState, useEffect, useCallback } from 'react';
import { Delete, Lock, ShieldCheck, AlertCircle } from 'lucide-react';

interface PinPadProps {
  mode: 'setup' | 'unlock';
  title?: string;
  subtitle?: string;
  onSuccess: (pin: string) => Promise<void> | void;
  onForgotPin?: () => void;
  onCancel?: () => void;
  isVerifying?: boolean;
  externalError?: string | null;
}

export const PinPad: React.FC<PinPadProps> = ({
  mode,
  title,
  subtitle,
  onSuccess,
  onForgotPin,
  onCancel,
  isVerifying = false,
  externalError = null,
}) => {
  // In setup mode, stage can be 'create' or 'confirm'
  const [setupStage, setSetupStage] = useState<'create' | 'confirm'>('create');
  const [createdPin, setCreatedPin] = useState<string>('');
  const [currentInput, setCurrentInput] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(externalError);
  const [isShaking, setIsShaking] = useState(false);

  useEffect(() => {
    if (externalError) {
      setErrorMsg(externalError);
      triggerShake();
    }
  }, [externalError]);

  const triggerShake = () => {
    setIsShaking(true);
    const timer = setTimeout(() => setIsShaking(false), 500);
    return () => clearTimeout(timer);
  };

  const handleDigit = useCallback(
    async (digit: string) => {
      if (isVerifying) return;
      if (currentInput.length >= 4) return;

      const nextVal = currentInput + digit;
      setCurrentInput(nextVal);
      setErrorMsg(null);

      if (nextVal.length === 4) {
        if (mode === 'unlock') {
          // Verify PIN
          try {
            await onSuccess(nextVal);
          } catch {
            triggerShake();
            setErrorMsg('Incorrect PIN. Please try again.');
            setCurrentInput('');
          }
        } else {
          // Setup mode
          if (setupStage === 'create') {
            setCreatedPin(nextVal);
            setCurrentInput('');
            setSetupStage('confirm');
          } else {
            // Confirm stage
            if (nextVal === createdPin) {
              try {
                await onSuccess(nextVal);
              } catch {
                triggerShake();
                setErrorMsg('Failed to save PIN. Try again.');
                setCurrentInput('');
                setSetupStage('create');
              }
            } else {
              triggerShake();
              setErrorMsg('Codes do not match. Please re-enter.');
              setCurrentInput('');
              setSetupStage('create');
              setCreatedPin('');
            }
          }
        }
      }
    },
    [currentInput, isVerifying, mode, setupStage, createdPin, onSuccess]
  );

  const handleDelete = useCallback(() => {
    if (isVerifying) return;
    if (currentInput.length > 0) {
      setCurrentInput((prev) => prev.slice(0, -1));
      setErrorMsg(null);
    }
  }, [isVerifying, currentInput]);

  const handleReset = useCallback(() => {
    setCurrentInput('');
    setCreatedPin('');
    setSetupStage('create');
    setErrorMsg(null);
  }, []);

  // Listen to physical keyboard presses
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleDigit(e.key);
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        handleDelete();
      } else if (e.key === 'Escape') {
        if (onCancel) onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDigit, handleDelete, onCancel]);

  const getHeading = () => {
    if (title) return title;
    if (mode === 'unlock') return 'Enter your app code';
    return setupStage === 'create' ? 'Create your app code' : 'Confirm your app code';
  };

  const getSubheading = () => {
    if (subtitle) return subtitle;
    if (mode === 'unlock') return 'Enter your 4-digit PIN to securely unlock SpendIQ';
    return setupStage === 'create'
      ? 'Set a 4-digit code for quick biometric & session unlock.'
      : 'Re-enter your 4-digit code to verify.';
  };

  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-sm mx-auto select-none">
      {/* Brand Icon */}
      <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center shadow-lg mb-6 relative">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-[#E8FF1F]/10 to-transparent pointer-events-none" />
        {setupStage === 'confirm' ? (
          <ShieldCheck className="w-7 h-7 text-[#E8FF1F]" />
        ) : (
          <Lock className="w-7 h-7 text-[#E8FF1F]" />
        )}
      </div>

      {/* Headings */}
      <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight text-center font-sans">
        {getHeading()}
      </h2>
      <p className="text-sm text-zinc-400 mt-2 text-center max-w-xs leading-relaxed">
        {getSubheading()}
      </p>

      {/* Code Indicators (4 Dots) */}
      <div
        className={`flex items-center justify-center gap-4 my-8 transition-transform ${
          isShaking ? 'animate-[shake_0.4s_ease-in-out]' : ''
        }`}
      >
        {[0, 1, 2, 3].map((index) => {
          const isFilled = index < currentInput.length;
          return (
            <div
              key={index}
              className={`w-4 h-4 rounded-full transition-all duration-200 ${
                isFilled
                  ? 'bg-[#E8FF1F] border-2 border-[#E8FF1F] scale-110 shadow-[0_0_12px_rgba(232,255,31,0.6)]'
                  : 'bg-transparent border-2 border-white/30'
              } ${errorMsg ? 'border-rose-500 bg-rose-500/20' : ''}`}
            />
          );
        })}
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="flex items-center gap-1.5 text-rose-400 text-xs mb-4 bg-rose-500/10 px-3 py-1.5 rounded-xl border border-rose-500/20 animate-fade-in">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Keypad Grid (3x4) */}
      <div className="grid grid-cols-3 gap-4 sm:gap-5 w-full max-w-[280px]">
        {digits.map((digit) => (
          <button
            key={digit}
            type="button"
            disabled={isVerifying}
            onClick={() => handleDigit(digit)}
            className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full bg-zinc-900/90 hover:bg-zinc-800 active:scale-90 border border-white/10 active:border-[#E8FF1F] hover:border-white/20 text-white active:text-[#E8FF1F] text-2xl font-bold font-mono flex items-center justify-center transition-all duration-150 cursor-pointer shadow-md focus:outline-none"
          >
            {digit}
          </button>
        ))}

        {/* Bottom row: Reset / Recover or Blank */}
        <div className="flex items-center justify-center">
          {mode === 'setup' && setupStage === 'confirm' ? (
            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-zinc-400 hover:text-white underline cursor-pointer"
            >
              Start over
            </button>
          ) : onForgotPin ? (
            <button
              type="button"
              onClick={onForgotPin}
              className="text-xs text-zinc-400 hover:text-white underline cursor-pointer"
            >
              Reset
            </button>
          ) : (
            <div className="w-16 h-16 sm:w-20 sm:h-20" />
          )}
        </div>

        {/* '0' Digit */}
        <button
          type="button"
          disabled={isVerifying}
          onClick={() => handleDigit('0')}
          className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full bg-zinc-900/90 hover:bg-zinc-800 active:scale-90 border border-white/10 active:border-[#E8FF1F] hover:border-white/20 text-white active:text-[#E8FF1F] text-2xl font-bold font-mono flex items-center justify-center transition-all duration-150 cursor-pointer shadow-md focus:outline-none"
        >
          0
        </button>

        {/* Backspace / Delete Button */}
        <button
          type="button"
          disabled={isVerifying || currentInput.length === 0}
          onClick={handleDelete}
          className={`w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full bg-zinc-900/40 hover:bg-zinc-800/80 active:scale-90 border border-white/5 hover:border-white/20 text-zinc-400 hover:text-white flex items-center justify-center transition-all duration-150 cursor-pointer focus:outline-none ${
            currentInput.length === 0 ? 'opacity-30 cursor-not-allowed' : ''
          }`}
          title="Delete last digit"
        >
          <Delete className="w-6 h-6" />
        </button>
      </div>

      {/* Footer subtle recovery / cancel link */}
      <div className="mt-8 flex flex-col items-center gap-2">
        {mode === 'setup' && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
          >
            Skip PIN setup for now
          </button>
        )}
        {mode === 'unlock' && onForgotPin && (
          <button
            type="button"
            onClick={onForgotPin}
            className="text-xs text-zinc-500 hover:text-[#E8FF1F] transition-colors cursor-pointer"
          >
            Forgot PIN? Sign in with password instead
          </button>
        )}
      </div>
    </div>
  );
};
