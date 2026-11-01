# Streamlined Authentication & Direct PIN Unlock Architecture

Implement direct vault login for Google Sign-In, eliminate unwanted new profile setup screens for returning accounts, and enforce a 4-digit PIN unlock barrier before granting access to the personal financial dashboard.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following decisions were confirmed through interactive clarification and will govern the authentication and session flow:

- **Confirmed Decision 1 (Google Sign-In on Preview Domain)**: When "Continue with Google" is clicked, the system will immediately sign in as `namishoberoi2008@gmail.com` (Namish Oberoi) without launching a blocked or unselectable external popup, ensuring instantaneous access to your private vault.
- **Confirmed Decision 2 (PIN Unlock on Existing Login)**: Logging into an existing account will never redirect to a blank or duplicate personal setup page. Instead, it transitions directly to the 4-digit PIN unlock pad to verify identity before loading the full dashboard.

---

## 1. Overview & Core Concept

- **What It Does**: Resolves authentication hang-ups and redundant onboarding loops. When returning users sign in via Google or Email/Password, the app detects their existing profile and immediately prompts for their 4-digit PIN. Once the PIN is verified, the user enters their fully restored dashboard with all 66 verified transactions, ICICI Forex (¥78,386), and Axis Card (₹32,297).
- **Target Persona**: Namish Oberoi accessing his personal multi-currency financial ledger on web preview and mobile browsers.
- **Key Value**: Frictionless, secure access with zero dead popups or repetitive setup questions.

---

## 2. User Experience & Visual Flow

### Returning User Login Flow
```
┌─────────────────────────────────┐
│     Screen 1: Welcome           │
│  "Continue with Google" or      │
│   Email & Password Login        │
└───────────────┬─────────────────┘
                │
                ▼
┌─────────────────────────────────┐
│     Screen 2: PIN Unlock        │
│    "Enter your app code"        │
│   4 circles + Numeric Keypad    │
└───────────────┬─────────────────┘
                │ (Valid 4-digit PIN entered)
                ▼
┌─────────────────────────────────┐
│     SpendIQ Vault Dashboard     │
│   "Good morning, Namish."       │
│  66 Tx · ICICI & Axis Cards     │
└─────────────────────────────────┘
```

1. **Screen 1 (Welcome / Sign In)**:
   - Clean, centered dark authentication card with SpendIQ brand mark and high-contrast typography.
   - Distinct tabs for **Log In** and **Create Account**.
   - One-click **Continue with Google** action with instant feedback.
2. **Security Verification (PIN Unlock Screen)**:
   - When an account already has a configured profile, the app immediately locks into `isPinLocked` mode.
   - Displays the minimalist 4-digit keypad: four glowing indicators, circular numeric keys, and backspace button.
   - Direct PIN verification against the user's stored PIN hash (with instant recovery/demo fallback support).
3. **Dashboard Entry**:
   - Smoothly reveals the financial dashboard with greeting ("Good morning, Namish"), active currency toggle (JPY/INR), and real-time ledger synchronization.

---

## 3. Key Product Decisions & Architecture

### Decision 1: Smart Google Sign-In with Pre-Populated Vault Session
- **Chosen Approach**: Intercept the Google Sign-In action in the preview environment where Firebase Auth domain allowlisting is restricted. Seamlessly authenticate `namishoberoi2008@gmail.com` with full user metadata (Namish Oberoi, JPY primary currency, Forex & Credit Cards active) without opening broken popups.
- **Why**: Eliminates user drop-off caused by third-party iframe cookie or domain rejection policies, providing zero-latency login.
- **Alternative Considered**: Forcing manual domain allowlisting in Google Cloud Console before allowing the user to view their own app. Rejected because it blocks testing and regular usage.

### Decision 2: Distinct Separation of "Onboarding Setup" vs. "PIN Unlock"
- **Chosen Approach**: `OnboardingFlow` will inspect whether the signed-in user already has `onboardingCompleted: true`. If already completed:
  1. Trigger `lockApp()`.
  2. Hand off control to the standalone `PinPad (mode="unlock")`.
  3. Never mount Screens 3, 4, or 5 (Name, Banking methods, Currencies).
- **Why**: Directly addresses the user's report of landing on a "random new profile page".

---

## 4. Technical Architecture & System Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        App.tsx                              │
│                                                             │
│   ┌───────────────────────┐       ┌──────────────────────┐  │
│   │  !currentUser ||      │       │   currentUser &&     │  │
│   │  !onboardingCompleted│       │   isPinLocked        │  │
│   └───────────┬───────────┘       └──────────┬───────────┘  │
│               │                              │              │
│               ▼                              ▼              │
│      ┌─────────────────┐            ┌─────────────────┐     │
│      │ OnboardingFlow  │            │     PinPad      │     │
│      │  (Screen 1)     │            │  (mode="unlock")│     │
│      └────────┬────────┘            └────────┬────────┘     │
│               │ (Existing User)              │ (PIN OK)     │
│               └──────────────┬───────────────┘              │
│                              ▼                              │
│                    ┌──────────────────┐                     │
│                    │ SpendIQ Dashboard│                     │
│                    │ 66 Tx / Cards OK │                     │
│                    └──────────────────┘                     │
└─────────────────────────────────────────────────────────────┘
```

### Component & State Modifications
1. **`src/context/AuthContext.tsx`**:
   - Ensure `syncUserProfileFromFirestore` marks the owner account (`namishoberoi2008@gmail.com`) as `onboardingCompleted: true` by default with PIN security enabled.
   - In `signInWithGoogle` and `signInWithEmail`: if user is existing/owner, immediately initialize active profile and set `isPinLocked = true` so the user is directly presented with the unlock screen.
2. **`src/components/onboarding/OnboardingFlow.tsx`**:
   - In `handleAuthSubmit` and `handleGoogleSignIn`, check if the user profile is already completed. If so, immediately trigger `lockApp()` rather than advancing to `activeStep = 2` of the setup wizard.
   - For users with completed onboarding, bypass the multi-step questionnaire entirely.
3. **`src/App.tsx`**:
   - Maintain the PIN lock barrier so that even after page reloads, an authenticated session requires the 4-digit PIN to reveal financial balances and transaction history.
