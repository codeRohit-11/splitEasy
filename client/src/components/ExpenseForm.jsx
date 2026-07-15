import React, { useState, useEffect } from 'react';
import { useGroup } from '../context/GroupContext';
import { addExpense } from '../services/api';

export const ExpenseForm = () => {
  const { state, dispatch } = useGroup();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [splitType, setSplitType] = useState('EQUAL'); // EQUAL or CUSTOM

  // For EQUAL split: array of checked member IDs
  const [participantIds, setParticipantIds] = useState([]);

  // For CUSTOM split: map of memberId -> shareAmount
  const [customShares, setCustomShares] = useState({});

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize participants/shares when members list loads
  useEffect(() => {
    if (state.members.length > 0) {
      // Default to select all participants for EQUAL
      setParticipantIds(state.members.map((m) => m._id));

      // Default all custom shares to empty strings/0
      const initialCustom = {};
      state.members.forEach((m) => {
        initialCustom[m._id] = '';
      });
      setCustomShares(initialCustom);

      // Default payer to first member if not set
      if (!paidBy) {
        setPaidBy(state.members[0]._id);
      }
    }
  }, [state.members]);

  const handleParticipantToggle = (memberId) => {
    if (participantIds.includes(memberId)) {
      setParticipantIds(participantIds.filter((id) => id !== memberId));
    } else {
      setParticipantIds([...participantIds, memberId]);
    }
  };

  const handleCustomShareChange = (memberId, value) => {
    setCustomShares({
      ...customShares,
      [memberId]: value
    });
  };

  const parsedAmount = parseFloat(amount) || 0;

  // Custom split calculations
  const totalCustomAllocated = Object.values(customShares).reduce((acc, curr) => {
    const val = parseFloat(curr) || 0;
    return acc + val;
  }, 0);

  const customAllocatedFormatted = Number(totalCustomAllocated.toFixed(2));
  const amountFormatted = Number(parsedAmount.toFixed(2));
  const customRemaining = Number((amountFormatted - customAllocatedFormatted).toFixed(2));
  const isCustomSumValid = Math.abs(customRemaining) <= 0.01;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!description.trim()) {
      setError('Please provide a description.');
      return;
    }

    if (parsedAmount < 0.01) {
      setError('Amount must be at least 0.01.');
      return;
    }

    if (!paidBy) {
      setError('Please select who paid.');
      return;
    }

    setLoading(true);
    setError(null);

    let payload = {
      description: description.trim(),
      amount: parsedAmount,
      paidBy,
      splitType
    };

    if (splitType === 'EQUAL') {
      if (participantIds.length === 0) {
        setError('Please select at least one participant to split the expense.');
        setLoading(false);
        return;
      }
      payload.participantIds = participantIds;
    } else {
      // CUSTOM
      if (!isCustomSumValid) {
        setError(`Split shares sum (₹${customAllocatedFormatted}) must equal the total amount (₹${amountFormatted}). Remaining: ₹${customRemaining}`);
        setLoading(false);
        return;
      }

      // Filter out splits with 0 shareAmount if desired, but keep valid ones
      const splitsArray = Object.entries(customShares).map(([memberId, shareStr]) => ({
        member: memberId,
        shareAmount: parseFloat(shareStr) || 0
      }));

      payload.splits = splitsArray;
    }

    try {
      const createdExpense = await addExpense(payload);
      dispatch({ type: 'ADD_EXPENSE', payload: createdExpense });
      
      // Reset form
      setDescription('');
      setAmount('');
      setError(null);

      // Re-initialize shares/participants
      setParticipantIds(state.members.map((m) => m._id));
      const resetCustom = {};
      state.members.forEach((m) => {
        resetCustom[m._id] = '';
      });
      setCustomShares(resetCustom);
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Failed to add expense.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  if (state.members.length === 0) {
    return null; // Don't render form if no members exist
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm space-y-6">
      <div className="flex items-center gap-2 pb-2 border-b border-slate-50 dark:border-slate-800/50">
        <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 m-0">Add Expense</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Description & Amount */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Description
            </label>
            <input
              id="description"
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Dinner, Rent, Fuel"
              disabled={loading}
              className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200"
            />
          </div>
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Amount (₹)
            </label>
            <input
              id="amount"
              type="number"
              required
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              disabled={loading}
              className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200"
            />
          </div>
        </div>

        {/* Payer Dropdown */}
        <div>
          <label htmlFor="payer" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Who Paid?
          </label>
          <select
            id="payer"
            value={paidBy}
            onChange={(e) => setPaidBy(e.target.value)}
            disabled={loading}
            className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200"
          >
            {state.members.map((member) => (
              <option key={member._id} value={member._id}>
                {member.name}
              </option>
            ))}
          </select>
        </div>

        {/* Split Type Toggle */}
        <div>
          <span className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Split Method
          </span>
          <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setSplitType('EQUAL')}
              className={`flex-1 py-1.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                splitType === 'EQUAL'
                  ? 'bg-white dark:bg-slate-700 text-purple-750 dark:text-purple-300 shadow-sm'
                  : 'text-slate-650 hover:text-slate-800 dark:text-slate-405 dark:hover:text-slate-200'
              }`}
            >
              Split Equally
            </button>
            <button
              type="button"
              onClick={() => setSplitType('CUSTOM')}
              className={`flex-1 py-1.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                splitType === 'CUSTOM'
                  ? 'bg-white dark:bg-slate-700 text-purple-750 dark:text-purple-300 shadow-sm'
                  : 'text-slate-650 hover:text-slate-800 dark:text-slate-405 dark:hover:text-slate-200'
              }`}
            >
              Custom Split
            </button>
          </div>
        </div>

        {/* EQUAL Split Details */}
        {splitType === 'EQUAL' && (
          <div className="space-y-2">
            <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Split Shares (Select participants)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
              {state.members.map((member) => {
                const isChecked = participantIds.includes(member._id);
                return (
                  <button
                    key={member._id}
                    type="button"
                    onClick={() => handleParticipantToggle(member._id)}
                    className={`flex items-center gap-3 px-3 py-2 border rounded-xl transition-all duration-200 text-left ${
                      isChecked
                        ? 'border-purple-200 bg-purple-50/40 dark:border-purple-900/40 dark:bg-purple-950/15 text-slate-800 dark:text-slate-100'
                        : 'border-slate-100 dark:border-slate-800/60 bg-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/30'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                      isChecked
                        ? 'bg-purple-600 border-purple-650 text-white'
                        : 'border-slate-300 dark:border-slate-600'
                    }`}>
                      {isChecked && (
                        <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 12 12">
                          <path d="M3.707 5.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4a1 1 0 00-1.414-1.414L5 6.586 3.707 5.293z" />
                        </svg>
                      )}
                    </div>
                    <span className="text-sm font-medium">{member.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* CUSTOM Split Details */}
        {splitType === 'CUSTOM' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Allocate Custom Splits
              </span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                isCustomSumValid
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30'
                  : 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30'
              }`}>
                {isCustomSumValid
                  ? 'Ready'
                  : `Remaining: ₹${customRemaining.toFixed(2)}`}
              </span>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {state.members.map((member) => (
                <div key={member._id} className="flex items-center gap-3 justify-between py-1 first:pt-0">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {member.name}
                  </span>
                  <div className="relative rounded-xl w-32 shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-slate-400 dark:text-slate-500 text-xs">₹</span>
                    </div>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={customShares[member._id] || ''}
                      onChange={(e) => handleCustomShareChange(member._id, e.target.value)}
                      disabled={loading}
                      className="w-full pl-7 pr-3 py-1.5 text-right border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm transition-all"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Custom splits totals overview */}
            <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100/50 dark:border-slate-800/20 text-xs space-y-1.5 font-medium text-slate-500 dark:text-slate-400">
              <div className="flex justify-between">
                <span>Target Amount:</span>
                <span className="text-slate-800 dark:text-slate-200">₹{amountFormatted.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Allocated:</span>
                <span className={isCustomSumValid ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}>
                  ₹{customAllocatedFormatted.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-200/50 dark:border-slate-700/50 pt-1.5 font-bold">
                <span>Difference:</span>
                <span className={isCustomSumValid ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-450'}>
                  ₹{customRemaining.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Submit and Error feedback */}
        {error && (
          <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-lg border border-red-100 dark:border-red-900/50">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || (splitType === 'CUSTOM' && !isCustomSumValid)}
          className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          {loading ? 'Adding Expense...' : 'Add Expense'}
        </button>
      </form>
    </div>
  );
};

export default ExpenseForm;
