import { FamilyDatabasePayload, ExpenseCategory } from '../types/finance';

export const CATEGORY_LIST: ExpenseCategory[] = [
  'Convenience Store',
  'Food & Dining',
  'Clothing & Apparel',
  'Travel & Transit',
  'Cash Withdrawal',
  'Regular Transaction',
  'Furniture & Home',
  'Electronics & Tech',
  'Utilities & Telecom',
  'Healthcare & Pharmacy',
  'Education & Dorm',
];

export const INITIAL_DATA: FamilyDatabasePayload = {
  updatedAt: Date.now(),
  icici: {
    balanceJpy: 0,
    spentJpy: 0,
    nextDate: '2026-11-05',
    lastSyncInfo: 'Blank slate ready',
  },
  axis: {
    balanceInr: 0,
    spentInr: 0,
    nextDate: '2026-11-18',
    lastSyncInfo: 'Blank slate ready',
  },
  transactions: [],
  fixedExpenses: [],
  subscriptions: [],
  stocks: [],
  calendarNotes: {},
  nextMonthConfig: {
    targetMonth: 'November 2026 (30 Days)',
    dailyAvgJpy: 500,
    daysInMonth: 30,
  },
  nextMonthPlan: [],
};
