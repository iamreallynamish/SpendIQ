# SpendIQ Onboarding & Authentication System (Completed)

A minimal, secure, and cohesive onboarding and authentication flow for SpendIQ inspired by the modern dark aesthetic reference, providing real Firebase Authentication, a 4-digit security PIN unlock pad, personal profile personalization, and banking method setup while preserving the existing family finance dashboard.

## Status: Completed & Verified

- [x] **Firebase Blueprint & Security Rules**: Configured `/users/{userId}` and `/users/{userId}/ledger/{ledgerId}` with strict `isOwner(userId)` rules deployed to Firestore.
- [x] **Security Hashing**: SHA-256 client-side PIN hashing and validation (`src/utils/security.ts`).
- [x] **Authentication & Session Context**: `AuthContext.tsx` handles email/password signup & login, Google Sign-In, profile state sync, automated migration linking existing 66 transactions, and PIN locking/unlocking.
- [x] **Reference-Inspired PinPad Component**: `PinPad.tsx` with 4 circular indicator dots that animate on entry, large 3x4 circular keypad buttons, backspace button, shake error feedback, and confirmation step.
- [x] **Complete 6-Screen Onboarding Flow**: `OnboardingFlow.tsx` implementing Screen 1 (Welcome & Auth), Screen 2 (Security PIN Pad), Screen 3 ("What should we call you?"), Screen 4 ("How do you usually manage your money?"), Screen 5 (Currency Preferences), Screen 6 ("You're all set").
- [x] **PIN Unlock Overlay**: `PinUnlockOverlay.tsx` protecting locked sessions with clean PIN entry and password fallback.
- [x] **Header & User Profile Modal**: Dynamic greeting ("Good morning, {name}"), profile pill button, quick "Lock Screen" button, and modal for managing profile/currencies/PIN.
- [x] **Compilation & Testing**: Verified with `compile_applet` and `lint_applet` with zero build or TypeScript errors.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following user preferences were confirmed in Phase 1 and govern the system architecture:
> - **Existing Data Linkage**: When you create your account or sign in, your existing 66 transactions, cards, and budget data will be automatically linked to your authenticated user account in Firestore (`users/{uid}/financeData`), ensuring no records are lost.
> - **4-Digit App PIN Role**: The 4-digit PIN is configured as a quick unlock and account security barrier used when manually locking the app or switching accounts, while standard sessions stay securely remembered.
> - **Authentication Options**: The welcome screen offers both Email/Password authentication and Google Sign-In for flexible, one-tap access.

---

## 1. Overview & Core Concept

- **What It Does**: Introduces a polished 6-screen onboarding experience that guides new users through account creation, 4-digit security PIN setup (featuring a clean circular numeric keypad), personal profile personalization ("What should we call you?"), banking method selection, and currency confirmation, landing seamlessly on the existing dashboard.
- **Target Audience / Persona**: Family finance managers (Dad in India & Son in Japan) needing isolated, authenticated account ownership while maintaining real-time multi-device sync and quick biometric-style PIN protection.
- **Key Value**: Replaces unauthenticated browser state with persistent, cloud-synced account profiles, protects private financial balances, and delivers a welcoming, friction-free setup.

---

## 2. User Experience & Visual Design

### Key User Flows

```
[Screen 1: Welcome & Auth]
   ├── Sign Up (Email + Password or Google)
   └── Log In (Existing Credentials)
         │
         ▼
[Screen 2: Security PIN Pad]
   ├── Enter 4-Digit PIN (Circular Numeric Pad)
   └── Confirm 4-Digit PIN (Verification Match)
         │
         ▼
[Screen 3: Personal Setup]
   └── "What should we call you?" (Name Input, e.g. "Namish")
         │
         ▼
[Screen 4: Banking Methods]
   └── Multi-select cards: Forex / Prepaid, Credit Card, Bank Account, Cash
         │
         ▼
[Screen 5: Currency Preferences]
   └── Primary (JPY) & Secondary (INR / USD) currency selection
         │
         ▼
[Screen 6: Ready to Go]
   └── "You're all set." → "Go to Dashboard →"
         │
         ▼
[Existing Dashboard Workspace]
```

### Returning User Logic
1. **Returning Authenticated User (Completed Onboarding)**: Directly restores the session and enters the dashboard. If the user clicked "Lock App" in the top bar or header, presents the clean circular PIN unlock screen.
2. **Incomplete Onboarding**: Automatically resumes from their last completed step stored in Firestore (`lastCompletedStep`).
3. **Session Sign Out**: Clears local session and returns to Screen 1.

### Visual Identity & Theme
- **Aesthetic Direction**: High-end dark minimalism with generous negative space, centered layouts, and subtle tactile response.
- **Color Palette & Theme Tokens**:
  - Neutral Canvas: Deep pure black (`#000000` / `#090A0D`)
  - Elevated Surfaces: Charcoal card containers (`#0F1116` with hairline border `rgba(255, 255, 255, 0.08)`)
  - High-Intent Accent: SpendIQ signature lime yellow (`#E8FF1F`) for primary CTA buttons and active indicator states
  - Subtle Accents: Emerald (`#10B981`) for completed steps and verified security states
  - Typography: Crisp sans display hierarchy matching the existing dashboard, with tabular numbers for the PIN pad
