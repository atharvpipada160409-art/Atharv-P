import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, ArrowDownLeft, ArrowUpRight, Wallet } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { TransactionFilterBar } from '../components/transactions/TransactionFilterBar';
import { TransactionTable } from '../components/transactions/TransactionTable';
import { AddEditTransactionModal } from '../components/transactions/AddEditTransactionModal';
import { DeleteConfirmModal } from '../components/transactions/DeleteConfirmModal';
import { Button } from '../components/ui/Button';
import { useFinancials } from '../context/FinancialContext';
import { api } from '../services/api';
import { Transaction } from '../types';

export const TransactionsPage: React.FC = () => {
  const { accounts, formatCurrency, refreshFinancials } = useFinancials();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [filters, setFilters] = useState({
    search: '',
    type: '',
    category: '',
    startDate: '',
    endDate: ''
  });

  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);

  const loadTransactions = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await api.getTransactions(filters);
      setTransactions(res.transactions);
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  // Unique categories for filtering
  const categories = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach(t => {
      if (t.category) set.add(t.category);
    });
    return Array.from(set).sort();
  }, [transactions]);

  const handleOpenAdd = () => {
    setTransactionToEdit(null);
    setIsAddEditModalOpen(true);
  };

  const handleOpenEdit = (tx: Transaction) => {
    setTransactionToEdit(tx);
    setIsAddEditModalOpen(true);
  };

  const handleOpenDelete = (tx: Transaction) => {
    setTransactionToDelete(tx);
    setIsDeleteModalOpen(true);
  };

  const handleSubmitTransaction = async (formData: any) => {
    if (transactionToEdit) {
      await api.updateTransaction(transactionToEdit.id, formData);
    } else {
      await api.createTransaction(formData);
    }
    await Promise.all([loadTransactions(), refreshFinancials()]);
  };

  const handleConfirmDelete = async () => {
    if (transactionToDelete) {
      await api.deleteTransaction(transactionToDelete.id);
      await Promise.all([loadTransactions(), refreshFinancials()]);
    }
  };

  const handleExportCsv = () => {
    if (transactions.length === 0) return;

    const headers = ['ID', 'Date', 'Type', 'Category', 'Description', 'Amount', 'Recurring', 'Frequency', 'Account'];
    const rows = transactions.map(t => [
      t.id,
      t.transactionDate,
      t.type,
      `"${t.category.replace(/"/g, '""')}"`,
      `"${(t.description || '').replace(/"/g, '""')}"`,
      t.amount,
      t.isRecurring ? 'Yes' : 'No',
      t.recurringFrequency,
      `"${(t.accountName || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `CashFlowIQ_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Metrics summary for the filtered transactions
  const totalInflow = transactions
    .filter(t => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0);

  const totalOutflow = transactions
    .filter(t => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ledger & Transactions"
        subtitle="Itemized incoming revenue and expense logs with automated running balances and category tracking"
        actions={
          <Button
            variant="primary"
            size="md"
            onClick={handleOpenAdd}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Transaction
          </Button>
        }
      />

      {/* Account Balances Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {accounts.map(acc => (
          <div key={acc.id} className="glass-panel p-4 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 block font-medium capitalize">{acc.accountType} Account</span>
              <span className="text-xs sm:text-sm font-semibold text-slate-200">{acc.accountName}</span>
            </div>
            <span className="font-mono font-bold text-slate-100 text-sm">
              {formatCurrency(acc.currentBalance)}
            </span>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <TransactionFilterBar
        filters={filters}
        onFilterChange={setFilters}
        categories={categories}
        onOpenAddModal={handleOpenAdd}
        onExportCsv={handleExportCsv}
      />

      {/* Filtered Totals Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
        <span className="text-slate-400 font-medium">
          Showing <span className="text-slate-200 font-bold">{transactions.length}</span> ledger entries
        </span>
        <div className="flex items-center gap-4 font-mono">
          <span className="flex items-center gap-1 text-emerald-400">
            <ArrowDownLeft className="w-3.5 h-3.5" />
            Filtered Inflow: +{formatCurrency(totalInflow)}
          </span>
          <span className="flex items-center gap-1 text-rose-400">
            <ArrowUpRight className="w-3.5 h-3.5" />
            Filtered Outflow: -{formatCurrency(totalOutflow)}
          </span>
        </div>
      </div>

      {/* Transactions Table */}
      <TransactionTable
        transactions={transactions}
        onEdit={handleOpenEdit}
        onDelete={handleOpenDelete}
        isLoading={isLoading}
      />

      {/* Modals */}
      <AddEditTransactionModal
        isOpen={isAddEditModalOpen}
        onClose={() => setIsAddEditModalOpen(false)}
        onSubmit={handleSubmitTransaction}
        transactionToEdit={transactionToEdit}
        accounts={accounts}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        transaction={transactionToDelete}
      />
    </div>
  );
};
