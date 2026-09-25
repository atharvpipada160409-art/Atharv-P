import { Request, Response } from 'express';
import { query } from '../db/db';
import { handleControllerError } from '../utils/errors';
import { detectBurnAnomalies } from '../services/anomaly.service';
import { DashboardSummary, Transaction } from '../../../shared/types';

export async function getDashboardSummary(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    // 1. Get user configuration
    const userRes = await query('SELECT low_runway_threshold_days, currency FROM users WHERE id = $1', [userId]);
    const thresholdDays = userRes.rows[0]?.low_runway_threshold_days || 30;

    // 2. Total balance across all accounts strictly for this user
    const accountsRes = await query('SELECT current_balance FROM accounts WHERE user_id = $1', [userId]);
    const currentBalance = accountsRes.rows.reduce((sum, a) => sum + parseFloat(a.current_balance || 0), 0);

    // 3. Transactions for this user
    const txRes = await query(
      `SELECT id, user_id, account_id, amount, type, category, description, transaction_date, is_recurring, recurring_frequency, created_at
       FROM transactions
       WHERE user_id = $1
       ORDER BY transaction_date DESC`,
      [userId]
    );

    const transactions: Transaction[] = txRes.rows.map(r => ({
      id: r.id,
      userId: r.user_id,
      accountId: r.account_id,
      amount: parseFloat(r.amount),
      type: r.type,
      category: r.category,
      description: r.description,
      transactionDate: r.transaction_date,
      isRecurring: Boolean(r.is_recurring),
      recurringFrequency: r.recurring_frequency,
      createdAt: r.created_at
    }));

    // 4. Calculate 30-day metrics
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const recentTx = transactions.filter(t => new Date(t.transactionDate) >= thirtyDaysAgo);

    const monthlyIncome = recentTx
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const monthlyExpense = recentTx
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const netCashFlow = monthlyIncome - monthlyExpense;
    // Monthly burn rate is the net operational burn (if expenses exceed income, burn is expense - income; else gross expense if income is variable)
    const monthlyBurnRate = Math.max(0, monthlyExpense - monthlyIncome);

    // If net burn is 0 or positive cash flow, calculate runway based on gross expense rate or treat as healthy buffer
    let runwayDays = 999;
    if (monthlyBurnRate > 0) {
      runwayDays = Math.max(0, (currentBalance / monthlyBurnRate) * 30);
    } else if (monthlyExpense > 0 && currentBalance > 0) {
      // Net positive, but show runway if income suddenly halted
      runwayDays = Math.max(0, (currentBalance / monthlyExpense) * 30);
    }

    let runwayStatus: 'critical' | 'warning' | 'healthy' = 'healthy';
    if (runwayDays <= thresholdDays) {
      runwayStatus = 'critical';
    } else if (runwayDays <= thresholdDays * 2) {
      runwayStatus = 'warning';
    }

    // 5. Category breakdown
    const categoryTotals = new Map<string, { total: number; type: 'income' | 'expense' }>();
    recentTx.forEach(t => {
      const existing = categoryTotals.get(t.category);
      if (existing) {
        existing.total += t.amount;
      } else {
        categoryTotals.set(t.category, { total: t.amount, type: t.type });
      }
    });

    const categoryBreakdown = Array.from(categoryTotals.entries()).map(([cat, val]) => {
      const pool = val.type === 'income' ? monthlyIncome : monthlyExpense;
      const percentage = pool > 0 ? Math.round((val.total / pool) * 100) : 0;
      return {
        category: cat,
        total: Math.round(val.total * 100) / 100,
        percentage,
        type: val.type
      };
    }).sort((a, b) => b.total - a.total);

    // 6. Trend points across past 6 months
    const trendMap = new Map<string, { income: number; expense: number }>();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      trendMap.set(key, { income: 0, expense: 0 });
    }

    transactions.forEach(t => {
      const d = new Date(t.transactionDate);
      const key = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      if (trendMap.has(key)) {
        const item = trendMap.get(key)!;
        if (t.type === 'income') item.income += t.amount;
        else item.expense += t.amount;
      }
    });

    let runningAccumulator = currentBalance - (monthlyIncome - monthlyExpense);
    const trendPoints = Array.from(trendMap.entries()).map(([date, vals]) => {
      const net = vals.income - vals.expense;
      runningAccumulator += net;
      return {
        date,
        income: Math.round(vals.income),
        expense: Math.round(vals.expense),
        net: Math.round(net),
        balance: Math.round(runningAccumulator)
      };
    });

    // 7. Detect Anomalies
    const anomalies = detectBurnAnomalies(
      transactions,
      currentBalance,
      monthlyBurnRate || monthlyExpense,
      runwayDays,
      thresholdDays
    );

    const summary: DashboardSummary = {
      currentBalance: Math.round(currentBalance * 100) / 100,
      monthlyIncome: Math.round(monthlyIncome * 100) / 100,
      monthlyBurnRate: Math.round((monthlyBurnRate || monthlyExpense) * 100) / 100,
      netCashFlow: Math.round(netCashFlow * 100) / 100,
      runwayDays: Math.round(runwayDays),
      runwayStatus,
      anomalies,
      categoryBreakdown,
      trendPoints
    };

    res.status(200).json({ success: true, summary });
  } catch (error) {
    handleControllerError(res, error, 'Failed to compute financial dashboard metrics.');
  }
}
