import React from 'react';
import { AlertTriangle, ShieldCheck, Zap } from 'lucide-react';

interface RunwayGaugeProps {
  runwayDays: number;
  thresholdDays?: number;
  onOpenPlaybook?: () => void;
}

export const RunwayGauge: React.FC<RunwayGaugeProps> = ({
  runwayDays,
  thresholdDays = 30,
  onOpenPlaybook
}) => {
  // Normalize percentage for a 180-day scale
  const maxScale = 180;
  const clampedDays = Math.max(0, Math.min(runwayDays, maxScale));
  const percentage = Math.round((clampedDays / maxScale) * 100);

  const isCritical = runwayDays <= thresholdDays;
  const isWarning = !isCritical && runwayDays <= thresholdDays * 2;
  const isHealthy = !isCritical && !isWarning;

  let color = '#10b981'; // emerald
  let statusText = 'Optimal Runway';
  let badgeBg = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
  let Icon = ShieldCheck;

  if (isCritical) {
    color = '#f43f5e'; // rose
    statusText = 'Critical Depletion Risk';
    badgeBg = 'bg-rose-500/10 text-rose-400 border-rose-500/30 animate-pulse';
    Icon = AlertTriangle;
  } else if (isWarning) {
    color = '#f59e0b'; // amber
    statusText = 'Cautious Cushion';
    badgeBg = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    Icon = Zap;
  }

  // Circular gauge math (half circle / arc)
  const radius = 70;
  const stroke = 12;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  // Use 180 deg arc (half circumference)
  const arcLength = circumference / 2;
  const strokeDashoffset = arcLength - (percentage / 100) * arcLength;

  return (
    <div className="glass-panel p-6 rounded-2xl flex flex-col items-center justify-between text-center relative overflow-hidden">
      {/* Background glow based on status */}
      <div
        className="absolute top-0 w-48 h-48 rounded-full blur-3xl -z-10 opacity-15 pointer-events-none"
        style={{ backgroundColor: color }}
      />

      <div className="w-full flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Operational Runway Dial</span>
        <span className={`text-[11px] px-2.5 py-0.5 rounded-full border font-medium flex items-center gap-1 ${badgeBg}`}>
          <Icon className="w-3 h-3" />
          {statusText}
        </span>
      </div>

      {/* SVG Arc Gauge */}
      <div className="relative flex flex-col items-center justify-center my-2">
        <svg
          height={radius * 2}
          width={radius * 2 + 20}
          className="transform -rotate-90 overflow-visible"
        >
          {/* Background Track */}
          <circle
            stroke="#1e293b"
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius + 10}
            cy={radius}
          />
          {/* Active Value Arc */}
          <circle
            stroke={color}
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={`${arcLength} ${circumference}`}
            style={{
              strokeDashoffset,
              transition: 'stroke-dashoffset 1s ease-in-out, stroke 0.5s ease',
            }}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius + 10}
            cy={radius}
          />
        </svg>

        {/* Center Text */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/3 text-center">
          <span className="text-3xl sm:text-4xl font-extrabold text-slate-100 font-mono tracking-tight">
            {runwayDays >= 999 ? '∞' : Math.round(runwayDays)}
          </span>
          <span className="block text-xs font-medium text-slate-400">
            {runwayDays >= 999 ? 'Cash Flow Positive' : 'Days Remaining'}
          </span>
        </div>
      </div>

      {/* Threshold and Playbook Action */}
      <div className="w-full mt-2 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
        <div className="text-slate-400">
          Threshold: <span className="font-semibold text-slate-300 font-mono">{thresholdDays} days</span>
        </div>
        {isCritical && onOpenPlaybook ? (
          <button
            onClick={onOpenPlaybook}
            className="text-rose-400 hover:text-rose-300 font-medium underline flex items-center gap-1 cursor-pointer"
          >
            Emergency Playbook →
          </button>
        ) : (
          <span className="text-slate-400">
            ~{(runwayDays / 30).toFixed(1)} mo buffer
          </span>
        )}
      </div>
    </div>
  );
};
