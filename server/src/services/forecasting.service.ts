import { Transaction, ForecastPoint, ForecastResponse, ScenarioPlannerInput, ScenarioSimulationResult, ScenarioResultPoint } from '../../../shared/types';

export function calculateProjections(
  transactions: Transaction[],
  currentBalance: number,
  horizonDays: 30 | 60 | 90 = 90
): ForecastResponse {
  const now = new Date();
  const past30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Separate recurring vs non-recurring
  const recentTransactions = transactions.filter(t => new Date(t.transactionDate) >= past30Days);

  const nonRecurringIncome = recentTransactions
    .filter(t => t.type === 'income' && !t.isRecurring)
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const nonRecurringExpense = recentTransactions
    .filter(t => t.type === 'expense' && !t.isRecurring)
    .reduce((sum, t) => sum + Number(t.amount), 0);

  // Daily baseline averages for non-recurring flows
  const dailyNonRecurringIncome = nonRecurringIncome / 30;
  const dailyNonRecurringExpense = nonRecurringExpense / 30;

  // Recurring transactions registry
  const recurringItems = transactions.filter(t => t.isRecurring);

  const projections: ForecastPoint[] = [];
  let runningBalance = currentBalance;
  let totalProjectedIncome = 0;
  let totalProjectedExpense = 0;
  let zeroBalanceDate: string | null = null;

  for (let day = 1; day <= horizonDays; day++) {
    const targetDate = new Date(now.getTime() + day * 24 * 60 * 60 * 1000);
    const dateStr = targetDate.toISOString().split('T')[0];
    const dayOfWeek = targetDate.getDay();
    const dayOfMonth = targetDate.getDate();

    let dayIncome = dailyNonRecurringIncome;
    let dayExpense = dailyNonRecurringExpense;

    // Evaluate recurring schedules
    for (const item of recurringItems) {
      const amount = Number(item.amount);
      const originalDate = new Date(item.transactionDate);
      const originalDayOfMonth = originalDate.getDate();
      const originalDayOfWeek = originalDate.getDay();

      if (item.recurringFrequency === 'weekly') {
        if (dayOfWeek === originalDayOfWeek) {
          if (item.type === 'income') dayIncome += amount;
          else dayExpense += amount;
        }
      } else if (item.recurringFrequency === 'monthly') {
        // Trigger on matching day of month or month end
        if (dayOfMonth === originalDayOfMonth || (dayOfMonth === 28 && originalDayOfMonth > 28)) {
          if (item.type === 'income') dayIncome += amount;
          else dayExpense += amount;
        }
      } else if (item.recurringFrequency === 'annually') {
        if (targetDate.getMonth() === originalDate.getMonth() && dayOfMonth === originalDayOfMonth) {
          if (item.type === 'income') dayIncome += amount;
          else dayExpense += amount;
        }
      }
    }

    runningBalance = runningBalance + dayIncome - dayExpense;
    totalProjectedIncome += dayIncome;
    totalProjectedExpense += dayExpense;

    if (runningBalance <= 0 && !zeroBalanceDate) {
      zeroBalanceDate = dateStr;
    }

    // Variance dispersion envelope (+/- 0.5% per week)
    const uncertaintyMultiplier = 1 + (day / horizonDays) * 0.12;
    const confidenceSpread = Math.abs(runningBalance) * 0.08 * (day / 30);

    projections.push({
      forecastDate: dateStr,
      projectedBalance: Math.round(runningBalance * 100) / 100,
      projectedIncome: Math.round(dayIncome * 100) / 100,
      projectedExpense: Math.round(dayExpense * 100) / 100,
      confidenceLower: Math.round((runningBalance - confidenceSpread) * 100) / 100,
      confidenceUpper: Math.round((runningBalance + confidenceSpread) * 100) / 100
    });
  }

  return {
    horizonDays,
    startingBalance: Math.round(currentBalance * 100) / 100,
    endingBalance: Math.round(runningBalance * 100) / 100,
    totalProjectedIncome: Math.round(totalProjectedIncome * 100) / 100,
    totalProjectedExpense: Math.round(totalProjectedExpense * 100) / 100,
    projectedNetChange: Math.round((runningBalance - currentBalance) * 100) / 100,
    zeroBalanceDate,
    projections
  };
}

