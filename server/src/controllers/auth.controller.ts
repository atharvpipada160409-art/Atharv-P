import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { query } from '../db/db';
import { config } from '../config/env';
import { handleControllerError } from '../utils/errors';
import { RegisterUserInput, LoginUserInput } from '../../../shared/schemas/auth.schema';

export async function register(req: Request<{}, {}, RegisterUserInput>, res: Response): Promise<void> {
  try {
    const { email, password, fullName, entityType, currency } = req.body;

    // Check if user already exists
    const existing = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length > 0) {
      res.status(409).json({ success: false, error: 'An account with this email address already exists.' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = crypto.randomUUID();

    const insertResult = await query(
      `INSERT INTO users (id, email, password_hash, full_name, entity_type, currency, low_runway_threshold_days)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, email, full_name, entity_type, currency, low_runway_threshold_days, created_at`,
      [userId, email.toLowerCase(), passwordHash, fullName, entityType || 'individual', currency || 'USD', 30]
    );

    const user = insertResult.rows[0];

    // Create a primary default checking account
    const accountId = crypto.randomUUID();
    await query(
      `INSERT INTO accounts (id, user_id, account_name, account_type, current_balance)
       VALUES ($1, $2, $3, $4, $5)`,
      [accountId, user.id, 'Primary Operating Account', 'operating', 10000.00]
    );

    const token = jwt.sign(
      { id: user.id, email: user.email, entityType: user.entity_type, currency: user.currency },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        entityType: user.entity_type,
        currency: user.currency,
        lowRunwayThresholdDays: user.low_runway_threshold_days,
        createdAt: user.created_at
      }
    });
  } catch (error) {
    handleControllerError(res, error, 'Registration failed.');
  }
}

export async function login(req: Request<{}, {}, LoginUserInput>, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    const result = await query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    if (result.rows.length === 0) {
      res.status(401).json({ success: false, error: 'Invalid email or password.' });
      return;
    }

    const user = result.rows[0];
    const passwordValid = await bcrypt.compare(password, user.password_hash);
    if (!passwordValid) {
      res.status(401).json({ success: false, error: 'Invalid email or password.' });
      return;
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, entityType: user.entity_type, currency: user.currency },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      message: 'Authentication successful.',
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        entityType: user.entity_type,
        currency: user.currency,
        lowRunwayThresholdDays: user.low_runway_threshold_days,
        createdAt: user.created_at
      }
    });
  } catch (error) {
    handleControllerError(res, error, 'Authentication failed.');
  }
}

export async function getMe(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const result = await query(
      'SELECT id, email, full_name, entity_type, currency, low_runway_threshold_days, created_at, updated_at FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: 'User profile not found.' });
      return;
    }

    const user = result.rows[0];
    const accountsResult = await query('SELECT * FROM accounts WHERE user_id = $1 ORDER BY created_at ASC', [userId]);

    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        entityType: user.entity_type,
        currency: user.currency,
        lowRunwayThresholdDays: user.low_runway_threshold_days,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      },
      accounts: accountsResult.rows.map(a => ({
        id: a.id,
        userId: a.user_id,
        accountName: a.account_name,
        accountType: a.account_type,
        currentBalance: parseFloat(a.current_balance),
        createdAt: a.created_at,
        updatedAt: a.updated_at
      }))
    });
  } catch (error) {
    handleControllerError(res, error, 'Failed to fetch user profile.');
  }
}
