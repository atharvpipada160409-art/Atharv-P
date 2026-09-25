import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { AlertTriangle, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useFinancials } from '../../context/FinancialContext';

interface EmergencyPlaybookModalProps {
  isOpen: boolean;
  onClose: () => void;
  runwayDays: number;
  protocolSteps?: string[];
}

export const EmergencyPlaybookModal: React.FC<EmergencyPlaybookModalProps> = ({
  isOpen,
  onClose,
  runwayDays,
  protocolSteps
}) => {
  const { summary } = useFinancials();

  const defaultSteps = [
    'Freeze all discretionary capital expenditures and non-essential travel immediately.',
    'Audit active SaaS tooling and downgrade unused licenses to salvage fixed monthly burn.',
    'Issue 2-3% quick-pay cash discounts to accelerate pending net-30 accounts receivable collections.',
    'Negotiate 30-day payment horizon extensions (net-60) with major commercial vendors.',
    'Evaluate drawing on existing revolving credit facilities or initiating bridge financing.'
  ];

  const steps = protocolSteps && protocolSteps.length > 0 ? protocolSteps : defaultSteps;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Emergency Cash Preservation Playbook"
      description="Operational protocol triggered by critical runway depletion (<30 days threshold)"
      maxWidth="lg"
    >
      <div className="space-y-5">
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="text-xs text-rose-200">
            <span className="font-bold text-sm block text-rose-300">
              Runway Alert: {Math.round(runwayDays)} Days Remaining
            </span>
            Without corrective action or top-line revenue acceleration, existing liquid cash balances will be depleted within ~{(runwayDays / 30).toFixed(1)} months.
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Mandatory Operational Execution Steps:
          </h4>

          <div className="space-y-2.5">
            {steps.map((step, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3"
              >
                <div className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  {idx + 1}
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {step}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Current Monthly Net Burn: <span className="font-mono font-bold text-slate-200">${summary?.monthlyBurnRate.toLocaleString()}</span>
          </span>
          <Button variant="primary" size="sm" onClick={onClose}>
            Acknowledge & Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
