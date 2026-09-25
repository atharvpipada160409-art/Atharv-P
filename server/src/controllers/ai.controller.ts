import { Request, Response } from 'express';
import crypto from 'crypto';
import { query } from '../db/db';
import { handleControllerError } from '../utils/errors';
import { generateHealthAudit, askAdvisorChat } from '../services/gemini.service';
import { HealthAuditRequest, AdvisorChatRequest } from '../../../shared/schemas/ai.schema';
import { Transaction, Account } from '../../../shared/types';

export async function runHealthAudit(req: Request<{}, {}, HealthAuditRequest>, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { horizonDays, financialGoal, customInquiry } = req.body;

    // 1. Fetch user profile
    const userRes = await query('SELECT entity_type, currency FROM users WHERE id = $1', [userId]);
    const entityType = userRes.rows[0]?.entity_type || 'individual';
    const currency = userRes.rows[0]?.currency || 'USD';

    // 2. Fetch accounts
    const accountsRes = await query('SELECT * FROM accounts WHERE user_id = $1', [userId]);
    const accounts: Account[] = accountsRes.rows.map(a => ({
      id: a.id,
      userId: a.user_id,
      accountName: a.account_name,
      accountType: a.account_type,
      currentBalance: parseFloat(a.current_balance),
      createdAt: a.created_at,
      updatedAt: a.updated_at
    }));

    const totalBalance = accounts.reduce((sum, a) => sum + a.currentBalance, 0);

    // 3. Fetch transactions
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

    // 4. Calculate metrics
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const recentTx = transactions.filter(t => new Date(t.transactionDate) >= thirtyDaysAgo);

    const monthlyIncome = recentTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const monthlyExpense = recentTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const monthlyBurnRate = Math.max(0, monthlyExpense - monthlyIncome) || monthlyExpense;

    let runwayDays = 999;
    if (monthlyBurnRate > 0) {
      runwayDays = Math.max(0, (totalBalance / monthlyBurnRate) * 30);
    }

    // 5. Call Gemini AI Health Audit
    const auditResult = await generateHealthAudit(
      accounts,
      transactions,
      {
        totalBalance,
        monthlyIncome,
        monthlyBurnRate,
        runwayDays,
        entityType,
        currency
      },
      { horizonDays, financialGoal, customInquiry }
    );

    // 6. Record audit snapshot in ai_insights table with strict user isolation
    const insightId = crypto.randomUUID();
    await query(
      `INSERT INTO ai_insights (id, user_id, insight_type, summary, detailed_json)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        insightId,
        userId,
        'health_audit',
        `Financial Health Audit (${auditResult.status}, Score: ${auditResult.healthScore})`,
        JSON.stringify(auditResult)
      ]
    );

    res.status(200).json({
      success: true,
      audit: auditResult
    });
  } catch (error) {
    handleControllerError(res, error, 'Failed to execute AI Financial Health Audit.');
  }
}

export async function getLatestAudit(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const result = await query(
      `SELECT * FROM ai_insights
       WHERE user_id = $1 AND insight_type = 'health_audit'
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId]
    );

    if (result.rows.length === 0) {
      res.status(200).json({ success: true, audit: null });
      return;
    }

    const row = result.rows[0];
    const auditData = typeof row.detailed_json === 'string' ? JSON.parse(row.detailed_json) : row.detailed_json;

    res.status(200).json({
      success: true,
      audit: auditData,
      generatedAt: row.created_at
    });
  } catch (error) {
    handleControllerError(res, error, 'Failed to fetch latest audit.');
  }
}

export async function chatAdvisor(req: Request<{}, {}, AdvisorChatRequest>, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { message, history = [] } = req.body;

    // Fetch user context
    const userRes = await query('SELECT entity_type, currency FROM users WHERE id = $1', [userId]);
    const entityType = userRes.rows[0]?.entity_type || 'individual';
    const currency = userRes.rows[0]?.currency || 'USD';

    const accountsRes = await query('SELECT * FROM accounts WHERE user_id = $1', [userId]);
    const accounts: Account[] = accountsRes.rows.map(a => ({
      id: a.id,
      userId: a.user_id,
      accountName: a.account_name,
      accountType: a.account_type,
      currentBalance: parseFloat(a.current_balance),
      createdAt: a.created_at,
      updatedAt: a.updated_at
    }));

    const totalBalance = accounts.reduce((sum, a) => sum + a.currentBalance, 0);

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

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const recentTx = transactions.filter(t => new Date(t.transactionDate) >= thirtyDaysAgo);

    const monthlyIncome = recentTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const monthlyExpense = recentTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const monthlyBurnRate = Math.max(0, monthlyExpense - monthlyIncome) || monthlyExpense;

    let runwayDays = 999;
    if (monthlyBurnRate > 0) {
      runwayDays = Math.max(0, (totalBalance / monthlyBurnRate) * 30);
    }

    const response = await askAdvisorChat(
      message,
      history,
      accounts,
      transactions,
      {
        totalBalance,
        monthlyIncome,
        monthlyBurnRate,
        runwayDays,
        entityType,
        currency
      }
    );

    res.status(200).json({
      success: true,
      ...response
    });
  } catch (error) {
    handleControllerError(res, error, 'Failed to process AI Financial Advisor message.');
  }
}
