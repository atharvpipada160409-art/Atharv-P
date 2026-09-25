import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ArrowDownLeft, Plus, ChevronRight, Repeat } from 'lucide-react';
import { Transaction } from '../../types';
import { useFinancials } from '../../context/FinancialContext';

interface RecentTransactionsWidgetProps {
  transactions: Transaction[];
  onOpenAddModal: () => void;
}

export const RecentTransactionsWidget: React.FC<RecentTransactionsWidgetProps> = ({
  transactions,
  onOpenAddModal
}) => {
  const { formatCurrency } = useFinancials();
  const recent = transactions.slice(0, 7);

  return (
    <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-slate-100">Recent Ledger Activity</h3>
          <p className="text-xs text-slate-400 mt-0.5">Real-time incoming and outgoing entries</p>
        </div>

        <button
          onClick={onOpenAddModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          Log Entry
        </button>
      </div>

      {recent.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-sm text-slate-400">No transactions recorded yet.</p>
          <button
            onClick={onOpenAddModal}
            className="mt-3 text-xs text-indigo-400 hover:underline"
          >
            Create your first transaction
          </button>
        </div>
      ) : (
        <div className="divide-y divide-slate-800/80">
          {recent.map((tx) => {
            const isIncome = tx.type === 'income';
            return (
              <div
                key={tx.id}
                className="py-3 flex items-center justify-between gap-3 hover:bg-slate-900/40 px-2 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      isIncome
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}
                  >
                    {isIncome ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-slate-200 truncate">
                      {tx.description || tx.category}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <span>{tx.category}</span>
                      <span>•</span>
                      <span>{tx.transactionDate}</span>
                      {tx.isRecurring && (
                        <span className="flex items-center gap-0.5 text-indigo-400 font-mono text-[10px] bg-indigo-500/10 px-1.5 py-0.2 rounded border border-indigo-500/20">
                          <Repeat className="w-2.5 h-2.5" />
                          {tx.recurringFrequency}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={`font-mono text-xs sm:text-sm font-semibold ${
                      isIncome ? 'text-emerald-400' : 'text-slate-200'
                    }`}
                  >
                    {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-slate-800/80 text-center">
        <Link
          to="/transactions"
          className="text-xs text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center gap-1"
        >
          View Full Ledger & Filtering <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
