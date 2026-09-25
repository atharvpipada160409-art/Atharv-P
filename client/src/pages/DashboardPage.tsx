import React, { useState, useEffect } from 'react';
import {
  Wallet,
  TrendingDown,
  TrendingUp,
  Scale,
  Plus,
  Sparkles,
  PieChart as PieIcon
} from 'lucide-react';
import { useFinancials } from '../context/FinancialContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Transaction } from '../types';

import { PageHeader } from '../components/layout/PageHeader';
import { StatCard } from '../components/ui/StatCard';
import { RunwayGauge } from '../components/ui/RunwayGauge';
import { CashFlowChart } from '../components/dashboard/CashFlowChart';
import { BurnAnomalyBanner } from '../components/dashboard/BurnAnomalyBanner';
import { RecentTransactionsWidget } from '../components/dashboard/RecentTransactionsWidget';
import { AddEditTransactionModal } from '../components/transactions/AddEditTransactionModal';
import { EmergencyPlaybookModal } from '../components/ai-advisor/EmergencyPlaybookModal';
import { Button } from '../components/ui/Button';

export const DashboardPage: React.FC = () => {
  const { summary, accounts, formatCurrency, refreshFinancials } = useFinancials();
  const { user } = useAuth();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPlaybookOpen, setIsPlaybookOpen] = useState(false);
  const [isLoadingTx, setIsLoadingTx] = useState(false);

  const fetchRecentTx = async () => {
    try {
      setIsLoadingTx(true);
      const res = await api.getTransactions();
      setTransactions(res.transactions);
    } catch (err) {
      console.error('Failed to fetch recent transactions:', err);
    } finally {
      setIsLoadingTx(false);
    }
  };

  useEffect(() => {
    fetchRecentTx();
  }, []);

  const handleCreateTransaction = async (formData: any) => {
    await api.createTransaction(formData);
    await Promise.all([refreshFinancials(), fetchRecentTx()]);
  };

  const currentBalance = summary?.currentBalance ?? 0;
  const monthlyIncome = summary?.monthlyIncome ?? 0;
  const monthlyBurn = summary?.monthlyBurnRate ?? 0;
  const netCashFlow = summary?.netCashFlow ?? 0;
  const runwayDays = summary?.runwayDays ?? 999;
  const thresholdDays = user?.lowRunwayThresholdDays ?? 30;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Financial Overview"
        subtitle={`Real-time ledger telemetry and predictive runway modeling for your ${user?.entityType || 'business'}`}
        badge={`${user?.currency || 'USD'} Operations`}
        actions={
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsAddModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Log Transaction
          </Button>
        }
      />

      {/* Burn Anomaly and Risk Detection Banner */}
      {summary?.anomalies && summary.anomalies.length > 0 && (
        <BurnAnomalyBanner
          anomalies={summary.anomalies}
          onActionClick={(a) => {
            if (a.type === 'threshold') setIsPlaybookOpen(true);
            else setIsAddModalOpen(true);
          }}
        />
      )}

      {/* Top Stats Grid + Runway Dial */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Liquid Balance"
          value={formatCurrency(currentBalance)}
          subtitle={`Across ${accounts.length} linked accounts`}
          icon={Wallet}
          accentColor="indigo"
        />

        <StatCard
          title="Monthly Cash Inflow"
          value={formatCurrency(monthlyIncome)}
          subtitle="Past 30-day top-line collections"
          icon={TrendingUp}
          accentColor="emerald"
        />

        <StatCard
          title="Monthly Net Burn Rate"
          value={formatCurrency(monthlyBurn)}
          subtitle="Net operational cash depletion"
          icon={TrendingDown}
          accentColor="rose"
        />

        <StatCard
          title="Net Cash Velocity"
          value={formatCurrency(netCashFlow, true)}
          subtitle={netCashFlow >= 0 ? 'Surplus generation' : 'Net cash contraction'}
          icon={Scale}
          accentColor={netCashFlow >= 0 ? 'emerald' : 'amber'}
        />
      </div>

      {/* Main Charts & Runway Dial Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CashFlowChart />
        </div>

        <div className="flex flex-col gap-6">
          <RunwayGauge
            runwayDays={runwayDays}
            thresholdDays={thresholdDays}
            onOpenPlaybook={() => setIsPlaybookOpen(true)}
          />

          {/* Quick Category Summary */}
          <div className="glass-panel p-5 rounded-2xl flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <PieIcon className="w-3.5 h-3.5 text-indigo-400" />
                  Top Expense Categories
                </span>
                <span className="text-[11px] text-slate-500">30d Spend</span>
              </div>

              {summary?.categoryBreakdown && summary.categoryBreakdown.length > 0 ? (
                <div className="space-y-2.5">
                  {summary.categoryBreakdown
                    .filter(c => c.type === 'expense')
                    .slice(0, 4)
                    .map((item) => (
                      <div key={item.category} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-300 font-medium truncate">{item.category}</span>
                          <span className="font-mono text-slate-400">
                            {formatCurrency(item.total)} ({item.percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(100, item.percentage)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 py-4 text-center">No categorized expenses logged yet.</p>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800/80 mt-3 text-center">
              <span className="text-[11px] text-slate-500">
                Data refreshed in real time with ledger sync
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Ledger Activity */}
      <RecentTransactionsWidget
        transactions={transactions}
        onOpenAddModal={() => setIsAddModalOpen(true)}
      />

      {/* Modals */}
      <AddEditTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleCreateTransaction}
        accounts={accounts}
      />

      <EmergencyPlaybookModal
        isOpen={isPlaybookOpen}
        onClose={() => setIsPlaybookOpen(false)}
        runwayDays={runwayDays}
      />
    </div>
  );
};
