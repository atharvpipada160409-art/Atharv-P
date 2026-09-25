import React from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

interface RiskCardListProps {
  risks: string[];
}

export const RiskCardList: React.FC<RiskCardListProps> = ({ risks }) => {
  return (
    <div className="glass-panel p-6 rounded-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          Identified Financial Vulnerabilities & Burn Hazards
        </h3>
        <span className="text-xs text-slate-400">({risks.length} flagged)</span>
      </div>

      {risks.length === 0 ? (
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center text-xs text-emerald-400 flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4" />
          No critical structural risks detected in recent ledger activity.
        </div>
      ) : (
        <div className="space-y-2.5">
          {risks.map((risk, index) => (
            <div
              key={index}
              className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/30 flex items-start gap-3 transition-colors"
            >
              <span className="w-5 h-5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">
                {index + 1}
              </span>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                {risk}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
