import React from 'react';
import { useFinance } from '../../context/FinanceContext';

export const Toast: React.FC = () => {
  const { toastMessage } = useFinance();

  if (!toastMessage) return null;

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold shadow-2xl transition-all z-50 animate-bounce">
      {toastMessage}
    </div>
  );
};
