import {
  User,
  Account,
  Category,
  Transaction,
  Budget,
  Setting,
  WeekStats,
  MonthStats,
  YearStats,
} from '../types';

const API_BASE = '/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('token');
}

export function setAuthToken(token: string) {
  localStorage.setItem('token', token);
}

export function removeAuthToken() {
  localStorage.removeItem('token');
}

async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  let data: any;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  } else {
    const text = await response.text();
    data = { message: text || `Lỗi từ máy chủ (${response.status})` };
  }

  if (!response.ok) {
    throw new Error(data?.message || `Lỗi máy chủ (${response.status})`);
  }

  return data as T;
}

export const api = {
  // Auth
  register: (data: any) => fetchAPI<{ message: string; user: User }>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data: any) => fetchAPI<{ message: string; token: string; user: User }>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => fetchAPI<{ user: User }>('/auth/me'),
  logout: () => fetchAPI<{ message: string }>('/auth/logout', { method: 'POST' }),
  changePassword: (data: any) => fetchAPI<{ message: string }>('/auth/change-password', { method: 'POST', body: JSON.stringify(data) }),

  // Accounts
  getAccounts: () => fetchAPI<{ accounts: Account[]; totalBalance: number }>('/accounts'),
  createAccount: (data: { name: string; type: string; balance: number }) => fetchAPI<{ message: string; account: Account }>('/accounts', { method: 'POST', body: JSON.stringify(data) }),
  updateAccount: (id: string, data: { name?: string; type?: string; balance?: number }) => fetchAPI<{ message: string; account: Account }>(`/accounts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAccount: (id: string, force = false) => fetchAPI<{ message: string }>(`/accounts/${id}${force ? '?force=true' : ''}`, { method: 'DELETE' }),

  // Categories
  getCategories: () => fetchAPI<{ categories: Category[] }>('/categories'),
  createCategory: (data: { name: string; type: 'thu' | 'chi'; parent_id?: string | null }) => fetchAPI<{ message: string; category: Category }>('/categories', { method: 'POST', body: JSON.stringify(data) }),
  updateCategory: (id: string, data: { name?: string; type?: 'thu' | 'chi'; parent_id?: string | null }) => fetchAPI<{ message: string; category: Category }>(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCategory: (id: string) => fetchAPI<{ message: string }>(`/categories/${id}`, { method: 'DELETE' }),

  // Transactions
  getTransactions: (params?: { date?: string; month?: number; year?: number; type?: string; account_id?: string; category_id?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          query.append(key, String(val));
        }
      });
    }
    const qStr = query.toString();
    return fetchAPI<{ transactions: Transaction[]; totalThu: number; totalChi: number; net: number }>(`/transactions${qStr ? `?${qStr}` : ''}`);
  },
  getTransactionById: (id: string) => fetchAPI<{ transaction: Transaction }>(`/transactions/${id}`),
  createTransaction: (data: any) => fetchAPI<{ message: string; transaction: Transaction; updatedBalance: number }>('/transactions', { method: 'POST', body: JSON.stringify(data) }),
  updateTransaction: (id: string, data: any) => fetchAPI<{ message: string; transaction: Transaction }>(`/transactions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTransaction: (id: string) => fetchAPI<{ message: string }>(`/transactions/${id}`, { method: 'DELETE' }),

  // Budgets
  getBudgets: (month?: number, year?: number, rollover?: boolean) => {
    const q = new URLSearchParams();
    if (month) q.append('month', String(month));
    if (year) q.append('year', String(year));
    if (rollover !== undefined) q.append('rollover', String(rollover));
    return fetchAPI<{ budgets: Budget[]; month: number; year: number; prevMonth?: number; prevYear?: number }>(`/budgets?${q.toString()}`);
  },
  createBudget: (data: { category_id: string; month: number; year: number; limit_amount: number; is_rollover?: boolean; apply_all_months?: boolean }) => fetchAPI<{ message: string; budget: Budget }>('/budgets', { method: 'POST', body: JSON.stringify(data) }),
  updateBudget: (id: string, data: { limit_amount: number; is_rollover?: boolean; apply_all_months?: boolean }) => fetchAPI<{ message: string; budget: Budget }>(`/budgets/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteBudget: (id: string) => fetchAPI<{ message: string }>(`/budgets/${id}`, { method: 'DELETE' }),

  // Statistics
  getWeekStats: (date?: string) => fetchAPI<WeekStats>(`/statistics/week${date ? `?date=${date}` : ''}`),
  getMonthStats: (month?: number, year?: number) => fetchAPI<MonthStats>(`/statistics/month?month=${month || ''}&year=${year || ''}`),
  getYearStats: (year?: number) => fetchAPI<YearStats>(`/statistics/year?year=${year || ''}`),

  // Settings
  getSettings: () => fetchAPI<{ setting: Setting }>('/settings'),
  updateSettings: (data: Partial<Setting>) => fetchAPI<{ message: string; setting: Setting }>('/settings', { method: 'PUT', body: JSON.stringify(data) }),
  exportData: () => fetchAPI<{ message: string; data: any }>('/settings/export', { method: 'POST' }),
  importData: (data: any) => fetchAPI<{ message: string }>('/settings/import', { method: 'POST', body: JSON.stringify({ data }) }),
  deleteAccountData: () => fetchAPI<{ message: string }>('/settings/account', { method: 'DELETE' }),
};
