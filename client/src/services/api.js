const getApiUrl = () => {
  const url = import.meta.env.VITE_API_URL;
  if (!url) {
    // Fallback if environment variables are not loaded correctly
    return 'http://localhost:5000/api';
  }
  return url;
};

import axios from 'axios';

const api = axios.create({
  baseURL: getApiUrl(),
  headers: {
    'Content-Type': 'application/json'
  }
});

export const getMembers = async () => {
  const response = await api.get('/members');
  return response.data;
};

export const addMember = async (name) => {
  const response = await api.post('/members', { name });
  return response.data;
};

export const removeMember = async (id) => {
  const response = await api.delete(`/members/${id}`);
  return response.data;
};

export const getExpenses = async () => {
  const response = await api.get('/expenses');
  return response.data;
};

export const addExpense = async (payload) => {
  const response = await api.post('/expenses', payload);
  return response.data;
};

export const removeExpense = async (id) => {
  const response = await api.delete(`/expenses/${id}`);
  return response.data;
};

export const getBalances = async () => {
  const response = await api.get('/balances');
  return response.data;
};

export default {
  getMembers,
  addMember,
  removeMember,
  getExpenses,
  addExpense,
  removeExpense,
  getBalances
};
