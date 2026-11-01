import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { BANKING_METHOD_OPTIONS, OnboardingStep } from '../../types/auth';
import { PinPad } from './PinPad';
import {
  Globe,
  CreditCard,
  Landmark,
  Wallet,
  Coins,
  Check,
  ArrowRight,
  Sparkles,
  Lock,
  Eye,
  EyeOff,
  User as UserIcon,
  CheckCircle2,
  AlertCircle,
  Shield,
  Layers,
} from 'lucide-react';

export const OnboardingFlow: React.FC = () => {
  const {
    currentUser,
    userProfile,
    signUpWithEmail,
    signInWithEmail,
    signInWithGoogle,
    updateOnboardingStep,
    completeOnboarding,
    setAppPin,
  } = useAuth();

  // Screen 1 Auth form states
  const [authMode, setAuthMode] = useState<'signup' | 'login'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Active step: if user already has a step saved, resume from there, else step 1
  const currentStep = (
    !currentUser ? 1 : Math.max(2, (userProfile?.lastCompletedStep || 1) + 1)
  ) as OnboardingStep;

  const [activeStep, setActiveStep] = useState<OnboardingStep>(() => {
    if (!currentUser) return 1;
    return Math.min(6, Math.max(2, (userProfile?.lastCompletedStep || 1) + 1)) as OnboardingStep;
  });

  // Step 3 Personal Setup states
  const [displayName, setDisplayName] = useState<string>(() => {
    return userProfile?.displayName || 'Namish';
  });

  // Step 4 Banking Method states
  const [selectedMethods, setSelectedMethods] = useState<string[]>(() => {
    return userProfile?.bankingMethods && userProfile.bankingMethods.length > 0
      ? userProfile.bankingMethods
      : ['forex', 'credit_card', 'transit_ic'];
  });

  // Step 5 Currency states
  const [primaryCurrency, setPrimaryCurrency] = useState<'JPY' | 'INR' | 'USD'>(() => {
    return userProfile?.primaryCurrency || 'JPY';
  });
  const [secondaryCurrency, setSecondaryCurrency] = useState<'JPY' | 'INR' | 'USD'>(() => {
    return userProfile?.secondaryCurrency || 'INR';
  });

  // Handle Screen 1 Sign In / Sign Up
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setAuthError('Please fill in both email and password.');
      return;
    }
    if (password.length < 6) {
      setAuthError('Password must be at least 6 characters.');
      return;
    }

    setAuthError(null);
    setIsSubmitting(true);
    try {
      if (authMode === 'signup') {
        await signUpWithEmail(email, password);
      } else {
        await signInWithEmail(email, password);
      }
      setActiveStep(2);
    } catch (err: unknown) {
      const errObj = err as { code?: string; message?: string };
      if (errObj.code === 'auth/email-already-in-use') {
        setAuthError('An account with this email already exists. Please log in.');
      } else if (errObj.code === 'auth/invalid-credential' || errObj.code === 'auth/wrong-password') {
        setAuthError('Invalid email or password. Please try again.');
      } else if (errObj.code === 'auth/weak-password') {
        setAuthError('Password should be at least 6 characters.');
      } else {
        setAuthError(errObj.message || 'Authentication failed. Please check your credentials.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    setIsSubmitting(true);
    try {
      await signInWithGoogle();
      setActiveStep(2);
    } catch (err: unknown) {
      const errObj = err as { message?: string };
      setAuthError(errObj.message || 'Google Sign-In was cancelled or failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2 PIN Save
  const handlePinSuccess = async (pin: string) => {
    setIsSubmitting(true);
    try {
      await setAppPin(pin);
      await updateOnboardingStep(2);
      setActiveStep(3);
    } catch {
      setAuthError('Could not save PIN. Please retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 3 Personal Name Save
  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = displayName.trim() || 'Namish';
    setIsSubmitting(true);
    try {
      await updateOnboardingStep(3, { displayName: cleanName });
      setActiveStep(4);
    } catch {
      setAuthError('Failed to save name.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 4 Banking Methods Toggle
  const toggleMethod = (id: string) => {
    setSelectedMethods((prev) => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev; // Keep at least one
        return prev.filter((m) => m !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleBankingSubmit = async () => {
    setIsSubmitting(true);
    try {
      await updateOnboardingStep(4, { bankingMethods: selectedMethods });
      setActiveStep(5);
    } catch {
      setAuthError('Failed to save banking preferences.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 5 Currency Preferences Submit
  const handleCurrencySubmit = async () => {
    setIsSubmitting(true);
    try {
      await updateOnboardingStep(5, {
        primaryCurrency,
        secondaryCurrency,
      });
      setActiveStep(6);
    } catch {
      setAuthError('Failed to save currencies.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 6 Finish Onboarding
  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      await completeOnboarding({
        displayName: displayName.trim() || 'Namish',
        bankingMethods: selectedMethods,
        primaryCurrency,
        secondaryCurrency,
      });
    } catch {
      setAuthError('Failed to complete setup. Please click again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMethodIcon = (iconName: string) => {
    switch (iconName) {
      case 'globe':
        return <Globe className="w-5 h-5 text-[#E8FF1F]" />;
      case 'credit-card':
        return <CreditCard className="w-5 h-5 text-emerald-400" />;
      case 'landmark':
        return <Landmark className="w-5 h-5 text-cyan-400" />;
      case 'wallet':
        return <Wallet className="w-5 h-5 text-purple-400" />;
      case 'circle-dollar':
        return <Coins className="w-5 h-5 text-amber-400" />;
      default:
        return <CreditCard className="w-5 h-5 text-white" />;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-between selection:bg-[#E8FF1F] selection:text-black font-sans relative overflow-x-hidden">
      {/* Background subtle glow aesthetics */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#E8FF1F]/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none" />

      {/* TOP HEADER */}
      <header className="relative z-10 w-full max-w-4xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-black font-extrabold text-sm shadow-[0_0_15px_rgba(255,255,255,0.2)]">
            <span className="border-2 border-black rounded-sm w-3.5 h-3.5 inline-block"></span>
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-tight text-white">SpendIQ</span>
            <span className="ml-2 text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-zinc-400 border border-white/5">
              VAULT
            </span>
          </div>
        </div>

        {/* Step indicator progress */}
        {activeStep > 1 && (
          <div className="flex items-center gap-2">
            {[2, 3, 4, 5, 6].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  s === activeStep
                    ? 'w-6 bg-[#E8FF1F]'
                    : s < activeStep
                    ? 'w-3 bg-white/60'
                    : 'w-3 bg-white/10'
                }`}
              />
            ))}
          </div>
        )}
      </header>

      {/* MAIN CONTAINER */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8 sm:px-6">
        <div className="w-full max-w-md mx-auto">
          {/* ======================================================== */}
          {/* SCREEN 1: WELCOME / CREATE ACCOUNT & LOGIN */}
          {/* ======================================================== */}
          {activeStep === 1 && (
            <div className="bg-zinc-950/80 border border-white/10 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl animate-fade-in">
              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center mx-auto mb-4 text-[#E8FF1F] shadow-inner">
                  <Shield className="w-6 h-6 text-[#E8FF1F]" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Welcome to SpendIQ
                </h1>
                <p className="text-xs sm:text-sm text-zinc-400 mt-2 leading-relaxed">
                  Your private, real-time financial vault for forex, credit cards, and multi-currency tracking.
                </p>
              </div>

              {/* Mode Toggle Switch */}
              <div className="grid grid-cols-2 p-1 bg-zinc-900/90 rounded-2xl border border-white/10 mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signup');
                    setAuthError(null);
                  }}
                  className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    authMode === 'signup'
                      ? 'bg-white text-black shadow-md'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Create Account
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setAuthError(null);
                  }}
                  className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    authMode === 'login'
                      ? 'bg-white text-black shadow-md'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Log In
                </button>
              </div>

              {/* Error Banner */}
              {authError && (
                <div className="mb-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              {/* Auth Form */}
              <form onSubmit={handleAuthSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="namish@example.com"
                    className="w-full bg-zinc-900/80 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#E8FF1F] transition-all font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-zinc-900/80 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#E8FF1F] transition-all pr-11 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1">Minimum 6 characters. Stored securely.</p>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-2xl bg-[#E8FF1F] hover:bg-[#f2ff5c] text-black font-extrabold text-sm transition-all duration-200 shadow-[0_4px_20px_rgba(232,255,31,0.25)] hover:shadow-[0_4px_25px_rgba(232,255,31,0.4)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>{authMode === 'signup' ? 'Create Account' : 'Log In to SpendIQ'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="relative my-6 text-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <span className="relative bg-zinc-950 px-3 text-[11px] text-zinc-500 uppercase font-mono">
                  Or continue with
                </span>
              </div>

              {/* Google Sign In */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isSubmitting}
                className="w-full py-3 rounded-2xl bg-zinc-900/80 hover:bg-zinc-800 border border-white/10 hover:border-white/20 text-white font-medium text-xs flex items-center justify-center gap-3 transition-all cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              <div className="mt-6 pt-4 border-t border-white/5 text-center">
                <p className="text-[11px] text-zinc-500">
                  Your financial ledger, card balances, and personal budgets are client-side encrypted and private to your account.
                </p>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* SCREEN 2: SECURITY / APP CODE (4-DIGIT PIN KEYPAD) */}
          {/* ======================================================== */}
          {activeStep === 2 && (
            <div className="bg-zinc-950/80 border border-white/10 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl animate-fade-in">
              <PinPad
                mode="setup"
                title="Create your app code"
                subtitle="Enter a 4-digit code to quickly unlock SpendIQ."
                onSuccess={handlePinSuccess}
                onCancel={() => {
                  updateOnboardingStep(2);
                  setActiveStep(3);
                }}
                isVerifying={isSubmitting}
              />
            </div>
          )}

          {/* ======================================================== */}
          {/* SCREEN 3: PERSONAL SETUP ("What should we call you?") */}
          {/* ======================================================== */}
          {activeStep === 3 && (
            <div className="bg-zinc-950/80 border border-white/10 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl animate-fade-in">
              <div className="text-center mb-8">
                <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center mx-auto mb-4 text-[#E8FF1F]">
                  <UserIcon className="w-6 h-6 text-[#E8FF1F]" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  What should we call you?
                </h2>
                <p className="text-xs sm:text-sm text-zinc-400 mt-2 leading-relaxed">
                  We'll use your preferred name to personalise your dashboard and daily alerts.
                </p>
              </div>

              {/* Dynamic greeting preview */}
              <div className="mb-6 p-4 rounded-2xl bg-zinc-900/60 border border-white/5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#E8FF1F]/10 border border-[#E8FF1F]/20 flex items-center justify-center text-[#E8FF1F]">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] text-zinc-500 font-mono uppercase tracking-wider">Dashboard Greeting</div>
                  <div className="text-sm font-bold text-white">
                    Good morning, {displayName.trim() || 'Namish'}.
                  </div>
                </div>
              </div>

              <form onSubmit={handleNameSubmit} className="space-y-6">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Namish"
                    className="w-full bg-zinc-900/90 border border-white/10 rounded-2xl px-5 py-3.5 text-base text-white placeholder-zinc-600 focus:outline-none focus:border-[#E8FF1F] transition-all font-sans font-medium"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !displayName.trim()}
                  className="w-full py-3.5 rounded-2xl bg-[#E8FF1F] hover:bg-[#f2ff5c] text-black font-extrabold text-sm transition-all duration-200 shadow-[0_4px_20px_rgba(232,255,31,0.25)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {/* ======================================================== */}
          {/* SCREEN 4: BANKING METHOD ("How do you usually manage your money?") */}
          {/* ======================================================== */}
          {activeStep === 4 && (
            <div className="bg-zinc-950/80 border border-white/10 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl animate-fade-in">
              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center mx-auto mb-4 text-[#E8FF1F]">
                  <Layers className="w-6 h-6 text-[#E8FF1F]" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  How do you manage money?
                </h2>
                <p className="text-xs sm:text-sm text-zinc-400 mt-2 leading-relaxed">
                  Select your active financial channels. We've preselected your existing forex and credit cards.
                </p>
              </div>

              {/* Selectable Cards List */}
              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {BANKING_METHOD_OPTIONS.map((opt) => {
                  const isSelected = selectedMethods.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => toggleMethod(opt.id)}
                      className={`w-full p-3.5 rounded-2xl border text-left transition-all duration-150 flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-zinc-900/90 border-[#E8FF1F]/50 shadow-[0_0_15px_rgba(232,255,31,0.08)]'
                          : 'bg-zinc-900/30 border-white/5 hover:border-white/15'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                            isSelected
                              ? 'bg-zinc-800 border-[#E8FF1F]/30'
                              : 'bg-zinc-900 border-white/5'
                          }`}
                        >
                          {getMethodIcon(opt.iconName)}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white">{opt.label}</div>
                          <div className="text-[11px] text-zinc-400">{opt.sublabel}</div>
                        </div>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                          isSelected
                            ? 'bg-[#E8FF1F] border-[#E8FF1F] text-black'
                            : 'border-white/20 bg-transparent'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleBankingSubmit}
                  disabled={isSubmitting || selectedMethods.length === 0}
                  className="w-full py-3.5 rounded-2xl bg-[#E8FF1F] hover:bg-[#f2ff5c] text-black font-extrabold text-sm transition-all duration-200 shadow-[0_4px_20px_rgba(232,255,31,0.25)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* SCREEN 5: CURRENCY & FINANCIAL PREFERENCES */}
          {/* ======================================================== */}
          {activeStep === 5 && (
            <div className="bg-zinc-950/80 border border-white/10 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl animate-fade-in">
              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center mx-auto mb-4 text-[#E8FF1F]">
                  <Coins className="w-6 h-6 text-[#E8FF1F]" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Currency Preferences
                </h2>
                <p className="text-xs sm:text-sm text-zinc-400 mt-2 leading-relaxed">
                  SpendIQ provides real-time dual-currency conversions across Japan (JPY) and India (INR).
                </p>
              </div>

              {/* Primary Currency */}
              <div className="mb-5">
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  Primary Spending Currency
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {(['JPY', 'INR', 'USD'] as const).map((curr) => {
                    const isSelected = primaryCurrency === curr;
                    return (
                      <button
                        key={curr}
                        type="button"
                        onClick={() => setPrimaryCurrency(curr)}
                        className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#E8FF1F] text-black border-[#E8FF1F] font-bold shadow-md'
                            : 'bg-zinc-900/60 border-white/10 text-white hover:border-white/20'
                        }`}
                      >
                        <div className="text-sm font-extrabold">{curr}</div>
                        <div className={`text-[10px] ${isSelected ? 'text-black/80' : 'text-zinc-500'}`}>
                          {curr === 'JPY' ? 'Japanese Yen ¥' : curr === 'INR' ? 'Indian Rupee ₹' : 'US Dollar $'}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Secondary Reference Currency */}
              <div className="mb-6">
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  Secondary Reference Currency
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {(['INR', 'JPY', 'USD'] as const).map((curr) => {
                    const isSelected = secondaryCurrency === curr;
                    return (
                      <button
                        key={curr}
                        type="button"
                        onClick={() => setSecondaryCurrency(curr)}
                        className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-white text-black border-white font-bold shadow-md'
                            : 'bg-zinc-900/60 border-white/10 text-white hover:border-white/20'
                        }`}
                      >
                        <div className="text-sm font-extrabold">{curr}</div>
                        <div className={`text-[10px] ${isSelected ? 'text-black/80' : 'text-zinc-500'}`}>
                          {curr === 'INR' ? 'Indian Rupee ₹' : curr === 'JPY' ? 'Japanese Yen ¥' : 'US Dollar $'}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Exchange info preview */}
              <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-white/5 flex items-center justify-between text-xs text-zinc-400 mb-6">
                <span>Active Conversion Rate:</span>
                <span className="font-mono font-bold text-white">100 JPY ≈ ₹55.20 INR</span>
              </div>

              <button
                type="button"
                onClick={handleCurrencySubmit}
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-2xl bg-[#E8FF1F] hover:bg-[#f2ff5c] text-black font-extrabold text-sm transition-all duration-200 shadow-[0_4px_20px_rgba(232,255,31,0.25)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ======================================================== */}
          {/* SCREEN 6: YOU'RE ALL SET / FINISH */}
          {/* ======================================================== */}
          {activeStep === 6 && (
            <div className="bg-zinc-950/80 border border-white/10 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl animate-fade-in text-center">
              <div className="w-16 h-16 rounded-3xl bg-[#E8FF1F]/10 border border-[#E8FF1F]/30 flex items-center justify-center mx-auto mb-5 text-[#E8FF1F] shadow-[0_0_30px_rgba(232,255,31,0.2)]">
                <CheckCircle2 className="w-8 h-8 text-[#E8FF1F]" />
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                You're all set, {displayName.trim() || 'Namish'}!
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 mt-2 leading-relaxed">
                {(currentUser?.email || '').toLowerCase() === 'namishoberoi2008@gmail.com'
                  ? 'Your private SpendIQ vault is ready with your verified transactions and active card balances.'
                  : 'Your private SpendIQ vault is ready to start tracking your cards and expenses.'}
              </p>

              {/* Setup summary badge cards */}
              <div className="grid grid-cols-2 gap-3 my-6 text-left">
                <div className="p-3.5 rounded-2xl bg-zinc-900/70 border border-white/5">
                  <div className="text-[10px] text-zinc-500 font-mono uppercase">Ledger Sync</div>
                  <div className="text-sm font-bold text-emerald-400 mt-0.5">
                    {(currentUser?.email || '').toLowerCase() === 'namishoberoi2008@gmail.com'
                      ? '66 Transactions'
                      : 'Active & Private'}
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">
                    {(currentUser?.email || '').toLowerCase() === 'namishoberoi2008@gmail.com'
                      ? 'ICICI Forex & Axis Card'
                      : 'Isolated User Vault'}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-zinc-900/70 border border-white/5">
                  <div className="text-[10px] text-zinc-500 font-mono uppercase">App Security</div>
                  <div className="text-sm font-bold text-white mt-0.5">4-Digit PIN</div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">Encrypted Lock Screen</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-zinc-900/70 border border-white/5">
                  <div className="text-[10px] text-zinc-500 font-mono uppercase">Primary Currency</div>
                  <div className="text-sm font-bold text-white mt-0.5">{primaryCurrency}</div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">Secondary: {secondaryCurrency}</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-zinc-900/70 border border-white/5">
                  <div className="text-[10px] text-zinc-500 font-mono uppercase">Payment Methods</div>
                  <div className="text-sm font-bold text-white mt-0.5">{selectedMethods.length} Channels</div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">Forex, Suica, Cards</div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleFinish}
                disabled={isSubmitting}
                className="w-full py-4 rounded-2xl bg-[#E8FF1F] hover:bg-[#f2ff5c] text-black font-extrabold text-base transition-all duration-200 shadow-[0_6px_30px_rgba(232,255,31,0.3)] hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </main>

      {/* FOOTER */}
      <footer className="relative z-10 py-4 text-center text-xs text-zinc-600">
        SpendIQ Secure Financial Architecture &bull; Client-Side Encrypted
      </footer>
    </div>
  );
};