export function simulateScenario(
  transactions: Transaction[],
  currentBalance: number,
  scenario: ScenarioPlannerInput
): ScenarioSimulationResult {
  const now = new Date();
  const past30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const recentExpenses = transactions
    .filter(t => t.type === 'expense' && new Date(t.transactionDate) >= past30Days)
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const recentIncome = transactions
    .filter(t => t.type === 'income' && new Date(t.transactionDate) >= past30Days)
    .reduce((sum, t) => sum + Number(t.amount), 0);

  // Baseline net burn (or gross expense if income is 0)
  const baselineMonthlyBurn = Math.max(0, recentExpenses - recentIncome);
  const baselineNetMonthlyFlow = recentIncome - recentExpenses;

  const baselineRunwayDays = baselineMonthlyBurn > 0
    ? Math.max(0, Math.round((currentBalance / baselineMonthlyBurn) * 30))
    : 999;

  // Scenario Adjustments
  const initialScenarioBalance = Math.max(0, currentBalance - (scenario.oneTimeCapitalOutlay || 0));
  const scenarioMonthlyIncome = recentIncome + (scenario.monthlyDeltaRevenue || 0);
  const scenarioMonthlyExpense = recentExpenses + (scenario.monthlyDeltaExpense || 0);
  const scenarioMonthlyBurn = Math.max(0, scenarioMonthlyExpense - scenarioMonthlyIncome);
  const scenarioNetMonthlyFlow = scenarioMonthlyIncome - scenarioMonthlyExpense;

  const scenarioRunwayDays = scenarioMonthlyBurn > 0
    ? Math.max(0, Math.round((initialScenarioBalance / scenarioMonthlyBurn) * 30))
    : 999;

  const runwayDeltaDays = scenarioRunwayDays - baselineRunwayDays;
  const runwayDeltaMonths = Math.round((runwayDeltaDays / 30) * 10) / 10;

  // Generate monthly simulation timeline
  const timeline: ScenarioResultPoint[] = [];
  let curBaseline = currentBalance;
  let curScenario = initialScenarioBalance;
  let depletionDateBaseline: string | null = null;
  let depletionDateScenario: string | null = null;

  for (let m = 1; m <= scenario.simulationMonths; m++) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() + m, 1);
    const label = monthDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });

    curBaseline = curBaseline + baselineNetMonthlyFlow;
    curScenario = curScenario + scenarioNetMonthlyFlow;

    if (curBaseline <= 0 && !depletionDateBaseline) {
      depletionDateBaseline = label;
    }
    if (curScenario <= 0 && !depletionDateScenario) {
      depletionDateScenario = label;
    }

    timeline.push({
      month: m,
      label,
      baselineBalance: Math.round(curBaseline),
      scenarioBalance: Math.round(curScenario),
      baselineNetFlow: Math.round(baselineNetMonthlyFlow),
      scenarioNetFlow: Math.round(scenarioNetMonthlyFlow)
    });
  }

  // Verdict evaluation
  let verdict: 'Improved' | 'Neutral' | 'Critical Risk' | 'Accelerated Depletion' = 'Neutral';
  let summary = '';

  if (scenarioRunwayDays > baselineRunwayDays + 15) {
    verdict = 'Improved';
    summary = `This decision extends your runway by +${runwayDeltaDays} days (+${runwayDeltaMonths} months). Cash stability significantly increases.`;
  } else if (scenarioRunwayDays < baselineRunwayDays - 30 || (scenarioRunwayDays < 60 && baselineRunwayDays >= 60)) {
    verdict = 'Critical Risk';
    summary = `Warning: This scenario cuts runway by ${Math.abs(runwayDeltaDays)} days, shrinking cash buffer to ${scenarioRunwayDays} days. High probability of insolvency without new capital.`;
  } else if (scenarioRunwayDays < baselineRunwayDays) {
    verdict = 'Accelerated Depletion';
    summary = `This simulation reduces operational runway by ${Math.abs(runwayDeltaDays)} days. Monitor receivables closely.`;
  } else {
    verdict = 'Neutral';
    summary = 'The modeled parameters maintain steady cash parity with minimal overall impact on operational runway.';
  }

  return {
    currentBalance,
    baselineMonthlyBurn: Math.round(baselineMonthlyBurn),
    baselineRunwayDays,
    scenarioMonthlyBurn: Math.round(scenarioMonthlyBurn),
    scenarioRunwayDays,
    runwayDeltaDays,
    runwayDeltaMonths,
    depletionDateBaseline,
    depletionDateScenario,
    timeline,
    verdict,
    summary
  };
}
