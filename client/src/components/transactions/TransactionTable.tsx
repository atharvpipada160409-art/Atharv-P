import React from 'react';
import { Edit2, Trash2, Repeat, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { Transaction } from '../../types';
import { useFinancials } from '../../context/FinancialContext';

interface TransactionTableProps {
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
  isLoading?: boolean;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  onEdit,
  onDelete,
  isLoading
}) => {
  const { formatCurrency } = useFinancials();

  if (isLoading) {
    return (
      <div className="glass-panel p-12 rounded-2xl flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-400">Loading ledger entries...</p>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="glass-panel p-12 rounded-2xl text-center space-y-2">
        <p className="text-sm font-medium text-slate-300">No transactions match your current filters.</p>
        <p className="text-xs text-slate-500">Try adjusting your date range or clearing the search query.</p>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase text-[11px] font-semibold tracking-wider">
            <tr>
              <th className="py-3.5 px-4">Date</th>
              <th className="py-3.5 px-4">Description / Entity</th>
              <th className="py-3.5 px-4">Account</th>
              <th className="py-3.5 px-4">Category</th>
              <th className="py-3.5 px-4">Schedule</th>
              <th className="py-3.5 px-4 text-right">Amount</th>
              <th className="py-3.5 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {transactions.map((tx) => {
              const isIncome = tx.type === 'income';
              return (
                <tr
                  key={tx.id}
                  className="hover:bg-slate-900/40 transition-colors group"
                >
                  <td className="py-3.5 px-4 font-mono text-xs text-slate-300 whitespace-nowrap">
                    {tx.transactionDate}
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          isIncome
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {isIncome ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                      </div>
                      <span className="font-medium text-slate-200">
                        {tx.description || tx.category}
                      </span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-slate-400 text-xs whitespace-nowrap">
                    {tx.accountName || 'Primary Operating'}
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                      {tx.category}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {tx.isRecurring ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-md capitalize">
                        <Repeat className="w-3 h-3" />
                        {tx.recurringFrequency}
                      </span>
                    ) : (
                      <span className="text-slate-500 text-xs">One-time</span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-right font-mono font-semibold whitespace-nowrap">
                    <span className={isIncome ? 'text-emerald-400' : 'text-slate-200'}>
                      {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onEdit(tx)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition-colors"
                        title="Edit transaction"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDelete(tx)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                        title="Delete transaction"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
