import { Request, Response } from 'express';
import crypto from 'crypto';
import { query } from '../db/db';
import { handleControllerError } from '../utils/errors';
import { TransactionInput, UpdateTransactionInput } from '../../../shared/schemas/transaction.schema';

export async function getTransactions(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { category, type, startDate, endDate, search, limit = '100', offset = '0' } = req.query;

    let sql = `
      SELECT t.id, t.user_id, t.account_id, a.account_name, t.amount, t.type, t.category,
             t.description, t.transaction_date, t.is_recurring, t.recurring_frequency, t.created_at
      FROM transactions t
      LEFT JOIN accounts a ON t.account_id = a.id
      WHERE t.user_id = $1
    `;
    const params: any[] = [userId];

    if (category && typeof category === 'string' && category.trim() !== '') {
      params.push(category.trim());
      sql += ` AND LOWER(t.category) = LOWER($${params.length})`;
    }

    if (type && (type === 'income' || type === 'expense')) {
      params.push(type);
      sql += ` AND t.type = $${params.length}`;
    }

    if (startDate && typeof startDate === 'string') {
      params.push(startDate);
      sql += ` AND t.transaction_date >= $${params.length}`;
    }

    if (endDate && typeof endDate === 'string') {
      params.push(endDate);
      sql += ` AND t.transaction_date <= $${params.length}`;
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      params.push(`%${search.trim().toLowerCase()}%`);
      sql += ` AND (LOWER(t.description) LIKE $${params.length} OR LOWER(t.category) LIKE $${params.length})`;
    }

    sql += ` ORDER BY t.transaction_date DESC, t.created_at DESC`;

    const parsedLimit = Math.min(250, parseInt(limit as string, 10) || 100);
    const parsedOffset = Math.max(0, parseInt(offset as string, 10) || 0);

    params.push(parsedLimit, parsedOffset);
    sql += ` LIMIT $${params.length - 1} OFFSET $${params.length}`;

    const result = await query(sql, params);

    const transactions = result.rows.map(r => ({
      id: r.id,
      userId: r.user_id,
      accountId: r.account_id,
      accountName: r.account_name || 'Account',
      amount: parseFloat(r.amount),
      type: r.type,
      category: r.category,
      description: r.description || '',
      transactionDate: r.transaction_date,
      isRecurring: Boolean(r.is_recurring),
      recurringFrequency: r.recurring_frequency,
      createdAt: r.created_at
    }));

    res.status(200).json({ success: true, count: transactions.length, transactions });
  } catch (error) {
    handleControllerError(res, error, 'Failed to fetch transactions.');
  }
}

