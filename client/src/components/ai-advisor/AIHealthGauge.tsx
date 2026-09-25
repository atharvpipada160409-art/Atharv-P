import React from 'react';
import { Sparkles, RefreshCw, ShieldAlert, ShieldCheck, Zap } from 'lucide-react';
import { Button } from '../ui/Button';
import { HealthAuditResponse } from '../../types';
import { useFinancials } from '../../context/FinancialContext';

interface AIHealthGaugeProps {
  audit: HealthAuditResponse | null;
  onRunAudit: () => void;
  isLoading?: boolean;
}

export const AIHealthGauge: React.FC<AIHealthGaugeProps> = ({
  audit,
  onRunAudit,
  isLoading
}) => {
  const { formatCurrency } = useFinancials();

  const score = audit?.healthScore ?? 75;
  const status = audit?.status ?? 'Stable';

  const statusConfig = {
    'Thriving': { color: '#10b981', badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', icon: ShieldCheck },
    'Stable': { color: '#6366f1', badge: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30', icon: ShieldCheck },
    'Warning': { color: '#f59e0b', badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30', icon: Zap },
    'Critical': { color: '#f43f5e', badge: 'bg-rose-500/10 text-rose-400 border-rose-500/30 animate-pulse', icon: ShieldAlert },
  };

  const currentConfig = statusConfig[status] || statusConfig['Stable'];
  const Icon = currentConfig.icon;

  // Arc calculation for health score (0 to 100)
  const radius = 64;
  const stroke = 10;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between relative overflow-hidden">
      {/* Background radial accent */}
      <div
        className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -z-10 opacity-10 pointer-events-none"
        style={{ backgroundColor: currentConfig.color }}
      />

      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            Gemini AI Financial Health Diagnostic
          </span>
          <p className="text-xs text-slate-400 mt-0.5">Comprehensive stability score evaluated by gemini-2.5-flash</p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onRunAudit}
          isLoading={isLoading}
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Re-Audit Ledger
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-around gap-6 my-2">
        {/* Score Ring */}
        <div className="relative flex items-center justify-center">
          <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
            <circle
              stroke="#1e293b"
              fill="transparent"
              strokeWidth={stroke}
              r={normalizedRadius}
              cx={radius}
              cy={radius}
            />
            <circle
              stroke={currentConfig.color}
              fill="transparent"
              strokeWidth={stroke}
              strokeDasharray={`${circumference} ${circumference}`}
              style={{
                strokeDashoffset,
                transition: 'stroke-dashoffset 1s ease-in-out',
              }}
              strokeLinecap="round"
              r={normalizedRadius}
              cx={radius}
              cy={radius}
            />
          </svg>

          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="text-3xl font-extrabold text-slate-100 font-mono tracking-tight">
              {score}
            </span>
            <span className="text-[10px] text-slate-400 -mt-1">/ 100</span>
          </div>
        </div>

        {/* Diagnosis details */}
        <div className="space-y-3 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <span className={`text-xs px-3 py-1 rounded-full font-semibold border flex items-center gap-1.5 ${currentConfig.badge}`}>
              <Icon className="w-3.5 h-3.5" />
              {status} Health Posture
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs pt-1">
            <div>
              <span className="text-slate-400 block text-[11px]">Monthly Burn Rate</span>
              <span className="font-mono font-bold text-slate-200">
                {audit ? formatCurrency(audit.monthlyBurnRate) : '—'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Projected Runway</span>
              <span className="font-mono font-bold text-slate-200">
                {audit ? `${audit.projectedRunwayDays} days` : '—'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 text-center sm:text-left flex items-center justify-between">
        <span>Model: <span className="font-mono text-indigo-400">gemini-2.5-flash</span> (Structured Schema Execution)</span>
        {audit?.emergencyPlaybook?.triggered && (
          <span className="text-rose-400 font-semibold flex items-center gap-1">
            🚨 Emergency Protocol Activated
          </span>
        )}
      </div>
    </div>
  );
};
