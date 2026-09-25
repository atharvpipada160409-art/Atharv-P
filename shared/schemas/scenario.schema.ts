import { z } from 'zod';

export const ScenarioPlannerSchema = z.object({
  oneTimeCapitalOutlay: z.number().min(0).default(0),
  monthlyDeltaRevenue: z.number().default(0),
  monthlyDeltaExpense: z.number().default(0),
  simulationMonths: z.number().int().min(1).max(36).default(12)
});

export type ScenarioPlannerInput = z.infer<typeof ScenarioPlannerSchema>;

export interface ScenarioResultPoint {
  month: number;
  label: string;
  baselineBalance: number;
  scenarioBalance: number;
  baselineNetFlow: number;
  scenarioNetFlow: number;
}

export interface ScenarioSimulationResult {
  currentBalance: number;
  baselineMonthlyBurn: number;
  baselineRunwayDays: number;
  scenarioMonthlyBurn: number;
  scenarioRunwayDays: number;
  runwayDeltaDays: number;
  runwayDeltaMonths: number;
  depletionDateBaseline: string | null;
  depletionDateScenario: string | null;
  timeline: ScenarioResultPoint[];
  verdict: 'Improved' | 'Neutral' | 'Critical Risk' | 'Accelerated Depletion';
  summary: string;
}
