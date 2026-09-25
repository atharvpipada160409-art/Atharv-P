import React, { useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { useAuth } from '../context/AuthContext';
import { useFinancials } from '../context/FinancialContext';
import { api } from '../services/api';
import { Account } from '../types';
import {
  User,
  Sliders,
  Wallet,
  Plus,
  Trash2,
  CheckCircle,
  Building,
  DollarSign,
  AlertCircle
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { accounts, formatCurrency, refreshFinancials } = useFinancials();

  // Profile Form state
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [entityType, setEntityType] = useState(user?.entityType || 'startup');
  const [currency, setCurrency] = useState(user?.currency || 'USD');
  const [lowRunwayThresholdDays, setLowRunwayThresholdDays] = useState(user?.lowRunwayThresholdDays || 30);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState('');

  // Account Management state
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountType, setNewAccountType] = useState<'checking' | 'savings' | 'credit' | 'operating'>('operating');
  const [newAccountBalance, setNewAccountBalance] = useState('');
  const [isSavingAccount, setIsSavingAccount] = useState(false);
  const [accountError, setAccountError] = useState('');

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess(false);

    try {
      setIsSavingProfile(true);
      const res = await api.updateProfile({
        fullName,
        entityType: entityType as any,
        currency,
        lowRunwayThresholdDays: Number(lowRunwayThresholdDays)
      });
      updateUser(res.user);
      await refreshFinancials();
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err: any) {
      setProfileError(err.message || 'Failed to update profile settings.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setAccountError('');

    const parsedBalance = parseFloat(newAccountBalance);
    if (isNaN(parsedBalance)) {
      setAccountError('Please provide a valid balance numeric value.');
      return;
    }

    try {
      setIsSavingAccount(true);
      await api.createAccount({
        accountName: newAccountName.trim(),
        accountType: newAccountType,
        currentBalance: parsedBalance
      });
      await refreshFinancials();
      setIsAccountModalOpen(false);
      setNewAccountName('');
      setNewAccountBalance('');
    } catch (err: any) {
      setAccountError(err.message || 'Failed to create account.');
    } finally {
      setIsSavingAccount(false);
    }
  };

  const handleDeleteAccount = async (id: string, name: string) => {
    if (accounts.length <= 1) {
      alert('You cannot delete your only remaining account. Please add another account first.');
      return;
    }
    if (window.confirm(`Are you sure you want to delete "${name}"? Transactions tied to this account will be removed.`)) {
      try {
        await api.deleteAccount(id);
        await refreshFinancials();
      } catch (err: any) {
        alert(err.message || 'Failed to delete account.');
      }
    }
  };

  return (
    <div className="space-y-8 max-w-5xl">
      <PageHeader
        title="Settings & Financial Configuration"
        subtitle="Manage entity profiles, operating currencies, runway alert thresholds, and linked financial accounts"
      />

      {/* Profile & Risk Configuration */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
          <User className="w-5 h-5 text-indigo-400" />
          <div>
            <h3 className="text-base font-semibold text-white">Entity Profile & Threshold Policies</h3>
            <p className="text-xs text-slate-400">Configure parameters used by CashFlowIQ forecasting and risk alerts</p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          {profileSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              Settings updated successfully and applied to running models.
            </div>
          )}

          {profileError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {profileError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Entity / Founder Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Entity Classification</label>
              <select
                value={entityType}
                onChange={(e) => setEntityType(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="individual">Individual</option>
                <option value="freelancer">Freelancer / Solo Consultant</option>
                <option value="smb">Small Business (SMB)</option>
                <option value="startup">High-Growth Tech Startup</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Primary Ledger Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="USD">USD ($ - United States Dollar)</option>
                <option value="EUR">EUR (€ - Euro)</option>
                <option value="GBP">GBP (£ - British Pound)</option>
                <option value="CAD">CAD (CA$ - Canadian Dollar)</option>
                <option value="AUD">AUD (A$ - Australian Dollar)</option>
                <option value="INR">INR (₹ - Indian Rupee)</option>
                <option value="JPY">JPY (¥ - Japanese Yen)</option>
                <option value="SGD">SGD (S$ - Singapore Dollar)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Low Runway Warning Threshold (Days)
              </label>
              <input
                type="number"
                min="5"
                max="365"
                required
                value={lowRunwayThresholdDays}
                onChange={(e) => setLowRunwayThresholdDays(parseInt(e.target.value, 10) || 30)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Triggers visual alarms and emergency playbooks when runway falls below this value.
              </span>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <Button type="submit" variant="primary" size="md" isLoading={isSavingProfile}>
              Save Profile Configurations
            </Button>
          </div>
        </form>
      </div>

      {/* Accounts & Vaults Manager */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Wallet className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="text-base font-semibold text-white">Linked Accounts & Reserves</h3>
              <p className="text-xs text-slate-400">Checking, savings, merchant, and operational liquidity pools</p>
            </div>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsAccountModalOpen(true)}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Add Account
          </Button>
        </div>

        <div className="space-y-3">
          {accounts.map((acc) => (
            <div
              key={acc.id}
              className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-4"
            >
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-slate-100">{acc.accountName}</h4>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                    {acc.accountType}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
                  Account ID: {acc.id.substring(0, 16)}...
                </p>
              </div>

              <div className="flex items-center gap-4">
                <span className="font-mono text-base font-bold text-slate-100">
                  {formatCurrency(acc.currentBalance)}
                </span>
                <button
                  onClick={() => handleDeleteAccount(acc.id, acc.accountName)}
                  className="p-2 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                  title="Remove account"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Account Modal */}
      <Modal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        title="Link New Financial Account"
        description="Add a new checking, savings, credit, or operating account to track"
        maxWidth="md"
      >
        <form onSubmit={handleCreateAccount} className="space-y-4">
          {accountError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {accountError}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Account Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Brex Operating Cash or Stripe Balance"
              value={newAccountName}
              onChange={(e) => setNewAccountName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Account Type *</label>
              <select
                value={newAccountType}
                onChange={(e) => setNewAccountType(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="operating">Operating</option>
                <option value="checking">Checking</option>
                <option value="savings">Savings / Yield</option>
                <option value="credit">Credit / Facility</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Current Balance *</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                value={newAccountBalance}
                onChange={(e) => setNewAccountBalance(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
            <Button variant="outline" size="md" onClick={() => setIsAccountModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" isLoading={isSavingAccount}>
              Save Account
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
