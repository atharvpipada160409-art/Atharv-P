import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Transaction } from '../../types';
import { useFinancials } from '../../context/FinancialContext';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  transaction: Transaction | null;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  transaction
}) => {
  const { formatCurrency } = useFinancials();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  if (!transaction) return null;

  const handleConfirm = async () => {
    try {
      setIsLoading(true);
      await onConfirm();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Transaction Record"
      maxWidth="sm"
    >
      <div className="space-y-4">
        <p className="text-xs sm:text-sm text-slate-300">
          Are you sure you want to delete this {transaction.type} entry of{' '}
          <span className="font-mono font-bold text-slate-100">{formatCurrency(transaction.amount)}</span>{' '}
          ({transaction.description || transaction.category})?
        </p>

        <p className="text-xs text-amber-400 bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20">
          ⚠️ Deleting this transaction will reverse its effect and immediately restore the associated account balance.
        </p>

        <div className="pt-2 flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" size="sm" isLoading={isLoading} onClick={handleConfirm}>
            Delete Entry
          </Button>
        </div>
      </div>
    </Modal>
  );
};
