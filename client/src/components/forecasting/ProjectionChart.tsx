import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine
} from 'recharts';
import { ForecastResponse } from '../../types';
import { useFinancials } from '../../context/FinancialContext';

interface ProjectionChartProps {
  forecast: ForecastResponse | null;
  horizonDays: 30 | 60 | 90;
  onHorizonChange: (days: 30 | 60 | 90) => void;
  isLoading?: boolean;
}

export const ProjectionChart: React.FC<ProjectionChartProps> = ({
  forecast,
  horizonDays,
  onHorizonChange,
  isLoading
}) => {
  const { formatCurrency } = useFinancials();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-xl text-xs space-y-1">
          <p className="font-semibold text-slate-200 mb-1">{label}</p>
          <div className="flex items-center justify-between gap-4">
            <span className="text-indigo-400">Projected Cash Balance:</span>
            <span className="font-mono font-bold text-slate-100">
              {formatCurrency(payload[0]?.value)}
            </span>
          </div>
          {payload[0]?.payload?.confidenceLower !== undefined && (
            <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-800">
              Expected Band: {formatCurrency(payload[0].payload.confidenceLower)} — {formatCurrency(payload[0].payload.confidenceUpper)}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-base font-semibold text-slate-100">Predictive Cash Balance Horizon</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Algorithmic projection incorporating recurring commitments and historic daily velocity
          </p>
        </div>

        {/* Horizon Selector (30 / 60 / 90 days) */}
        <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs self-start sm:self-auto">
          {([30, 60, 90] as const).map((days) => (
            <button
              key={days}
              onClick={() => onHorizonChange(days)}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                horizonDays === days
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {days} Days
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="h-72 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !forecast || forecast.projections.length === 0 ? (
        <div className="h-72 flex items-center justify-center text-xs text-slate-500">
          No projection points available.
        </div>
      ) : (
        <>
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
            <div>
              <span className="text-slate-500 block text-[11px]">Starting Liquid</span>
              <span className="font-mono font-bold text-slate-200">
                {formatCurrency(forecast.startingBalance)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">{horizonDays}-Day Projected Balance</span>
              <span className={`font-mono font-bold ${
                forecast.endingBalance >= forecast.startingBalance ? 'text-emerald-400' : 'text-amber-400'
              }`}>
                {formatCurrency(forecast.endingBalance)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Projected Net Change</span>
              <span className={`font-mono font-bold ${
                forecast.projectedNetChange >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {formatCurrency(forecast.projectedNetChange, true)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Depletion Date</span>
              <span className={`font-mono font-semibold ${
                forecast.zeroBalanceDate ? 'text-rose-400' : 'text-emerald-400'
              }`}>
                {forecast.zeroBalanceDate || 'None in Horizon'}
              </span>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={forecast.projections}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="projGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="forecastDate"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => {
                    const parts = val.split('-');
                    return `${parts[1]}/${parts[2]}`;
                  }}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={0} stroke="#f43f5e" strokeDasharray="4 4" label={{ value: 'Zero Cash', fill: '#f43f5e', fontSize: 10 }} />
                <Area
                  type="monotone"
                  dataKey="projectedBalance"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#projGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
};
