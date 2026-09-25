export interface User {
  id: string;
  email: string;
  fullName: string;
  entityType: 'individual' | 'freelancer' | 'smb' | 'startup';
  currency: string;
  lowRunwayThresholdDays: number;
  createdAt: string;
  updatedAt?: string;
}

export interface Account {
  id: string;
  userId: string;
  accountName: string;
  accountType: 'checking' | 'savings' | 'credit' | 'operating';
  currentBalance: number;
  createdAt: string;
  updatedAt?: string;
}

export interface Transaction {
  id: string;
  userId: string;
  accountId: string;
  accountName?: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  description: string;
  transactionDate: string;
  isRecurring: boolean;
  recurringFrequency: 'none' | 'weekly' | 'monthly' | 'annually';
  createdAt: string;
}

export interface BurnAnomaly {
  id: string;
  type: 'spike' | 'surge' | 'threshold' | 'recurring_heavy';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  category?: string;
  amount?: number;
  recommendation: string;
  dateDetected: string;
}

export interface DashboardSummary {
  currentBalance: number;
  monthlyIncome: number;
  monthlyBurnRate: number;
  netCashFlow: number;
  runwayDays: number;
  runwayStatus: 'critical' | 'warning' | 'healthy';
  anomalies: BurnAnomaly[];
  categoryBreakdown: {
    category: string;
    total: number;
    percentage: number;
    type: 'income' | 'expense';
  }[];
  trendPoints: {
    date: string;
    income: number;
    expense: number;
    net: number;
    balance: number;
  }[];
}

export interface ForecastPoint {
  forecastDate: string;
  projectedBalance: number;
  projectedIncome: number;
  projectedExpense: number;
  confidenceLower?: number;
  confidenceUpper?: number;
}

export interface ForecastResponse {
  horizonDays: 30 | 60 | 90;
  startingBalance: number;
  endingBalance: number;
  totalProjectedIncome: number;
  totalProjectedExpense: number;
  projectedNetChange: number;
  zeroBalanceDate: string | null;
  projections: ForecastPoint[];
}

export interface ScenarioPlannerInput {
  oneTimeCapitalOutlay: number;
  monthlyDeltaRevenue: number;
  monthlyDeltaExpense: number;
  simulationMonths: number;
}

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

export interface ActionableStep {
  title: string;
  impact: 'High' | 'Medium' | 'Low';
  description: string;
}

export interface HealthAuditResponse {
  healthScore: number;
  status: 'Critical' | 'Warning' | 'Stable' | 'Thriving';
  monthlyBurnRate: number;
  projectedRunwayDays: number;
  keyRisks: string[];
  actionableSteps: ActionableStep[];
  emergencyPlaybook?: {
    triggered: boolean;
    urgencyLevel: 'None' | 'Elevated' | 'Emergency';
    protocolSteps: string[];
  };
}

export interface AdvisorChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  actionSuggestions?: string[];
  metricsCited?: {
    label: string;
    value: string;
  }[];
}
