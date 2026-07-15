import React, { useState } from 'react';
import { useGroup } from '../context/GroupContext';
import { removeExpense } from '../services/api';

export const ExpenseListItem = ({ expense }) => {
  const { dispatch } = useGroup();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this expense?')) return;

    setDeleting(true);
    setError(null);

    try {
      await removeExpense(expense._id);
      dispatch({ type: 'REMOVE_EXPENSE', payload: expense._id });
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Failed to delete expense.';
      setError(errMsg);
      setTimeout(() => setError(null), 4000);
    } finally {
      setDeleting(false);
    }
  };

  // Helper to format date
  const formatDate = (dateStr) => {
    const options = { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateStr).toLocaleDateString(undefined, options);
  };

  // Get payer display name safely
  const payerName = expense.paidBy?.name || 'Unknown';

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4 group transition-all duration-200">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base sm:text-lg m-0">
            {expense.description}
          </h3>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <span className="inline-block w-4 h-4 rounded-full bg-slate-100 dark:bg-slate-800 text-center font-bold text-[9px] leading-4 text-slate-650 dark:text-slate-300">
                {payerName.charAt(0).toUpperCase()}
              </span>
              Paid by <strong className="text-slate-700 dark:text-slate-350">{payerName}</strong>
            </span>
            <span className="text-slate-300 dark:text-slate-750">•</span>
            <span>{formatDate(expense.createdAt)}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-base sm:text-lg font-bold font-mono text-slate-800 dark:text-slate-100">
            ₹{expense.amount.toFixed(2)}
          </span>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-1.5 text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 disabled:opacity-50 transition-all duration-200"
            title="Delete expense"
          >
            {deleting ? (
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Split Details chips */}
      <div className="space-y-1.5">
        <span className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Split Details ({expense.splitType === 'EQUAL' ? 'Equally' : 'Custom'})
        </span>
        <div className="flex flex-wrap gap-1.5">
          {expense.splits.map((split) => {
            const memberName = split.member?.name || 'Unknown';
            return (
              <span
                key={split.member?._id || Math.random()}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/40 text-slate-650 dark:text-slate-350 border border-slate-100/50 dark:border-slate-800/30"
              >
                <span className="w-3 h-3 rounded-full bg-slate-200 dark:bg-slate-700 text-center font-bold text-[8px] leading-3 text-slate-600 dark:text-slate-400">
                  {memberName.charAt(0).toUpperCase()}
                </span>
                <span>
                  {memberName}: <strong className="font-semibold font-mono text-slate-700 dark:text-slate-250">₹{split.shareAmount.toFixed(2)}</strong>
                </span>
              </span>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="text-xs text-red-650 dark:text-red-400 bg-red-50 dark:bg-red-950/20 px-3 py-1.5 rounded-lg border border-red-100 dark:border-red-900/30">
          {error}
        </div>
      )}
    </div>
  );
};

export const ExpenseList = () => {
  const { state } = useGroup();

  if (state.expenses.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-50 dark:border-slate-800/50 mb-4">
          <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 m-0">Expenses</h2>
        </div>
        <div className="text-center py-10 text-slate-400 dark:text-slate-500 text-sm">
          No expenses logged yet. Log an expense above to get started.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm mb-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-50 dark:border-slate-800/50">
          <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 m-0">Expense Ledger</h2>
        </div>
      </div>
      
      <div className="space-y-3 overflow-y-auto max-h-[500px] pr-1">
        {state.expenses.map((expense) => (
          <ExpenseListItem key={expense._id} expense={expense} />
        ))}
      </div>
    </div>
  );
};

export default ExpenseList;
