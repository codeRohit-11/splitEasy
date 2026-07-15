import React, { useState } from 'react';
import { useGroup } from '../context/GroupContext';
import { addMember, removeMember } from '../services/api';

export const AddMemberForm = () => {
  const { dispatch } = useGroup();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const newMember = await addMember(name.trim());
      dispatch({ type: 'ADD_MEMBER', payload: newMember });
      setName('');
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Failed to add member.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label htmlFor="member-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Add New Member
        </label>
        <div className="flex gap-2">
          <input
            id="member-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Aman, Ria, Karan"
            disabled={loading}
            className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 transition-all duration-200"
          />
          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium rounded-xl shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {loading ? 'Adding...' : 'Add'}
          </button>
        </div>
      </div>
      {error && (
        <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-lg border border-red-100 dark:border-red-900/50">
          {error}
        </div>
      )}
    </form>
  );
};

export const MemberList = () => {
  const { state, dispatch } = useGroup();
  const [deletingId, setDeletingId] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  const handleDelete = async (id) => {
    setDeletingId(id);
    setDeleteError(null);

    try {
      await removeMember(id);
      dispatch({ type: 'REMOVE_MEMBER', payload: id });
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Failed to remove member.';
      setDeleteError(errMsg);
      // Auto-clear error after 4 seconds
      setTimeout(() => setDeleteError(null), 4000);
    } finally {
      setDeletingId(null);
    }
  };

  if (state.members.length === 0) {
    return (
      <div className="text-center py-6 text-slate-400 dark:text-slate-500 text-sm">
        No members added yet. Add some members above to get started.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {deleteError && (
        <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-lg border border-red-100 dark:border-red-900/50 transition-all duration-300">
          {deleteError}
        </div>
      )}
      <ul className="divide-y divide-slate-100 dark:divide-slate-800 max-h-60 overflow-y-auto pr-1">
        {state.members.map((member) => (
          <li key={member._id} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0 group">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500/20 to-indigo-500/20 dark:from-purple-500/10 dark:to-indigo-500/10 flex items-center justify-center border border-purple-500/10 text-purple-700 dark:text-purple-400 font-semibold text-sm">
                {member.name.charAt(0).toUpperCase()}
              </div>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {member.name}
              </span>
            </div>
            <button
              onClick={() => handleDelete(member._id)}
              disabled={deletingId === member._id}
              className="p-1.5 text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 disabled:opacity-50 transition-all duration-200"
              title="Remove member"
            >
              {deletingId === member._id ? (
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
          </li>
        ))}
      </ul>
    </div>
  );
};

export const MemberManager = () => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm space-y-6">
      <div className="flex items-center gap-2 pb-1 border-b border-slate-50 dark:border-slate-800/50">
        <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 m-0">Group Members</h2>
      </div>
      <AddMemberForm />
      <MemberList />
    </div>
  );
};

export default MemberManager;
