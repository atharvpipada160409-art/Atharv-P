import React from 'react';
import { Target, CheckCircle2 } from 'lucide-react';
import { ActionableStep } from '../../types';

interface ActionableStepsListProps {
  steps: ActionableStep[];
}

export const ActionableStepsList: React.FC<ActionableStepsListProps> = ({ steps }) => {
  const impactStyles = {
    'High': 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    'Medium': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    'Low': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  };

  return (
    <div className="glass-panel p-6 rounded-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
          <Target className="w-4 h-4 text-indigo-400" />
          Strategic Priority Action Playbook
        </h3>
        <span className="text-xs text-slate-400">Action items sorted by impact</span>
      </div>

      <div className="space-y-3">
        {steps.map((step, idx) => (
          <div
            key={idx}
            className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-colors"
          >
            <div className="flex items-center justify-between gap-3 mb-1.5">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                <h4 className="text-sm font-semibold text-slate-100">{step.title}</h4>
              </div>
              <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-mono font-medium border uppercase tracking-wider ${impactStyles[step.impact]}`}>
                {step.impact} Impact
              </span>
            </div>
            <p className="text-xs text-slate-300 pl-6 leading-relaxed">
              {step.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