export async function createTransaction(req: Request<{}, {}, TransactionInput>, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { accountId, amount, type, category, description, transactionDate, isRecurring, recurringFrequency } = req.body;

    // Verify account ownership
    const accountCheck = await query('SELECT id, current_balance FROM accounts WHERE id = $1 AND user_id = $2', [accountId, userId]);
    if (accountCheck.rows.length === 0) {
      res.status(400).json({ success: false, error: 'Target account not found or does not belong to you.' });
      return;
    }

    const txId = crypto.randomUUID();

    // Insert transaction with strict user isolation
    const insertRes = await query(
      `INSERT INTO transactions (id, user_id, account_id, amount, type, category, description, transaction_date, is_recurring, recurring_frequency)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [txId, userId, accountId, amount, type, category, description || '', transactionDate, isRecurring, recurringFrequency]
    );

    // Update account balance
    const balanceDelta = type === 'income' ? amount : -amount;
    await query(
      'UPDATE accounts SET current_balance = current_balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3',
      [balanceDelta, accountId, userId]
    );

    const inserted = insertRes.rows[0];
    res.status(201).json({
      success: true,
      message: 'Transaction recorded successfully.',
      transaction: {
        id: inserted.id,
        userId: inserted.user_id,
        accountId: inserted.account_id,
        amount: parseFloat(inserted.amount),
        type: inserted.type,
        category: inserted.category,
        description: inserted.description,
        transactionDate: inserted.transaction_date,
        isRecurring: Boolean(inserted.is_recurring),
        recurringFrequency: inserted.recurring_frequency,
        createdAt: inserted.created_at
      }
    });
  } catch (error) {
    handleControllerError(res, error, 'Failed to create transaction.');
  }
}

export async function updateTransaction(req: Request<{ id: string }, {}, UpdateTransactionInput>, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    // Retrieve existing transaction with strict user isolation
    const existingRes = await query('SELECT * FROM transactions WHERE id = $1 AND user_id = $2', [id, userId]);
    if (existingRes.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Transaction not found.' });
      return;
    }

    const oldTx = existingRes.rows[0];
    const oldAmount = parseFloat(oldTx.amount);
    const oldType = oldTx.type;
    const oldAccountId = oldTx.account_id;

    const newAmount = req.body.amount !== undefined ? req.body.amount : oldAmount;
    const newType = req.body.type || oldType;
    const newAccountId = req.body.accountId || oldAccountId;
    const newCategory = req.body.category || oldTx.category;
    const newDescription = req.body.description !== undefined ? req.body.description : oldTx.description;
    const newDate = req.body.transactionDate || oldTx.transaction_date;
    const newRecurring = req.body.isRecurring !== undefined ? req.body.isRecurring : oldTx.is_recurring;
    const newFreq = req.body.recurringFrequency || oldTx.recurring_frequency;

    // Verify target account ownership
    const accountCheck = await query('SELECT id FROM accounts WHERE id = $1 AND user_id = $2', [newAccountId, userId]);
    if (accountCheck.rows.length === 0) {
      res.status(400).json({ success: false, error: 'Target account not found.' });
      return;
    }

    // Reverse old balance impact
    const reverseOldDelta = oldType === 'income' ? -oldAmount : oldAmount;
    await query(
      'UPDATE accounts SET current_balance = current_balance + $1 WHERE id = $2 AND user_id = $3',
      [reverseOldDelta, oldAccountId, userId]
    );

    // Apply new balance impact
    const applyNewDelta = newType === 'income' ? newAmount : -newAmount;
    await query(
      'UPDATE accounts SET current_balance = current_balance + $1 WHERE id = $2 AND user_id = $3',
      [applyNewDelta, newAccountId, userId]
    );

    // Update transaction
    const updateRes = await query(
      `UPDATE transactions
       SET account_id = $1, amount = $2, type = $3, category = $4, description = $5,
           transaction_date = $6, is_recurring = $7, recurring_frequency = $8
       WHERE id = $9 AND user_id = $10
       RETURNING *`,
      [newAccountId, newAmount, newType, newCategory, newDescription, newDate, newRecurring, newFreq, id, userId]
    );

    const updated = updateRes.rows[0];
    res.status(200).json({
      success: true,
      message: 'Transaction updated successfully.',
      transaction: {
        id: updated.id,
        userId: updated.user_id,
        accountId: updated.account_id,
        amount: parseFloat(updated.amount),
        type: updated.type,
        category: updated.category,
        description: updated.description,
        transactionDate: updated.transaction_date,
        isRecurring: Boolean(updated.is_recurring),
        recurringFrequency: updated.recurring_frequency,
        createdAt: updated.created_at
      }
    });
  } catch (error) {
    handleControllerError(res, error, 'Failed to update transaction.');
  }
}

export async function deleteTransaction(req: Request<{ id: string }>, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    // Verify ownership and get transaction details
    const existingRes = await query('SELECT * FROM transactions WHERE id = $1 AND user_id = $2', [id, userId]);
    if (existingRes.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Transaction not found.' });
      return;
    }

    const tx = existingRes.rows[0];
    const amount = parseFloat(tx.amount);
    const type = tx.type;
    const accountId = tx.account_id;

    // Delete transaction
    await query('DELETE FROM transactions WHERE id = $1 AND user_id = $2', [id, userId]);

    // Restore account balance
    const restoreDelta = type === 'income' ? -amount : amount;
    await query(
      'UPDATE accounts SET current_balance = current_balance + $1 WHERE id = $2 AND user_id = $3',
      [restoreDelta, accountId, userId]
    );

    res.status(200).json({
      success: true,
      message: 'Transaction deleted successfully.'
    });
  } catch (error) {
    handleControllerError(res, error, 'Failed to delete transaction.');
  }
}
