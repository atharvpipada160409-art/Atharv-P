import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Account, DashboardSummary } from '../types';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

interface FinancialContextType {
  accounts: Account[];
  summary: DashboardSummary | null;
  isLoading: boolean;
  currency: string;
  refreshFinancials: () => Promise<void>;
  formatCurrency: (amount: number, showSign?: boolean) => string;
}

const FinancialContext = createContext<FinancialContextType | undefined>(undefined);

export const FinancialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const currency = user?.currency || 'USD';

  const refreshFinancials = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setIsLoading(true);
      const [accRes, sumRes] = await Promise.all([
        api.getAccounts(),
        api.getDashboardSummary()
      ]);
      setAccounts(accRes.accounts);
      setSummary(sumRes.summary);
    } catch (err) {
      console.error('Failed to refresh financial metrics:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      refreshFinancials();
    } else {
      setAccounts([]);
      setSummary(null);
    }
  }, [isAuthenticated, refreshFinancials]);

  const formatCurrency = useCallback((amount: number, showSign: boolean = false): string => {
    const symbolMap: Record<string, string> = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      CAD: 'CA$',
      AUD: 'A$',
      INR: '₹',
      JPY: '¥',
      SGD: 'S$'
    };
    const symbol = symbolMap[currency] || `${currency} `;
    const absVal = Math.abs(amount).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    if (showSign) {
      if (amount > 0) return `+${symbol}${absVal}`;
      if (amount < 0) return `-${symbol}${absVal}`;
      return `${symbol}${absVal}`;
    }

    return amount < 0 ? `-${symbol}${absVal}` : `${symbol}${absVal}`;
  }, [currency]);

  return (
    <FinancialContext.Provider
      value={{
        accounts,
        summary,
        isLoading,
        currency,
        refreshFinancials,
        formatCurrency
      }}
    >
      {children}
    </FinancialContext.Provider>
  );
};

export function useFinancials() {
  const context = useContext(FinancialContext);
  if (!context) {
    throw new Error('useFinancials must be used within a FinancialProvider');
  }
  return context;
}
