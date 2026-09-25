import { Request, Response } from 'express';
import { query } from '../db/db';
import { handleControllerError } from '../utils/errors';
import { calculateProjections, simulateScenario } from '../services/forecasting.service';
import { ScenarioPlannerInput } from '../../../shared/schemas/scenario.schema';
import { Transaction } from '../../../shared/types';

export async function getCashFlowProjections(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const horizonParam = parseInt(req.query.horizonDays as string, 10);
    const horizonDays: 30 | 60 | 90 = horizonParam === 30 || horizonParam === 60 ? horizonParam : 90;

    // Fetch accounts balance
    const accountsRes = await query('SELECT current_balance FROM accounts WHERE user_id = $1', [userId]);
    const currentBalance = accountsRes.rows.reduce((sum, a) => sum + parseFloat(a.current_balance || 0), 0);

    // Fetch transactions
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

    const forecast = calculateProjections(transactions, currentBalance, horizonDays);

    res.status(200).json({
      success: true,
      forecast
    });
  } catch (error) {
    handleControllerError(res, error, 'Failed to compute cash flow projections.');
  }
}

export async function processScenario(req: Request<{}, {}, ScenarioPlannerInput>, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const scenarioInput = req.body;

    // Fetch accounts balance
    const accountsRes = await query('SELECT current_balance FROM accounts WHERE user_id = $1', [userId]);
    const currentBalance = accountsRes.rows.reduce((sum, a) => sum + parseFloat(a.current_balance || 0), 0);

    // Fetch transactions
    const txRes = await query(
      `SELECT id, user_id, account_id, amount, type, category, description, transaction_date, is_recurring, recurring_frequency, created_at
       FROM transactions
       WHERE user_id = $1`,
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

    const result = simulateScenario(transactions, currentBalance, scenarioInput);

    res.status(200).json({
      success: true,
      scenarioResult: result
    });
  } catch (error) {
    handleControllerError(res, error, 'Failed to process scenario simulation.');
  }
}
