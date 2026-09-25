import React from 'react';
import { Sliders, Sparkles, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';
import { ScenarioPlannerInput } from '../../types';

interface ScenarioInputFormProps {
  values: ScenarioPlannerInput;
  onChange: (values: ScenarioPlannerInput) => void;
  onSimulate: () => void;
  isLoading?: boolean;
}

export const ScenarioInputForm: React.FC<ScenarioInputFormProps> = ({
  values,
  onChange,
  onSimulate,
  isLoading
}) => {
  const applyPreset = (preset: Partial<ScenarioPlannerInput>) => {
    onChange({ ...values, ...preset });
  };

  const resetToZero = () => {
    onChange({
      oneTimeCapitalOutlay: 0,
      monthlyDeltaRevenue: 0,
      monthlyDeltaExpense: 0,
      simulationMonths: 12
    });
  };

  return (
    <div className="glass-panel p-6 rounded-2xl space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-400" />
            "What-If" Scenario Simulator
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Model capital allocation, new hires, or revenue shocks and observe immediate runway impact
          </p>
        </div>

        <button
          onClick={resetToZero}
          className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer"
          title="Reset to default"
        >
          <RefreshCw className="w-3 h-3" /> Reset
        </button>
      </div>

      {/* Preset Chips */}
      <div>
        <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Decision Presets
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => applyPreset({ monthlyDeltaExpense: 7500, simulationMonths: 12 })}
            className="text-xs px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 transition-colors"
          >
            🧑‍💻 Hire Senior Engineer (+$7.5k/mo)
          </button>
          <button
            type="button"
            onClick={() => applyPreset({ monthlyDeltaRevenue: -3500, simulationMonths: 12 })}
            className="text-xs px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 transition-colors"
          >
            📉 20% Churn / Revenue Drop (-$3.5k/mo)
          </button>
          <button
            type="button"
            onClick={() => applyPreset({ oneTimeCapitalOutlay: 15000, simulationMonths: 12 })}
            className="text-xs px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 transition-colors"
          >
            💻 Hardware & Server Upgrade ($15k Outlay)
          </button>
          <button
            type="button"
            onClick={() => applyPreset({ monthlyDeltaRevenue: 6000, monthlyDeltaExpense: -1000, simulationMonths: 18 })}
            className="text-xs px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 transition-colors"
          >
            🚀 Launch Expansion (+6k rev, -1k cost)
          </button>
        </div>
      </div>

      {/* Interactive Sliders & Number Inputs */}
      <div className="space-y-4">
        {/* One-time Capital Outlay */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-medium text-slate-300">One-Time Capital Outlay ($)</span>
            <span className="font-mono font-semibold text-rose-400">
              -${values.oneTimeCapitalOutlay.toLocaleString()}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100000"
            step="1000"
            value={values.oneTimeCapitalOutlay}
            onChange={(e) => onChange({ ...values, oneTimeCapitalOutlay: parseFloat(e.target.value) || 0 })}
            className="w-full accent-rose-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
        </div>

        {/* Monthly Revenue Delta */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-medium text-slate-300">Monthly Revenue Delta (+ or - $/mo)</span>
            <span className={`font-mono font-semibold ${
              values.monthlyDeltaRevenue >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {values.monthlyDeltaRevenue >= 0 ? '+' : ''}${values.monthlyDeltaRevenue.toLocaleString()}/mo
            </span>
          </div>
          <input
            type="range"
            min="-20000"
            max="30000"
            step="500"
            value={values.monthlyDeltaRevenue}
            onChange={(e) => onChange({ ...values, monthlyDeltaRevenue: parseFloat(e.target.value) || 0 })}
            className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
        </div>

        {/* Monthly Expense Delta */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-medium text-slate-300">Monthly Expense Delta (+ or - $/mo)</span>
            <span className={`font-mono font-semibold ${
              values.monthlyDeltaExpense > 0 ? 'text-rose-400' : 'text-emerald-400'
            }`}>
              {values.monthlyDeltaExpense >= 0 ? '+' : ''}${values.monthlyDeltaExpense.toLocaleString()}/mo
            </span>
          </div>
          <input
            type="range"
            min="-10000"
            max="25000"
            step="500"
            value={values.monthlyDeltaExpense}
            onChange={(e) => onChange({ ...values, monthlyDeltaExpense: parseFloat(e.target.value) || 0 })}
            className="w-full accent-rose-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
        </div>

        {/* Simulation Period (Months) */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-medium text-slate-300">Simulation Horizon</span>
            <span className="font-mono font-semibold text-indigo-400">
              {values.simulationMonths} Months
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="36"
            step="1"
            value={values.simulationMonths}
            onChange={(e) => onChange({ ...values, simulationMonths: parseInt(e.target.value, 10) || 12 })}
            className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
        </div>
      </div>

      <div className="pt-2">
        <Button
          variant="primary"
          size="md"
          className="w-full"
          onClick={onSimulate}
          isLoading={isLoading}
          leftIcon={<Sparkles className="w-4 h-4" />}
        >
          Compute Simulation & Compare Runway
        </Button>
      </div>
    </div>
  );
};
