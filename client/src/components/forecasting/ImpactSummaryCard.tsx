import React from 'react';
import { AlertTriangle, TrendingUp, TrendingDown, CheckCircle2, ShieldAlert } from 'lucide-react';
import { ScenarioSimulationResult } from '../../types';
import { useFinancials } from '../../context/FinancialContext';

interface ImpactSummaryCardProps {
  result: ScenarioSimulationResult | null;
}

export const ImpactSummaryCard: React.FC<ImpactSummaryCardProps> = ({ result }) => {
  const { formatCurrency } = useFinancials();

  if (!result) return null;

  const verdictStyles = {
    'Improved': {
      bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
      icon: CheckCircle2,
      badge: 'Positive Impact',
    },
    'Neutral': {
      bg: 'bg-slate-800 border-slate-700 text-slate-300',
      icon: TrendingUp,
      badge: 'Neutral Delta',
    },
    'Accelerated Depletion': {
      bg: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
      icon: TrendingDown,
      badge: 'Elevated Outflow',
    },
    'Critical Risk': {
      bg: 'bg-rose-500/10 border-rose-500/30 text-rose-300',
      icon: ShieldAlert,
      badge: 'Solvency Hazard',
    }
  };

  const style = verdictStyles[result.verdict] || verdictStyles['Neutral'];
  const Icon = style.icon;

  return (
    <div className={`p-6 rounded-2xl border ${style.bg} space-y-4`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5 shrink-0" />
          <h4 className="text-base font-bold tracking-tight">
            Simulation Impact Verdict: {result.verdict}
          </h4>
        </div>
        <span className="text-xs px-2.5 py-0.5 rounded-full font-mono font-medium uppercase tracking-wider border border-current">
          {style.badge}
        </span>
      </div>

      <p className="text-xs sm:text-sm leading-relaxed text-slate-200">
        {result.summary}
      </p>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-white/10 text-xs">
        <div>
          <span className="text-slate-400 block text-[11px]">Baseline Runway</span>
          <span className="font-mono font-bold text-slate-100 text-sm">
            {result.baselineRunwayDays >= 999 ? '∞' : `${result.baselineRunwayDays} days`}
          </span>
        </div>

        <div>
          <span className="text-slate-400 block text-[11px]">Scenario Runway</span>
          <span className="font-mono font-bold text-slate-100 text-sm">
            {result.scenarioRunwayDays >= 999 ? '∞' : `${result.scenarioRunwayDays} days`}
          </span>
        </div>

        <div>
          <span className="text-slate-400 block text-[11px]">Net Runway Delta</span>
          <span className={`font-mono font-bold text-sm ${
            result.runwayDeltaDays >= 0 ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            {result.runwayDeltaDays >= 0 ? '+' : ''}{result.runwayDeltaDays} days ({result.runwayDeltaMonths > 0 ? '+' : ''}{result.runwayDeltaMonths} mo)
          </span>
        </div>

        <div>
          <span className="text-slate-400 block text-[11px]">Scenario Monthly Burn</span>
          <span className="font-mono font-bold text-slate-100 text-sm">
            {formatCurrency(result.scenarioMonthlyBurn)}/mo
          </span>
        </div>
      </div>
    </div>
  );
};
