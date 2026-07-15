import React, { useState, useEffect } from 'react';
import { useGroup } from '../context/GroupContext';
import { getSettlements } from '../services/api';

export const SettleUpView = () => {
  const { state } = useGroup();
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSettlements = async () => {
      if (state.members.length === 0) {
        setSettlements([]);
        return;
      }
      setLoading(true);
      try {
        const data = await getSettlements();
        setSettlements(data);
      } catch (err) {
        console.error('Failed to load settlements:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSettlements();
  }, [state.expenses, state.members]);

  if (state.members.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b border-slate-50 dark:border-slate-800/50 mb-2">
        <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 m-0">Settle Up Plan</h2>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-4">
          <svg className="animate-spin h-5 w-5 text-indigo-500" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : settlements.length === 0 ? (
        <div className="text-center py-4 text-emerald-600 dark:text-emerald-450 font-medium text-sm flex items-center justify-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Everything is settled!
        </div>
      ) : (
        <ul className="space-y-2.5">
          {settlements.map((item, idx) => (
            <li key={idx} className="flex items-center justify-between p-3 bg-indigo-50/20 dark:bg-indigo-950/10 border border-indigo-100/40 dark:border-indigo-900/10 rounded-xl text-sm transition hover:scale-[1.01] duration-200">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-800 dark:text-slate-200">{item.from}</span>
                <span className="text-slate-400 dark:text-slate-500 text-xs font-normal">pays</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{item.to}</span>
              </div>
              <span className="font-mono font-bold text-indigo-650 dark:text-indigo-400">
                ₹{item.amount.toFixed(2)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SettleUpView;
