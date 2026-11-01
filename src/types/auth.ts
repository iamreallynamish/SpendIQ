export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  onboardingCompleted: boolean;
  lastCompletedStep: number; // 1 to 6
  pinHash?: string;
  bankingMethods: string[];
  primaryCurrency: 'JPY' | 'INR' | 'USD';
  secondaryCurrency?: 'JPY' | 'INR' | 'USD';
  createdAt: number;
  updatedAt: number;
}

export type OnboardingStep = 1 | 2 | 3 | 4 | 5 | 6;

export interface BankingOptionItem {
  id: string;
  label: string;
  sublabel: string;
  iconName: 'credit-card' | 'bank' | 'wallet' | 'landmark' | 'globe' | 'circle-dollar';
}

export const BANKING_METHOD_OPTIONS: BankingOptionItem[] = [
  {
    id: 'forex',
    label: 'Forex / Prepaid Card',
    sublabel: 'e.g. ICICI Forex Prepaid XX0817 (Japan Living)',
    iconName: 'globe',
  },
  {
    id: 'credit_card',
    label: 'Credit Card',
    sublabel: 'e.g. Axis Bank Credit Card XX7117',
    iconName: 'credit-card',
  },
  {
    id: 'debit_card',
    label: 'Debit Card',
    sublabel: 'Daily point-of-sale taps & ATM withdrawals',
    iconName: 'credit-card',
  },
  {
    id: 'bank_account',
    label: 'Bank Account / UPI',
    sublabel: 'Direct wire transfers & monthly commitments',
    iconName: 'landmark',
  },
  {
    id: 'transit_ic',
    label: 'Transit IC / Mobile Suica',
    sublabel: 'Suica, Pasmo, Icoca tap payments & transit',
    iconName: 'wallet',
  },
  {
    id: 'cash',
    label: 'Cash & ATM Reserves',
    sublabel: 'Seven Bank & local ATM physical cash',
    iconName: 'circle-dollar',
  },
];
