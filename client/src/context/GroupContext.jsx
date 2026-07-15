import React, { createContext, useContext, useReducer, useMemo } from 'react';

const GroupContext = createContext();

const initialState = {
  members: [],
  expenses: [],
  balances: [],
  loading: false,
  error: null
};

const groupReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'SET_MEMBERS':
      return { ...state, members: action.payload, error: null, loading: false };
    case 'ADD_MEMBER':
      return { ...state, members: [...state.members, action.payload], error: null };
    case 'REMOVE_MEMBER':
      return { ...state, members: state.members.filter(m => m._id !== action.payload), error: null };
    case 'SET_EXPENSES':
      return { ...state, expenses: action.payload, error: null, loading: false };
    case 'ADD_EXPENSE':
      return { ...state, expenses: [action.payload, ...state.expenses], error: null };
    case 'REMOVE_EXPENSE':
      return { ...state, expenses: state.expenses.filter(e => e._id !== action.payload), error: null };
    default:
      return state;
  }
};

export const GroupProvider = ({ children }) => {
  const [state, dispatch] = useReducer(groupReducer, initialState);

  // Derive balances reactively from members + expenses (mirrors backend logic)
  const derivedBalances = useMemo(() => {
    const balanceMap = {};

    // 1. Initialize all members with 0 balance
    state.members.forEach((member) => {
      balanceMap[member._id.toString()] = {
        memberId: member._id,
        name: member.name,
        netBalance: 0
      };
    });

    // 2. Process all expenses
    state.expenses.forEach((expense) => {
      const payerId = expense.paidBy?._id || expense.paidBy;
      const payerIdStr = payerId ? payerId.toString() : '';

      // Add to payer
      if (payerIdStr && balanceMap[payerIdStr]) {
        balanceMap[payerIdStr].netBalance += expense.amount;
      }

      // Subtract from participants in splits
      if (expense.splits && Array.isArray(expense.splits)) {
        expense.splits.forEach((split) => {
          const participantId = split.member?._id || split.member;
          const participantIdStr = participantId ? participantId.toString() : '';

          if (participantIdStr && balanceMap[participantIdStr]) {
            balanceMap[participantIdStr].netBalance -= split.shareAmount;
          }
        });
      }
    });

    // 3. Format and round to 2 decimals, sorted alphabetically by name
    return Object.values(balanceMap)
      .map((item) => ({
        ...item,
        netBalance: Number(item.netBalance.toFixed(2))
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [state.members, state.expenses]);

  return (
    <GroupContext.Provider value={{ state, dispatch, balances: derivedBalances }}>
      {children}
    </GroupContext.Provider>
  );
};

export const useGroup = () => {
  const context = useContext(GroupContext);
  if (!context) {
    throw new Error('useGroup must be used within a GroupProvider');
  }
  return context;
};
