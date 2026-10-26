export type Role = 'DAD' | 'SON';
export type Currency = 'JPY' | 'INR' | 'USD';
export type CardCode = 'ICICI' | 'AXIS';

export type ExpenseCategory =
  | 'Convenience Store'
  | 'Food & Dining'
  | 'Clothing & Apparel'
  | 'Travel & Transit'
  | 'Cash Withdrawal'
  | 'Regular Transaction'
  | 'Furniture & Home'
  | 'Electronics & Tech'
  | 'Utilities & Telecom'
  | 'Healthcare & Pharmacy'
  | 'Education & Dorm';

export interface Transaction {
  id: string;
  merchant: string;
  letter: string;
  iconBg: string;
  subtext: string;
  category: string;
  cardCode: CardCode;
  cardUsed: string;
  spender: 'Son' | 'Dad';
  date: string; // e.g. "08-Oct-2026"
  timestampMs: number;
  amountJpy: number;
  amountInr: number;
  smsBalance?: number | null;
  manualOverride?: boolean;
}

export interface FixedExpense {
  id: string;
  name: string;
  amountJpy: number;
  due: string;
  card: string;
  active: boolean;
}

export interface Subscription {
  id: string;
  name: string;
  cycle: string;
  amountJpy: number;
  card: string;
  status: string;
}

export interface StockHolding {
  id: string;
  ticker: string;
  name: string;
  units: string;
  valueJpy: number;
  gain: string;
}

export interface NextMonthPlanItem {
  id: string;
  name: string;
  type: string;
  amountJpy: number;
  whenOccurs: string;
  howPaid: string;
  included: boolean;
}

export interface NextMonthConfig {
  targetMonth: string;
  dailyAvgJpy: number;
  daysInMonth: number;
}

export interface CardState {
  balanceJpy?: number;
  balanceInr?: number;
  spentJpy?: number;
  spentInr?: number;
  nextDate: string;
  lastSyncInfo: string;
}

export interface CalendarDayNote {
  title: string;
  type: 'spend' | 'reload' | 'fixed';
}

export interface StagedSmsItem {
  merchant: string;
  cardCode: CardCode;
  cardUsed: string;
  category: string;
  spender: 'Son' | 'Dad';
  date: string;
  dateRecognized: boolean;
  timestampMs: number;
  amountJpy: number;
  amountInr: number;
  nativeCurrency: 'JPY' | 'INR';
  smsBalance: number | null;
  rawLine?: string;
}

export interface FamilyDatabasePayload {
  updatedAt: number;
  icici: CardState;
  axis: CardState;
  transactions: Transaction[];
  fixedExpenses: FixedExpense[];
  subscriptions: Subscription[];
  stocks: StockHolding[];
  calendarNotes: Record<string, CalendarDayNote>;
  nextMonthConfig: NextMonthConfig;
  nextMonthPlan: NextMonthPlanItem[];
}
