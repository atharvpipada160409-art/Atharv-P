import React from 'react';
import { AlertTriangle, TrendingUp, AlertCircle, ArrowUpRight, Zap } from 'lucide-react';
import { BurnAnomaly } from '../../types';

interface BurnAnomalyBannerProps {
  anomalies: BurnAnomaly[];
  onActionClick?: (anomaly: BurnAnomaly) => void;
}

export const BurnAnomalyBanner: React.FC<BurnAnomalyBannerProps> = ({
  anomalies,
  onActionClick
}) => {
  if (!anomalies || anomalies.length === 0) return null;

  const severityIcons = {
    critical: AlertTriangle,
    high: AlertCircle,
    medium: TrendingUp,
    low: Zap,
  };

  const severityStyles = {
    critical: 'bg-rose-950/40 border-rose-500/30 text-rose-300',
    high: 'bg-amber-950/40 border-amber-500/30 text-amber-300',
    medium: 'bg-indigo-950/40 border-indigo-500/30 text-indigo-300',
    low: 'bg-slate-900 border-slate-800 text-slate-300',
  };

  return (
    <div className="space-y-3 mb-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          Real-Time Anomaly & Burn Risk Detection ({anomalies.length})
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {anomalies.map((anomaly) => {
          const Icon = severityIcons[anomaly.severity] || AlertCircle;
          return (
            <div
              key={anomaly.id}
              className={`p-4 rounded-xl border flex flex-col justify-between transition-all duration-200 hover:scale-[1.01] ${severityStyles[anomaly.severity]}`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 shrink-0" />
                    <h4 className="text-sm font-semibold tracking-tight">{anomaly.title}</h4>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-medium uppercase tracking-wider border border-current opacity-80">
                    {anomaly.severity}
                  </span>
                </div>

                <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                  {anomaly.description}
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400 italic truncate max-w-[80%]">
                  💡 {anomaly.recommendation}
                </span>
                {onActionClick && (
                  <button
                    onClick={() => onActionClick(anomaly)}
                    className="font-medium hover:underline flex items-center gap-0.5 shrink-0 ml-2"
                  >
                    Action <ArrowUpRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
