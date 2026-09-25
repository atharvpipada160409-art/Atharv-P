import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import { ScenarioSimulationResult } from '../../types';
import { useFinancials } from '../../context/FinancialContext';

interface RunwayComparisonWidgetProps {
  result: ScenarioSimulationResult | null;
}

export const RunwayComparisonWidget: React.FC<RunwayComparisonWidgetProps> = ({ result }) => {
  const { formatCurrency } = useFinancials();

  if (!result || result.timeline.length === 0) return null;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-xl text-xs space-y-1.5">
          <p className="font-semibold text-slate-200">{label}</p>
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-400">Baseline Balance:</span>
            <span className="font-mono font-semibold text-slate-200">
              {formatCurrency(payload[0]?.value)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-indigo-400">Scenario Balance:</span>
            <span className="font-mono font-semibold text-indigo-300">
              {formatCurrency(payload[1]?.value)}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-panel p-6 rounded-2xl space-y-4">
      <div>
        <h3 className="text-base font-semibold text-slate-100">Comparative Balance Trajectory</h3>
        <p className="text-xs text-slate-400 mt-0.5">
          Projected cash position over {result.timeline.length} months: Current Status Quo vs Simulated Scenario
        </p>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={result.timeline} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="label" stroke="#64748b" fontSize={11} tickLine={false} />
            <YAxis
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
            <ReferenceLine y={0} stroke="#f43f5e" strokeDasharray="4 4" label={{ value: 'Insolvency Line', fill: '#f43f5e', fontSize: 10 }} />
            <Line
              type="monotone"
              dataKey="baselineBalance"
              name="Status Quo Baseline"
              stroke="#64748b"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="scenarioBalance"
              name="Simulated Decision"
              stroke="#818cf8"
              strokeWidth={3}
              dot={{ r: 3, fill: '#818cf8' }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
