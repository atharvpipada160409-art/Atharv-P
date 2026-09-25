import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { ProjectionChart } from '../components/forecasting/ProjectionChart';
import { ScenarioInputForm } from '../components/forecasting/ScenarioInputForm';
import { ImpactSummaryCard } from '../components/forecasting/ImpactSummaryCard';
import { RunwayComparisonWidget } from '../components/forecasting/RunwayComparisonWidget';
import { api } from '../services/api';
import { ForecastResponse, ScenarioPlannerInput, ScenarioSimulationResult } from '../types';

export const ForecastingPage: React.FC = () => {
  const [horizonDays, setHorizonDays] = useState<30 | 60 | 90>(90);
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [isForecastLoading, setIsForecastLoading] = useState(false);

  const [scenarioInput, setScenarioInput] = useState<ScenarioPlannerInput>({
    oneTimeCapitalOutlay: 0,
    monthlyDeltaRevenue: 0,
    monthlyDeltaExpense: 0,
    simulationMonths: 12
  });

  const [scenarioResult, setScenarioResult] = useState<ScenarioSimulationResult | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const fetchForecast = useCallback(async () => {
    try {
      setIsForecastLoading(true);
      const res = await api.getProjections(horizonDays);
      setForecast(res.forecast);
    } catch (err) {
      console.error('Failed to load forecast projections:', err);
    } finally {
      setIsForecastLoading(false);
    }
  }, [horizonDays]);

  const handleSimulateScenario = useCallback(async () => {
    try {
      setIsSimulating(true);
      const res = await api.runScenario(scenarioInput);
      setScenarioResult(res.scenarioResult);
    } catch (err) {
      console.error('Failed to run scenario simulation:', err);
    } finally {
      setIsSimulating(false);
    }
  }, [scenarioInput]);

  useEffect(() => {
    fetchForecast();
  }, [fetchForecast]);

  useEffect(() => {
    handleSimulateScenario();
  }, [handleSimulateScenario]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Forecasting & Scenario Intelligence"
        subtitle="Algorithmic 30/60/90-day cash balance projections and interactive 'what-if' business decision models"
      />

      {/* Primary 30/60/90 Horizon Chart */}
      <section>
        <ProjectionChart
          forecast={forecast}
          horizonDays={horizonDays}
          onHorizonChange={setHorizonDays}
          isLoading={isForecastLoading}
        />
      </section>

      {/* Scenario Planning Header */}
      <div className="pt-4 border-t border-slate-800">
        <h2 className="text-xl font-bold text-white tracking-tight mb-1">
          Interactive "What-If" Decision Simulation
        </h2>
        <p className="text-xs text-slate-400">
          Simulate strategic investments, hiring rounds, or revenue downturns to calculate exact runway impact prior to execution
        </p>
      </div>

      {/* Scenario Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5">
          <ScenarioInputForm
            values={scenarioInput}
            onChange={setScenarioInput}
            onSimulate={handleSimulateScenario}
            isLoading={isSimulating}
          />
        </div>

        <div className="lg:col-span-7 space-y-6">
          <ImpactSummaryCard result={scenarioResult} />
          <RunwayComparisonWidget result={scenarioResult} />
        </div>
      </div>
    </div>
  );
};
