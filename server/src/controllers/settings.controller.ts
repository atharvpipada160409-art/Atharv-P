import { Request, Response } from 'express';
import crypto from 'crypto';
import { query } from '../db/db';
import { handleControllerError } from '../utils/errors';
import { UpdateProfileInput } from '../../../shared/schemas/auth.schema';
import { AccountInput } from '../../../shared/schemas/transaction.schema';

export async function updateProfile(req: Request<{}, {}, UpdateProfileInput>, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { fullName, entityType, currency, lowRunwayThresholdDays } = req.body;

    const userRes = await query('SELECT * FROM users WHERE id = $1', [userId]);
    if (userRes.rows.length === 0) {
      res.status(404).json({ success: false, error: 'User not found.' });
      return;
    }

    const current = userRes.rows[0];
    const newName = fullName || current.full_name;
    const newType = entityType || current.entity_type;
    const newCurrency = currency || current.currency;
    const newThreshold = lowRunwayThresholdDays !== undefined ? lowRunwayThresholdDays : current.low_runway_threshold_days;

    const updated = await query(
      `UPDATE users
       SET full_name = $1, entity_type = $2, currency = $3, low_runway_threshold_days = $4, updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING id, email, full_name, entity_type, currency, low_runway_threshold_days, updated_at`,
      [newName, newType, newCurrency, newThreshold, userId]
    );

    const user = updated.rows[0];
    res.status(200).json({
      success: true,
      message: 'Profile configuration updated successfully.',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        entityType: user.entity_type,
        currency: user.currency,
        lowRunwayThresholdDays: user.low_runway_threshold_days,
        updatedAt: user.updated_at
      }
    });
  } catch (error) {
    handleControllerError(res, error, 'Failed to update profile.');
  }
}

export async function getAccounts(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const result = await query(
      'SELECT id, user_id, account_name, account_type, current_balance, created_at, updated_at FROM accounts WHERE user_id = $1 ORDER BY created_at ASC',
      [userId]
    );

    const accounts = result.rows.map(a => ({
      id: a.id,
      userId: a.user_id,
      accountName: a.account_name,
      accountType: a.account_type,
      currentBalance: parseFloat(a.current_balance),
      createdAt: a.created_at,
      updatedAt: a.updated_at
    }));

    res.status(200).json({ success: true, accounts });
  } catch (error) {
    handleControllerError(res, error, 'Failed to retrieve accounts.');
  }
}

export async function createAccount(req: Request<{}, {}, AccountInput>, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { accountName, accountType, currentBalance } = req.body;
    const accountId = crypto.randomUUID();

    const result = await query(
      `INSERT INTO accounts (id, user_id, account_name, account_type, current_balance)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [accountId, userId, accountName, accountType, currentBalance || 0.00]
    );

    const account = result.rows[0];
    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      account: {
        id: account.id,
        userId: account.user_id,
        accountName: account.account_name,
        accountType: account.account_type,
        currentBalance: parseFloat(account.current_balance),
        createdAt: account.created_at
      }
    });
  } catch (error) {
    handleControllerError(res, error, 'Failed to create account.');
  }
}

export async function updateAccount(req: Request<{ id: string }, {}, Partial<AccountInput>>, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const existingRes = await query('SELECT * FROM accounts WHERE id = $1 AND user_id = $2', [id, userId]);
    if (existingRes.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Account not found.' });
      return;
    }

    const current = existingRes.rows[0];
    const name = req.body.accountName || current.account_name;
    const type = req.body.accountType || current.account_type;
    const balance = req.body.currentBalance !== undefined ? req.body.currentBalance : parseFloat(current.current_balance);

    const updated = await query(
      `UPDATE accounts
       SET account_name = $1, account_type = $2, current_balance = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 AND user_id = $5
       RETURNING *`,
      [name, type, balance, id, userId]
    );

    const acc = updated.rows[0];
    res.status(200).json({
      success: true,
      message: 'Account updated successfully.',
      account: {
        id: acc.id,
        userId: acc.user_id,
        accountName: acc.account_name,
        accountType: acc.account_type,
        currentBalance: parseFloat(acc.current_balance),
        updatedAt: acc.updated_at
      }
    });
  } catch (error) {
    handleControllerError(res, error, 'Failed to update account.');
  }
}

export async function deleteAccount(req: Request<{ id: string }>, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    // Check how many accounts user has (prevent deleting the only account)
    const countRes = await query('SELECT COUNT(*) FROM accounts WHERE user_id = $1', [userId]);
    if (parseInt(countRes.rows[0].count, 10) <= 1) {
      res.status(400).json({ success: false, error: 'Cannot delete the only remaining account. Add another account first.' });
      return;
    }

    await query('DELETE FROM accounts WHERE id = $1 AND user_id = $2', [id, userId]);

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully.'
    });
  } catch (error) {
    handleControllerError(res, error, 'Failed to delete account.');
  }
}