- **Component Styling**:
  - Four circular PIN indicator dots (`w-3.5 h-3.5 rounded-full`) that smoothly fill with accent color as numbers are tapped.
  - Large circular numeric keypad keys (`w-16 h-16 rounded-full border border-white/10 bg-white/[0.03] hover:bg-white/[0.1] active:scale-95 transition-all text-xl font-medium`).
  - Multi-select banking method cards with quiet icon outlines and subtle glowing active borders.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Firebase Auth with Email/Password & Google Sign-In**
  - *Chosen Approach*: Use real Firebase Authentication (`createUserWithEmailAndPassword`, `signInWithEmailAndPassword`, `signInWithPopup` with GoogleAuthProvider).
  - *Why*: Direct production integration with existing Firebase applet config and Firestore security rules. No mock authentication or vulnerable plain-text credentials.
  - *Alternatives Considered*: Pure localStorage mock auth (rejected because it does not provide true cross-device synchronization or account isolation).

- **Decision 2: User-Isolated Firestore Schema with Automatic Data Migration**
  - *Chosen Approach*: Store user profile and financial state in `users/{uid}` and `users/{uid}/ledger/current`. When a new account is registered, automatically seed it from the existing master ledger snapshot so the user does not start with an empty screen or lose the 66 active transactions.
  - *Why*: Ensures strict per-user database privacy while preserving the user's hard-earned data seamlessly.

- **Decision 3: Client-Side Hash for App PIN**
  - *Chosen Approach*: Salt and hash the 4-digit PIN before persisting to `users/{uid}.appPinHash` (never store plain PIN numbers).
  - *Why*: Prevents plain PIN exposure even if Firestore documents are inspected.

- **Decision 4: Seamless Header Lock & Profile Management**
  - *Chosen Approach*: Add a profile pill and "Lock App" button in the top navigation bar so the user can test the PIN unlock screen at any time or update their name, banking preferences, and currency from a new Profile modal.

---

## 4. Technical Architecture & Data Strategy

### System Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                        SPENDIQ APPLICATION                             │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│   ┌────────────────────────┐         ┌─────────────────────────────┐   │
│   │   AuthContext / State  │         │     FinanceContext          │   │
│   │  - currentUser (Auth)  │────────>│  - data (User Ledger)       │   │
│   │  - userProfile (Doc)   │         │  - transactions / cards     │   │
│   │  - isPinLocked (Bool)  │         │  - cloudSync / recalculate  │   │
│   └───────────┬────────────┘         └──────────────┬──────────────┘   │
│               │                                     │                  │
│               ▼                                     ▼                  │
│   ┌──────────────────────────────────────────────────────────────┐     │
│   │                     Screen Routing Gate                      │     │
│   │  - Unauthenticated? ────> <OnboardingScreen step={1} />      │     │
│   │  - Onboarding pending? ─> <OnboardingScreen step={saved} />  │     │
│   │  - PIN locked? ─────────> <PinLockScreen />                  │     │
│   │  - Ready & Verified? ───> <MainLayout /> (Existing Dashboard)│     │
│   └──────────────────────────────────────────────────────────────┘     │
│                                                                        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
       ┌─────────────────────────────────────────────────────────┐
       │             Google Cloud Firebase Services              │
       │  - Firebase Auth: Email/Pass & Google Sign-In           │
       │  - Firestore: users/{uid} & users/{uid}/ledger/current  │
       └─────────────────────────────────────────────────────────┘
```

### Data Model & Schema Definitions

```typescript
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  onboardingCompleted: boolean;
  lastCompletedStep: number; // 1 to 6
  pinHash?: string;
  bankingMethods: string[]; // ['forex', 'credit', 'bank', 'cash', ...]
  primaryCurrency: 'JPY' | 'INR' | 'USD';
  secondaryCurrency?: 'JPY' | 'INR' | 'USD';
  createdAt: number;
  updatedAt: number;
}
```

### Interactive Components to Implement
1. `src/context/AuthContext.tsx`: Wraps Firebase Auth state (`onAuthStateChanged`), loads user profile from Firestore, manages PIN verification, session locking, and onboarding step transitions.
2. `src/components/onboarding/OnboardingFlow.tsx`: The primary container rendering the 6 focused steps with centered layouts, progress indicators, and smooth step transitions.
3. `src/components/onboarding/PinPad.tsx`: Reusable circular 4-digit PIN pad component with clear tactile buttons, backspace icon, error shake feedback, and confirmation step.
4. `src/components/onboarding/BankingMethodStep.tsx`: Grid of rounded selectable banking cards with active accent borders and custom icons.
5. `src/components/modals/UserProfileModal.tsx`: Accessible from the top header to view/update profile name, banking preferences, and security PIN anytime.
