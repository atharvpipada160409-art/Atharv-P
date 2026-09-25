import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Transaction, Account } from '../../types';

interface AddEditTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: any) => Promise<void>;
  transactionToEdit?: Transaction | null;
  accounts: Account[];
}

const INCOME_CATEGORIES = [
  'Client Invoices',
  'Product Sales',
  'Investment Yields',
  'Salary',
  'Capital Injection',
  'Grants/Loans',
  'Miscellaneous'
];

const EXPENSE_CATEGORIES = [
  'Payroll & Benefits',
  'Rent & Utilities',
  'Software & SaaS',
  'Marketing & Advertising',
  'Inventory/COGS',
  'Taxes',
  'Debt Repayment',
  'Contractor Fees',
  'Operational Expenses'
];

export const AddEditTransactionModal: React.FC<AddEditTransactionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  transactionToEdit,
  accounts
}) => {
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<string>(EXPENSE_CATEGORIES[0]);
  const [description, setDescription] = useState<string>('');
  const [transactionDate, setTransactionDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [accountId, setAccountId] = useState<string>('');
  const [isRecurring, setIsRecurring] = useState<boolean>(false);
  const [recurringFrequency, setRecurringFrequency] = useState<'none' | 'weekly' | 'monthly' | 'annually'>('none');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (transactionToEdit) {
      setType(transactionToEdit.type);
      setAmount(transactionToEdit.amount.toString());
      setCategory(transactionToEdit.category);
      setDescription(transactionToEdit.description || '');
      setTransactionDate(transactionToEdit.transactionDate);
      setAccountId(transactionToEdit.accountId);
      setIsRecurring(transactionToEdit.isRecurring);
      setRecurringFrequency(transactionToEdit.recurringFrequency);
    } else {
      setType('expense');
      setAmount('');
      setCategory(EXPENSE_CATEGORIES[0]);
      setDescription('');
      setTransactionDate(new Date().toISOString().split('T')[0]);
      setAccountId(accounts[0]?.id || '');
      setIsRecurring(false);
      setRecurringFrequency('none');
    }
    setError('');
  }, [transactionToEdit, isOpen, accounts]);

  const handleTypeChange = (newType: 'income' | 'expense') => {
    setType(newType);
    setCategory(newType === 'income' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please provide a valid transaction amount greater than zero.');
      return;
    }

    if (!accountId) {
      setError('Please select an active target account.');
      return;
    }

    try {
      setIsLoading(true);
      await onSubmit({
        accountId,
        amount: parsedAmount,
        type,
        category,
        description,
        transactionDate,
        isRecurring,
        recurringFrequency: isRecurring ? (recurringFrequency === 'none' ? 'monthly' : recurringFrequency) : 'none'
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to record transaction.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={transactionToEdit ? 'Modify Ledger Entry' : 'Log New Transaction'}
      description="Record incoming revenue or operational outlays to update running balances"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        {/* Type Toggle: Income vs Expense */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Transaction Type</label>
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-950 border border-slate-800">
            <button
              type="button"
              onClick={() => handleTypeChange('income')}
              className={`py-2 rounded-lg text-xs font-semibold transition-all ${
                type === 'income'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              + Inflow (Revenue / Capital)
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('expense')}
              className={`py-2 rounded-lg text-xs font-semibold transition-all ${
                type === 'expense'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              - Outflow (Expense / Burn)
            </button>
          </div>
        </div>

        {/* Amount & Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Amount ({type === 'income' ? 'Gross Inflow' : 'Gross Spend'}) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Date *</label>
            <input
              type="date"
              required
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Target Account & Category */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Target Account *</label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              required
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.accountName} (${acc.currentBalance.toLocaleString()})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Category *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {(type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Description / Memo</label>
          <input
            type="text"
            placeholder="e.g. Acme Corp Retainer or AWS Cloud hosting"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Recurring Switch */}
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-slate-200">Scheduled Recurring Transaction</span>
              <p className="text-[11px] text-slate-500">Auto-factor this cash flow into 30/60/90-day predictive forecasts</p>
            </div>
            <input
              type="checkbox"
              id="is_recurring_cb"
              checked={isRecurring}
              onChange={(e) => {
                setIsRecurring(e.target.checked);
                if (e.target.checked && recurringFrequency === 'none') {
                  setRecurringFrequency('monthly');
                }
              }}
              className="w-4 h-4 text-indigo-600 bg-slate-900 border-slate-700 rounded focus:ring-indigo-500 cursor-pointer"
            />
          </div>

          {isRecurring && (
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
              <label className="text-xs text-slate-400">Recurrence Frequency:</label>
              <select
                value={recurringFrequency}
                onChange={(e) => setRecurringFrequency(e.target.value as any)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 text-xs focus:ring-1 focus:ring-indigo-500"
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="annually">Annually</option>
              </select>
            </div>
          )}
        </div>

        {/* Modal Buttons */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
          <Button type="button" variant="outline" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="md" isLoading={isLoading}>
            {transactionToEdit ? 'Save Changes' : 'Confirm Transaction'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
