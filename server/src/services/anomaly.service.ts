import { BurnAnomaly, Transaction } from '../../../shared/types';

export function detectBurnAnomalies(
  transactions: Transaction[],
  currentBalance: number,
  monthlyBurnRate: number,
  runwayDays: number,
  lowRunwayThreshold: number
): BurnAnomaly[] {
  const anomalies: BurnAnomaly[] = [];
  const now = new Date();

  // 1. Critical Runway Threshold Check
  if (runwayDays <= lowRunwayThreshold && runwayDays > 0) {
    anomalies.push({
      id: 'anomaly-runway-critical',
      type: 'threshold',
      severity: runwayDays <= 15 ? 'critical' : 'high',
      title: 'Runway Depletion Alert',
      description: `Projected cash runway is currently at ${Math.round(runwayDays)} days, which is below your safety threshold of ${lowRunwayThreshold} days.`,
      recommendation: 'Trigger the Cash Preservation Playbook: freeze discretionary hiring, defer non-critical software renewals, and accelerate invoice collections.',
      dateDetected: now.toISOString().split('T')[0]
    });
  }

  // 2. Filter recent expenses (past 30 days) vs historical
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const recentExpenses = transactions.filter(t => t.type === 'expense' && new Date(t.transactionDate) >= thirtyDaysAgo);
  const priorExpenses = transactions.filter(t => t.type === 'expense' && new Date(t.transactionDate) < thirtyDaysAgo);

  if (recentExpenses.length === 0) {
    return anomalies;
  }

  // 3. Statistical Expense Spikes (mean & standard deviation)
  const amounts = recentExpenses.map(t => Number(t.amount));
  const mean = amounts.reduce((acc, val) => acc + val, 0) / amounts.length;
  const variance = amounts.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / (amounts.length || 1);
  const stdDev = Math.sqrt(variance);

  // Identify transactions exceeding mean + 2.0 stdDev or > 30% of total recent burn
  const totalRecentSpend = amounts.reduce((a, b) => a + b, 0);
  const spikeThreshold = Math.max(mean + 2 * stdDev, totalRecentSpend * 0.15);

  for (const exp of recentExpenses) {
    if (Number(exp.amount) >= spikeThreshold && Number(exp.amount) > 1000) {
      anomalies.push({
        id: `anomaly-spike-${exp.id}`,
        type: 'spike',
        severity: Number(exp.amount) > totalRecentSpend * 0.25 ? 'high' : 'medium',
        title: `Unusual Expense Spike in ${exp.category}`,
        description: `Single transaction of $${Number(exp.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} on ${exp.transactionDate} (${exp.description || 'No description'}) exceeds typical volume.`,
        category: exp.category,
        amount: Number(exp.amount),
        recommendation: 'Verify if this is a one-time capital outlay or recurring commitment. Ensure capital expenditure authorization was logged.',
        dateDetected: exp.transactionDate
      });
    }
  }

  // 4. Category Surge Comparison (Last 30 days vs prior 30 days)
  const categoryRecentMap = new Map<string, number>();
  for (const exp of recentExpenses) {
    categoryRecentMap.set(exp.category, (categoryRecentMap.get(exp.category) || 0) + Number(exp.amount));
  }

  const categoryPriorMap = new Map<string, number>();
  for (const exp of priorExpenses) {
    categoryPriorMap.set(exp.category, (categoryPriorMap.get(exp.category) || 0) + Number(exp.amount));
  }

  categoryRecentMap.forEach((recentTotal, cat) => {
    const priorTotal = categoryPriorMap.get(cat) || 0;
    if (priorTotal > 500 && recentTotal > priorTotal * 1.4) {
      const pctIncrease = Math.round(((recentTotal - priorTotal) / priorTotal) * 100);
      anomalies.push({
        id: `anomaly-surge-${cat.replace(/\s+/g, '-').toLowerCase()}`,
        type: 'surge',
        severity: pctIncrease > 75 ? 'high' : 'medium',
        title: `${cat} Spend Surged by ${pctIncrease}%`,
        description: `Category expenditure grew from $${priorTotal.toLocaleString()} to $${recentTotal.toLocaleString()} month-over-month.`,
        category: cat,
        amount: recentTotal - priorTotal,
        recommendation: `Audit itemized receipts in ${cat} to eliminate vendor price creep and redundant seat licensing.`,
        dateDetected: now.toISOString().split('T')[0]
      });
    }
  });

  // 5. Recurring Expense Drag Ratio
  const recurringTotal = recentExpenses
    .filter(t => t.isRecurring)
    .reduce((sum, t) => sum + Number(t.amount), 0);

  if (totalRecentSpend > 0 && (recurringTotal / totalRecentSpend) > 0.65) {
    const recRatio = Math.round((recurringTotal / totalRecentSpend) * 100);
    anomalies.push({
      id: 'anomaly-recurring-heavy',
      type: 'recurring_heavy',
      severity: 'medium',
      title: 'High Fixed Overhead Ratio',
      description: `Recurring contractual expenses constitute ${recRatio}% of total monthly outflows, limiting agility during revenue dips.`,
      recommendation: 'Evaluate shifting non-core fixed SaaS or retainer agreements into flexible usage-based or month-to-month contracts.',
      dateDetected: now.toISOString().split('T')[0]
    });
  }

  return anomalies;
}
