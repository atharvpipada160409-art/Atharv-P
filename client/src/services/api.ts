import {
  User,
  Account,
  Transaction,
  DashboardSummary,
  ForecastResponse,
  ScenarioPlannerInput,
  ScenarioSimulationResult,
  HealthAuditResponse
} from '../types';

const API_BASE = '/api';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('cashflowiq_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const config: RequestInit = {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...(options.headers || {}),
    },
  };

  const response = await fetch(url, config);

  if (response.status === 401) {
    localStorage.removeItem('cashflowiq_token');
    localStorage.removeItem('cashflowiq_user');
    if (!window.location.pathname.startsWith('/auth') && window.location.pathname !== '/') {
      window.location.href = '/auth/login';
    }
  }

  const data = await response.json();
  if (!response.ok || data.success === false) {
    const errorMsg = data.error || (data.details ? data.details.map((d: any) => d.message).join(', ') : 'Request failed');
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  // Auth
  register: (body: any) => request<{ success: boolean; token: string; user: User }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(body)
  }),

  login: (body: any) => request<{ success: boolean; token: string; user: User }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(body)
  }),

  getMe: () => request<{ success: boolean; user: User; accounts: Account[] }>('/auth/me'),

  // Dashboard
  getDashboardSummary: () => request<{ success: boolean; summary: DashboardSummary }>('/dashboard/summary'),

  // Transactions
  getTransactions: (params?: { category?: string; type?: string; startDate?: string; endDate?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.category) query.append('category', params.category);
    if (params?.type) query.append('type', params.type);
    if (params?.startDate) query.append('startDate', params.startDate);
    if (params?.endDate) query.append('endDate', params.endDate);
    if (params?.search) query.append('search', params.search);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return request<{ success: boolean; count: number; transactions: Transaction[] }>(`/transactions${qs}`);
  },

  createTransaction: (data: any) => request<{ success: boolean; transaction: Transaction }>('/transactions', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  updateTransaction: (id: string, data: any) => request<{ success: boolean; transaction: Transaction }>(`/transactions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),

  deleteTransaction: (id: string) => request<{ success: boolean; message: string }>(`/transactions/${id}`, {
    method: 'DELETE'
  }),

  // Forecasting
  getProjections: (horizonDays: 30 | 60 | 90 = 90) =>
    request<{ success: boolean; forecast: ForecastResponse }>(`/forecasting/projections?horizonDays=${horizonDays}`),

  runScenario: (scenario: ScenarioPlannerInput) =>
    request<{ success: boolean; scenarioResult: ScenarioSimulationResult }>('/forecasting/scenario', {
      method: 'POST',
      body: JSON.stringify(scenario)
    }),

  // AI Advisor
  runHealthAudit: (body?: { horizonDays?: string; financialGoal?: string; customInquiry?: string }) =>
    request<{ success: boolean; audit: HealthAuditResponse }>('/ai/health-audit', {
      method: 'POST',
      body: JSON.stringify(body || {})
    }),

  getLatestAudit: () =>
    request<{ success: boolean; audit: HealthAuditResponse | null; generatedAt?: string }>('/ai/health-audit/latest'),

  chatAdvisor: (body: { message: string; history?: any[]; contextHorizon?: string }) =>
    request<{
      success: boolean;
      reply: string;
      actionSuggestions: string[];
      metricsCited: { label: string; value: string }[];
    }>('/ai/advisor-chat', {
      method: 'POST',
      body: JSON.stringify(body)
    }),

  // Settings
  updateProfile: (profile: Partial<User>) =>
    request<{ success: boolean; user: User }>('/settings/profile', {
      method: 'PUT',
      body: JSON.stringify(profile)
    }),

  getAccounts: () => request<{ success: boolean; accounts: Account[] }>('/settings/accounts'),

  createAccount: (data: { accountName: string; accountType: string; currentBalance: number }) =>
    request<{ success: boolean; account: Account }>('/settings/accounts', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  updateAccount: (id: string, data: Partial<Account>) =>
    request<{ success: boolean; account: Account }>(`/settings/accounts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  deleteAccount: (id: string) => request<{ success: boolean; message: string }>(`/settings/accounts/${id}`, {
    method: 'DELETE'
  })
};
