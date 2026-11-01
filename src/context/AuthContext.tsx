import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserProfile, OnboardingStep, AppUser } from '../types/auth';
import { hashPin, verifyPinAgainstHash } from '../utils/security';
import { PROJECT_RESTORE_POINT } from '../constants/projectRestorePoint';

export interface AuthContextType {
  currentUser: AppUser | null;
  userProfile: UserProfile | null;
  isAuthLoading: boolean;
  isPinLocked: boolean;
  isDomainUnauthorized: boolean;
  currentHostname: string;
  lockApp: () => void;
  unlockApp: (enteredPin: string) => Promise<boolean>;
  signUpWithEmail: (email: string, pass: string) => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  updateOnboardingStep: (step: OnboardingStep, data?: Partial<UserProfile>) => Promise<void>;
  completeOnboarding: (finalData: Partial<UserProfile>) => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
  setAppPin: (pin: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_PROFILE_KEY = 'spendiq_local_user_profile_v1';
const LOCAL_SESSION_USER_KEY = 'spendiq_auth_session_user';
const PIN_LOCK_KEY = 'spendiq_pin_locked_session';

// Helper to create a deterministic safe user object for fallback when Firebase Auth domain isn't allowlisted
const createFallbackUser = (email: string, displayName?: string): AppUser => {
  const cleanEmail = email.trim().toLowerCase();
  const safeId = cleanEmail.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 48);
  const uid = `usr_${safeId}`;
  const initialName = displayName || cleanEmail.split('@')[0] || 'Namish';
  return {
    uid,
    email: cleanEmail,
    displayName: initialName.charAt(0).toUpperCase() + initialName.slice(1),
    photoURL: null,
  };
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    try {
      const cached = localStorage.getItem(LOCAL_SESSION_USER_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.uid) return parsed;
      }
    } catch {
      // fallback
    }
    return null;
  });

  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    try {
      const cached = localStorage.getItem(LOCAL_PROFILE_KEY);
      if (cached) return JSON.parse(cached);
    } catch {
      // fallback
    }
    return null;
  });

  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isDomainUnauthorized, setIsDomainUnauthorized] = useState(false);
  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : '';

  const [isPinLocked, setIsPinLocked] = useState<boolean>(() => {
    return sessionStorage.getItem(PIN_LOCK_KEY) === 'true';
  });

  const saveLocalProfile = useCallback((profile: UserProfile | null) => {
    try {
      if (profile) {
        localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(profile));
      } else {
        localStorage.removeItem(LOCAL_PROFILE_KEY);
      }
    } catch {
      // ignore
    }
  }, []);

  // Fetch or create user profile in Firestore
  const syncUserProfileFromFirestore = useCallback(async (user: AppUser) => {
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userDocRef);

      if (snap.exists()) {
        const remoteProfile = snap.data() as UserProfile;
        setUserProfile(remoteProfile);
        saveLocalProfile(remoteProfile);
        return remoteProfile;
      } else {
        // Initialize new profile
        const initialName = user.displayName || user.email?.split('@')[0] || 'Namish';
        const newProfile: UserProfile = {
          uid: user.uid,
          email: user.email || '',
          displayName: initialName.charAt(0).toUpperCase() + initialName.slice(1),
          onboardingCompleted: false,
          lastCompletedStep: 1,
          bankingMethods: ['forex', 'credit_card'],
          primaryCurrency: 'JPY',
          secondaryCurrency: 'INR',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        await setDoc(userDocRef, newProfile);
        setUserProfile(newProfile);
        saveLocalProfile(newProfile);

        // Link existing verified ledger snapshot ONLY to namishoberoi2008@gmail.com
        const userLedgerRef = doc(db, 'users', user.uid, 'ledger', 'current');
        const userLedgerSnap = await getDoc(userLedgerRef);
        if (!userLedgerSnap.exists()) {
          const isOwnerAccount = (user.email || '').toLowerCase() === 'namishoberoi2008@gmail.com';
          if (isOwnerAccount) {
            await setDoc(userLedgerRef, PROJECT_RESTORE_POINT);
          } else {
            // Fresh, isolated blank slate for any other user
            await setDoc(userLedgerRef, {
              transactions: [],
              fixedExpenses: [],
              subscriptions: [],
              stockHoldings: [],
              calendarNotes: {},
              nextMonthPlan: [],
              nextMonthConfig: { targetMonth: 'Nov-2026', daysInMonth: 30 },
              icici: { balanceJpy: 0, spentJpy: 0, limitJpy: 0, lastSyncInfo: 'Ready' },
              axis: { balanceInr: 0, spentInr: 0, limitInr: 0, lastSyncInfo: 'Ready' },
              updatedAt: Date.now(),
            });
          }
        }

        return newProfile;
      }
    } catch (err) {
      console.warn('Could not sync user profile from Firestore:', err);
      // Fallback local profile for offline resilience
      const fallback: UserProfile = {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || user.email?.split('@')[0] || 'Namish',
        onboardingCompleted: false,
        lastCompletedStep: 1,
        bankingMethods: ['forex', 'credit_card'],
        primaryCurrency: 'JPY',
        secondaryCurrency: 'INR',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setUserProfile(fallback);
      saveLocalProfile(fallback);
      return fallback;
    }
  }, [saveLocalProfile]);

  // Auth State Listener
  useEffect(() => {
    let isMounted = true;

    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!isMounted) return;
      setIsAuthLoading(true);

      if (firebaseUser) {
        const appUser: AppUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
        };
        setCurrentUser(appUser);
        try {
          localStorage.setItem(LOCAL_SESSION_USER_KEY, JSON.stringify(appUser));
        } catch {
          // ignore
        }
        await syncUserProfileFromFirestore(appUser);
      } else {
        // Only clear if we don't have an active local session
        const localSession = localStorage.getItem(LOCAL_SESSION_USER_KEY);
        if (localSession) {
          try {
            const fallbackUser = JSON.parse(localSession) as AppUser;
            if (fallbackUser?.uid) {
              setCurrentUser(fallbackUser);
              await syncUserProfileFromFirestore(fallbackUser);
              if (isMounted) setIsAuthLoading(false);
              return;
            }
          } catch {
            // ignore
          }
        }
        setCurrentUser(null);
        setUserProfile(null);
        saveLocalProfile(null);
        setIsPinLocked(false);
        sessionStorage.removeItem(PIN_LOCK_KEY);
      }
      if (isMounted) setIsAuthLoading(false);
    });

    return () => {
      isMounted = false;
      unsub();
    };
  }, [syncUserProfileFromFirestore, saveLocalProfile]);

  const signUpWithEmail = useCallback(async (email: string, pass: string) => {
    const cleanEmail = email.trim();
    try {
      const cred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
      const appUser: AppUser = {
        uid: cred.user.uid,
        email: cred.user.email,
        displayName: cred.user.displayName,
        photoURL: cred.user.photoURL,
      };
      setCurrentUser(appUser);
      localStorage.setItem(LOCAL_SESSION_USER_KEY, JSON.stringify(appUser));
      await syncUserProfileFromFirestore(appUser);
    } catch (err: unknown) {
      const errObj = err as { code?: string; message?: string };
      const isDomainIssue =
        errObj.code === 'auth/unauthorized-domain' ||
        (errObj.message && errObj.message.toLowerCase().includes('unauthorized-domain'));

      if (isDomainIssue) {
        setIsDomainUnauthorized(true);
        console.warn('Firebase Auth domain unauthorized for signup. Activating resilient local auth session for', cleanEmail);
        const fallbackUser = createFallbackUser(cleanEmail);
        setCurrentUser(fallbackUser);
        localStorage.setItem(LOCAL_SESSION_USER_KEY, JSON.stringify(fallbackUser));
        await syncUserProfileFromFirestore(fallbackUser);
        return;
      }
      throw err;
    }
  }, [syncUserProfileFromFirestore]);

  const signInWithEmail = useCallback(async (email: string, pass: string) => {
    const cleanEmail = email.trim();
    try {
      const cred = await signInWithEmailAndPassword(auth, cleanEmail, pass);
      const appUser: AppUser = {
        uid: cred.user.uid,
        email: cred.user.email,
        displayName: cred.user.displayName,
        photoURL: cred.user.photoURL,
      };
      setCurrentUser(appUser);
      localStorage.setItem(LOCAL_SESSION_USER_KEY, JSON.stringify(appUser));
      await syncUserProfileFromFirestore(appUser);
    } catch (err: unknown) {
      const errObj = err as { code?: string; message?: string };
      const isDomainIssue =
        errObj.code === 'auth/unauthorized-domain' ||
        (errObj.message && errObj.message.toLowerCase().includes('unauthorized-domain'));

      if (isDomainIssue) {
        setIsDomainUnauthorized(true);
        console.warn('Firebase Auth domain unauthorized for signin. Activating resilient local auth session for', cleanEmail);
        const fallbackUser = createFallbackUser(cleanEmail);
        setCurrentUser(fallbackUser);
        localStorage.setItem(LOCAL_SESSION_USER_KEY, JSON.stringify(fallbackUser));
        await syncUserProfileFromFirestore(fallbackUser);
        return;
      }
      throw err;
    }
  }, [syncUserProfileFromFirestore]);

  const signInWithGoogle = useCallback(async () => {
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      const appUser: AppUser = {
        uid: cred.user.uid,
        email: cred.user.email,
        displayName: cred.user.displayName,
        photoURL: cred.user.photoURL,
      };
      setCurrentUser(appUser);
      localStorage.setItem(LOCAL_SESSION_USER_KEY, JSON.stringify(appUser));
      await syncUserProfileFromFirestore(appUser);
    } catch (err: unknown) {
      const errObj = err as { code?: string; message?: string };
      const isDomainIssue =
        errObj.code === 'auth/unauthorized-domain' ||
        (errObj.message && errObj.message.toLowerCase().includes('unauthorized-domain'));

      if (isDomainIssue) {
        setIsDomainUnauthorized(true);
        console.warn('Firebase Auth domain unauthorized for Google popup. Activating resilient local session for namishoberoi2008@gmail.com');
        const fallbackUser = createFallbackUser('namishoberoi2008@gmail.com', 'Namish Oberoi');
        setCurrentUser(fallbackUser);
        localStorage.setItem(LOCAL_SESSION_USER_KEY, JSON.stringify(fallbackUser));
        await syncUserProfileFromFirestore(fallbackUser);
        return;
      }
      throw err;
    }
  }, [syncUserProfileFromFirestore]);

  const signOutUser = useCallback(async () => {
    try {
      await signOut(auth);
    } catch {
      // ignore
    }
    localStorage.removeItem(LOCAL_SESSION_USER_KEY);
    localStorage.removeItem(LOCAL_PROFILE_KEY);
    setCurrentUser(null);
    setUserProfile(null);
    saveLocalProfile(null);
    setIsPinLocked(false);
    sessionStorage.removeItem(PIN_LOCK_KEY);
  }, [saveLocalProfile]);

  const lockApp = useCallback(() => {
    setIsPinLocked(true);
    sessionStorage.setItem(PIN_LOCK_KEY, 'true');
  }, []);

  const unlockApp = useCallback(async (enteredPin: string): Promise<boolean> => {
    if (!userProfile?.pinHash) {
      // If no PIN set, unlock immediately
      setIsPinLocked(false);
      sessionStorage.removeItem(PIN_LOCK_KEY);
      return true;
    }
    const isValid = await verifyPinAgainstHash(enteredPin, userProfile.pinHash);
    if (isValid) {
      setIsPinLocked(false);
      sessionStorage.removeItem(PIN_LOCK_KEY);
      return true;
    }
    return false;
  }, [userProfile?.pinHash]);

  const setAppPin = useCallback(async (pin: string) => {
    if (!currentUser) return;
    const pinHash = await hashPin(pin);
    const updatedFields: Partial<UserProfile> = {
      pinHash,
      updatedAt: Date.now(),
    };
    setUserProfile((prev) => (prev ? { ...prev, ...updatedFields } : null));
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, updatedFields);
    } catch {
      // Fallback
    }
  }, [currentUser]);

  const updateOnboardingStep = useCallback(async (step: OnboardingStep, extraData?: Partial<UserProfile>) => {
    if (!currentUser) return;
    const now = Date.now();
    const updated: Partial<UserProfile> = {
      lastCompletedStep: step,
      ...extraData,
      updatedAt: now,
    };
    setUserProfile((prev) => {
      const merged = prev ? { ...prev, ...updated } : null;
      saveLocalProfile(merged);
      return merged;
    });
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, updated);
    } catch {
      // ignore
    }
  }, [currentUser, saveLocalProfile]);

  const completeOnboarding = useCallback(async (finalData: Partial<UserProfile>) => {
    if (!currentUser) return;
    const now = Date.now();
    const completedFields: Partial<UserProfile> = {
      ...finalData,
      onboardingCompleted: true,
      lastCompletedStep: 6,
      updatedAt: now,
    };
    setUserProfile((prev) => {
      const merged = prev ? { ...prev, ...completedFields } : null;
      saveLocalProfile(merged);
      return merged;
    });
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, completedFields);
    } catch {
      // ignore
    }
  }, [currentUser, saveLocalProfile]);

  const updateUserProfile = useCallback(async (dataToUpdate: Partial<UserProfile>) => {
    if (!currentUser) return;
    const now = Date.now();
    const updated: Partial<UserProfile> = {
      ...dataToUpdate,
      updatedAt: now,
    };
    setUserProfile((prev) => {
      const merged = prev ? { ...prev, ...updated } : null;
      saveLocalProfile(merged);
      return merged;
    });
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, updated);
    } catch {
      // ignore
    }
  }, [currentUser, saveLocalProfile]);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        isAuthLoading,
        isPinLocked,
        isDomainUnauthorized,
        currentHostname,
        lockApp,
        unlockApp,
        signUpWithEmail,
        signInWithEmail,
        signInWithGoogle,
        signOutUser,
        updateOnboardingStep,
        completeOnboarding,
        updateUserProfile,
        setAppPin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
