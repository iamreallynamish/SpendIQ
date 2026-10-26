import React from 'react';
import { BankCards } from './BankCard';
import { SpendingVelocityBento } from './SpendingVelocityBento';
import { TransactionsTable } from './TransactionsTable';
import { FixedExpensesSection } from './FixedExpensesSection';

export const DashboardView: React.FC = () => {
  return (
    <div className="space-y-5 pb-12">
      {/* 1. Hero Bento Grid: ICICI Forex Card, Axis Bank Card & Allowance Pace */}
      <BankCards />

      {/* 2. Spending Velocity, 3-Month Trend & Top Category Breakdown */}
      <SpendingVelocityBento />

      {/* 3. Real Uploaded Transactions Stream */}
      <TransactionsTable />

      {/* 4. Fixed Commitments & Subscriptions */}
      <FixedExpensesSection />
    </div>
  );
};

export default DashboardView;
