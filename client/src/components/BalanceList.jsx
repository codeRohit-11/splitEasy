import React from 'react';
import { useGroup } from '../context/GroupContext';

export const BalanceListItem = ({ name, netBalance }) => {
  let textClass = 'text-slate-500 dark:text-slate-400';
  let prefix = '';
  let badgeClass = 'bg-slate-50 text-slate-600 dark:bg-slate-800/40 dark:text-slate-400 border-slate-100 dark:border-slate-850';
  let labelText = 'Settled';

  if (netBalance > 0) {
    textClass = 'text-emerald-600 dark:text-emerald-400 font-semibold';
    prefix = '+';
    badgeClass = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-100/50 dark:border-emerald-900/30';
    labelText = 'Owed';
  } else if (netBalance < 0) {
    textClass = 'text-rose-600 dark:text-rose-400 font-semibold';
    prefix = '';
    badgeClass = 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 border-rose-100/50 dark:border-rose-900/30';
    labelText = 'Owes';
  }

  return (
    <li className="flex items-center justify-between py-3 first:pt-0 last:pb-0 hover:bg-slate-50/30 dark:hover:bg-slate-800/10 px-2 rounded-xl transition-all duration-200">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 text-sm">
          {name.charAt(0).toUpperCase()}
        </div>
        <div>
          <span className="font-semibold text-slate-800 dark:text-slate-200 block text-sm sm:text-base">
            {name}
          </span>
          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border mt-0.5 ${badgeClass}`}>
            {labelText}
          </span>
        </div>
      </div>
      <div className="text-right">
        <span className={`text-base sm:text-lg font-mono ${textClass}`}>
          {prefix}₹{Math.abs(netBalance).toFixed(2)}
        </span>
      </div>
    </li>
  );
};

export const BalanceList = () => {
  const { balances } = useGroup();

  if (balances.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-50 dark:border-slate-800/50 mb-4">
          <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
          </svg>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 m-0">Balances</h2>
        </div>
        <div className="text-center py-6 text-slate-400 dark:text-slate-500 text-sm">
          Add members to see their net balances.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b border-slate-50 dark:border-slate-800/50 mb-2">
        <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
        </svg>
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 m-0">Balances Sheet</h2>
      </div>
      <ul className="divide-y divide-slate-100 dark:divide-slate-800 max-h-80 overflow-y-auto pr-1">
        {balances.map((item) => (
          <BalanceListItem
            key={item.memberId}
            name={item.name}
            netBalance={item.netBalance}
          />
        ))}
      </ul>
    </div>
  );
};

export default BalanceList;
