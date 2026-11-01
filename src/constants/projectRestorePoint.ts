import { FamilyDatabasePayload } from '../types/finance';
import restorePointData from './project_restore_point.json';

export const PROJECT_RESTORE_POINT: FamilyDatabasePayload = restorePointData as FamilyDatabasePayload;

export const RESTORE_POINT_METADATA = {
  createdAt: '2026-10-31T20:05:00-07:00',
  formattedDate: 'October 31, 2026',
  transactionCount: (restorePointData as FamilyDatabasePayload).transactions?.length || 66,
  iciciBalanceJpy: (restorePointData as FamilyDatabasePayload).icici?.balanceJpy || 78386,
  axisBalanceInr: (restorePointData as FamilyDatabasePayload).axis?.balanceInr || 32297,
  description: 'Verified complete snapshot of all transactions, card balances, subscriptions, notes, and financial configuration.',
};
