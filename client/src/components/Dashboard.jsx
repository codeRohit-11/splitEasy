import React, { useEffect } from 'react';
import { useGroup } from '../context/GroupContext';
import { getMembers, getExpenses } from '../services/api';
import MemberManager from './MemberManager';
import BalanceList from './BalanceList';
import ExpenseForm from './ExpenseForm';
import ExpenseList from './ExpenseList';

export const Dashboard = () => {
  const { state, dispatch } = useGroup();

  useEffect(() => {
    const fetchInitialData = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const [members, expenses] = await Promise.all([
          getMembers(),
          getExpenses()
        ]);

        dispatch({ type: 'SET_MEMBERS', payload: members });
        dispatch({ type: 'SET_EXPENSES', payload: expenses });
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
        dispatch({
          type: 'SET_ERROR',
          payload: err.response?.data?.error || 'Failed to connect to the backend server.'
        });
      }
    };

    fetchInitialData();
  }, [dispatch]);

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-[#0c0d12] text-slate-800 dark:text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="max-w-7xl mx-auto mb-10 text-center space-y-2">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 dark:from-purple-400 dark:via-violet-400 dark:to-indigo-400 m-0">
          SplitEasy 💸
        </h1>
        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
          A zero-friction shared-expense splitter. No credentials, no accounts — just add members, log expenses, and see balances immediately.
        </p>
      </header>

      {/* Main Content Layout */}
      <main className="max-w-7xl mx-auto">
        {state.loading && state.members.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <svg className="animate-spin h-10 w-10 text-purple-600 dark:text-purple-400" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Loading SplitEasy context...</p>
          </div>
        ) : state.error ? (
          <div className="max-w-lg mx-auto bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-2xl p-6 text-center space-y-4">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-950 text-red-650 dark:text-red-400">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">Connection Failure</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">{state.error}</p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-650 hover:bg-red-700 text-white font-medium rounded-xl text-sm transition"
            >
              Retry Connection
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column (Members and Balances) */}
            <section className="lg:col-span-4 space-y-6 lg:sticky lg:top-6">
              <MemberManager />
              <BalanceList />
            </section>

            {/* Right Column (Expense forms and ledger list) */}
            <section className="lg:col-span-8 space-y-6">
              <ExpenseForm />
              <ExpenseList />
            </section>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
