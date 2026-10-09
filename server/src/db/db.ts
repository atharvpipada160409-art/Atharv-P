import { Pool, QueryResult } from 'pg';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { config } from '../config/env';

let pgPool: Pool | null = null;
let useFallback = false;

// Fallback in-memory / file-persisted store for when PostgreSQL is not running locally
interface StorageState {
  users: any[];
  accounts: any[];
  transactions: any[];
  forecast_snapshots: any[];
  ai_insights: any[];
}

const FALLBACK_DB_FILE = path.resolve(__dirname, '../../../data_storage.json');

const memoryStore: StorageState = {
  users: [],
  accounts: [],
  transactions: [],
  forecast_snapshots: [],
  ai_insights: []
};

function loadFallbackStore(): void {
  try {
    if (fs.existsSync(FALLBACK_DB_FILE)) {
      const data = fs.readFileSync(FALLBACK_DB_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      memoryStore.users = parsed.users || [];
      memoryStore.accounts = parsed.accounts || [];
      memoryStore.transactions = parsed.transactions || [];
      memoryStore.forecast_snapshots = parsed.forecast_snapshots || [];
      memoryStore.ai_insights = parsed.ai_insights || [];
    }
  } catch (err) {
    console.warn('[Database] Could not load local storage file, using in-memory store:', err);
  }
}

function saveFallbackStore(): void {
  try {
    const dir = path.dirname(FALLBACK_DB_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(FALLBACK_DB_FILE, JSON.stringify(memoryStore, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[Database] Could not save local storage file:', err);
  }
}

export async function initDb(): Promise<void> {
  loadFallbackStore();

  try {
    pgPool = new Pool({
      connectionString: config.databaseUrl,
      connectionTimeoutMillis: 3000,
    });

    // Test connection
    const client = await pgPool.connect();
    console.log('[Database] Successfully connected to PostgreSQL.');

    const schemaPath = path.resolve(__dirname, 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, 'utf-8');
      await client.query(sql);
      console.log('[Database] PostgreSQL schema verified/initialized.');
    }
    client.release();
    useFallback = false;
  } catch (err: any) {
    console.warn(`[Database] PostgreSQL not available (${err.message || 'connection failed'}). Initializing resilient embedded SQL storage engine.`);
    useFallback = true;
    if (pgPool) {
      await pgPool.end().catch(() => {});
      pgPool = null;
    }
  }
}

export async function query<T = any>(text: string, params: any[] = []): Promise<{ rows: T[]; rowCount: number }> {
  if (!useFallback && pgPool) {
    try {
      const result: QueryResult<any> = await pgPool.query(text, params);
      return {
        rows: result.rows,
        rowCount: result.rowCount ?? result.rows.length,
      };
    } catch (err: any) {
      console.error('[Database PG Error]:', err.message);
      throw err;
    }
  }

  // Fallback engine handling standard parameterized queries ($1, $2, etc.)
  return executeFallbackQuery<T>(text, params);
}

function executeFallbackQuery<T = any>(sql: string, params: any[]): { rows: T[]; rowCount: number } {
  const normalizedSql = sql.trim().replace(/\s+/g, ' ');
  const upper = normalizedSql.toUpperCase();

  // Handle BEGIN / COMMIT / ROLLBACK
  if (upper.startsWith('BEGIN') || upper.startsWith('COMMIT') || upper.startsWith('ROLLBACK')) {
    return { rows: [], rowCount: 0 };
  }

  // Handle USERS
  if (upper.includes('FROM USERS') || upper.startsWith('INSERT INTO USERS') || upper.startsWith('UPDATE USERS')) {
    // INSERT INTO users
    if (upper.startsWith('INSERT INTO USERS')) {
      const hasExplicitId = params.length >= 7;
      const id = hasExplicitId ? params[0] : crypto.randomUUID();
      const offset = hasExplicitId ? 1 : 0;
      const email = params[offset];
      const password_hash = params[offset + 1];
      const full_name = params[offset + 2];
      const entity_type = params[offset + 3] || 'individual';
      const currency = params[offset + 4] || 'USD';
      const low_runway_threshold_days = params[offset + 5] || 30;
      const now = new Date().toISOString();

      const newUser = {
        id,
        email,
        password_hash,
        full_name,
        entity_type,
        currency,
        low_runway_threshold_days,
        created_at: now,
        updated_at: now
      };
      memoryStore.users.push(newUser);
      saveFallbackStore();
      return { rows: [newUser as unknown as T], rowCount: 1 };
    }

    // SELECT * FROM users WHERE email = $1
    if (upper.includes('WHERE EMAIL = $1')) {
      const found = memoryStore.users.filter(u => u.email.toLowerCase() === (params[0] || '').toLowerCase());
      return { rows: (found.length ? [found[0]] : []) as unknown as T[], rowCount: found.length };
    }

    // SELECT * FROM users WHERE id = $1
    if (upper.includes('WHERE ID = $1')) {
      const found = memoryStore.users.filter(u => u.id === params[0]);
      return { rows: (found.length ? [found[0]] : []) as unknown as T[], rowCount: found.length };
    }

    // UPDATE users SET ... WHERE id = $...
    if (upper.startsWith('UPDATE USERS')) {
      const userId = params[params.length - 1];
      const userIndex = memoryStore.users.findIndex(u => u.id === userId);
      if (userIndex !== -1) {
        // e.g. full_name = $1, entity_type = $2, currency = $3, low_runway_threshold_days = $4
        if (params.length >= 4) {
          if (params[0] !== undefined) memoryStore.users[userIndex].full_name = params[0];
          if (params[1] !== undefined) memoryStore.users[userIndex].entity_type = params[1];
          if (params[2] !== undefined) memoryStore.users[userIndex].currency = params[2];
          if (params[3] !== undefined) memoryStore.users[userIndex].low_runway_threshold_days = params[3];
        }
        memoryStore.users[userIndex].updated_at = new Date().toISOString();
        saveFallbackStore();
        return { rows: [memoryStore.users[userIndex] as unknown as T], rowCount: 1 };
      }
      return { rows: [], rowCount: 0 };
    }
  }

  // Handle ACCOUNTS
  if (upper.includes('ACCOUNTS')) {
    // SELECT * FROM accounts WHERE user_id = $1
    if (upper.startsWith('SELECT') && upper.includes('WHERE USER_ID = $1')) {
      const found = memoryStore.accounts.filter(a => a.user_id === params[0]);
      return { rows: found as unknown as T[], rowCount: found.length };
    }

    // SELECT * FROM accounts WHERE id = $1 AND user_id = $2
    if (upper.startsWith('SELECT') && upper.includes('WHERE ID = $1 AND USER_ID = $2')) {
      const found = memoryStore.accounts.filter(a => a.id === params[0] && a.user_id === params[1]);
      return { rows: found as unknown as T[], rowCount: found.length };
    }

    // INSERT INTO accounts
    if (upper.startsWith('INSERT INTO ACCOUNTS')) {
      const hasExplicitId = params.length >= 5;
      const id = hasExplicitId ? params[0] : crypto.randomUUID();
      const offset = hasExplicitId ? 1 : 0;
      const user_id = params[offset];
      const account_name = params[offset + 1];
      const account_type = params[offset + 2];
      const current_balance = parseFloat(params[offset + 3] || 0);
      const now = new Date().toISOString();

      const newAccount = {
        id,
        user_id,
        account_name,
        account_type,
        current_balance,
        created_at: now,
        updated_at: now
      };
      memoryStore.accounts.push(newAccount);
      saveFallbackStore();
      return { rows: [newAccount as unknown as T], rowCount: 1 };
    }

    // UPDATE accounts SET current_balance = current_balance + $1 ... WHERE id = $2 AND user_id = $3
    if (upper.startsWith('UPDATE ACCOUNTS SET CURRENT_BALANCE = CURRENT_BALANCE + $1')) {
      const delta = parseFloat(params[0]);
      const accId = params[1];
      const userId = params[2];
      const acc = memoryStore.accounts.find(a => a.id === accId && a.user_id === userId);
      if (acc) {
        acc.current_balance = parseFloat((Number(acc.current_balance) + delta).toFixed(2));
        acc.updated_at = new Date().toISOString();
        saveFallbackStore();
        return { rows: [acc as unknown as T], rowCount: 1 };
      }
      return { rows: [], rowCount: 0 };
    }

    // General UPDATE accounts SET account_name = $1, account_type = $2, current_balance = $3 WHERE id = $4 AND user_id = $5
    if (upper.startsWith('UPDATE ACCOUNTS SET')) {
      const accId = params[params.length - 2];
      const userId = params[params.length - 1];
      const acc = memoryStore.accounts.find(a => a.id === accId && a.user_id === userId);
      if (acc) {
        if (params[0] !== undefined) acc.account_name = params[0];
        if (params[1] !== undefined) acc.account_type = params[1];
        if (params[2] !== undefined) acc.current_balance = parseFloat(params[2]);
        acc.updated_at = new Date().toISOString();
        saveFallbackStore();
        return { rows: [acc as unknown as T], rowCount: 1 };
      }
      return { rows: [], rowCount: 0 };
    }

    // DELETE FROM accounts WHERE id = $1 AND user_id = $2
    if (upper.startsWith('DELETE FROM ACCOUNTS')) {
      const accId = params[0];
      const userId = params[1];
      const prevLen = memoryStore.accounts.length;
      memoryStore.accounts = memoryStore.accounts.filter(a => !(a.id === accId && a.user_id === userId));
      // Cascade delete transactions
      memoryStore.transactions = memoryStore.transactions.filter(t => !(t.account_id === accId && t.user_id === userId));
      saveFallbackStore();
      return { rows: [], rowCount: prevLen - memoryStore.accounts.length };
    }
  }

  // Handle TRANSACTIONS
  if (upper.includes('TRANSACTIONS')) {
    // SELECT with JOIN accounts
    if (upper.startsWith('SELECT') && upper.includes('FROM TRANSACTIONS')) {
      let results = memoryStore.transactions.filter(t => t.user_id === params[0]);

      // Category filter check
      if (upper.includes('CATEGORY = $')) {
        const catParamIndex = params.findIndex((p, idx) => idx > 0 && typeof p === 'string' && p.length > 0 && p !== 'income' && p !== 'expense');
        if (catParamIndex !== -1 && params[catParamIndex]) {
          results = results.filter(t => t.category.toLowerCase() === params[catParamIndex].toLowerCase());
        }
      }

      // Type filter check
      if (upper.includes('TYPE = $')) {
        const typeParam = params.find(p => p === 'income' || p === 'expense');
        if (typeParam) {
          results = results.filter(t => t.type === typeParam);
        }
      }

      // Sort by date DESC
      results.sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime());

      // Attach account_name
      const populated = results.map(t => {
        const acc = memoryStore.accounts.find(a => a.id === t.account_id);
        return {
          ...t,
          account_name: acc ? acc.account_name : 'Unknown Account'
        };
      });

      return { rows: populated as unknown as T[], rowCount: populated.length };
    }

    // INSERT INTO transactions
    if (upper.startsWith('INSERT INTO TRANSACTIONS')) {
      const hasExplicitId = params.length >= 10;
      const id = hasExplicitId ? params[0] : crypto.randomUUID();
      const offset = hasExplicitId ? 1 : 0;
      const user_id = params[offset];
      const account_id = params[offset + 1];
      const amount = parseFloat(params[offset + 2]);
      const type = params[offset + 3];
      const category = params[offset + 4];
      const description = params[offset + 5] || '';
      const transaction_date = params[offset + 6];
      const is_recurring = Boolean(params[offset + 7]);
      const recurring_frequency = params[offset + 8] || 'none';
      const created_at = new Date().toISOString();

      const newTx = {
        id,
        user_id,
        account_id,
        amount,
        type,
        category,
        description,
        transaction_date,
        is_recurring,
        recurring_frequency,
        created_at
      };
      memoryStore.transactions.push(newTx);
      saveFallbackStore();
      return { rows: [newTx as unknown as T], rowCount: 1 };
    }

    // UPDATE transactions SET ... WHERE id = $... AND user_id = $...
    if (upper.startsWith('UPDATE TRANSACTIONS SET')) {
      const txId = params[params.length - 2];
      const userId = params[params.length - 1];
      const tx = memoryStore.transactions.find(t => t.id === txId && t.user_id === userId);
      if (tx) {
        tx.account_id = params[0];
        tx.amount = parseFloat(params[1]);
        tx.type = params[2];
        tx.category = params[3];
        tx.description = params[4] || '';
        tx.transaction_date = params[5];
        tx.is_recurring = Boolean(params[6]);
        tx.recurring_frequency = params[7] || 'none';
        saveFallbackStore();
        return { rows: [tx as unknown as T], rowCount: 1 };
      }
      return { rows: [], rowCount: 0 };
    }

    // DELETE FROM transactions WHERE id = $1 AND user_id = $2
    if (upper.startsWith('DELETE FROM TRANSACTIONS')) {
      const txId = params[0];
      const userId = params[1];
      const target = memoryStore.transactions.find(t => t.id === txId && t.user_id === userId);
      if (target) {
        memoryStore.transactions = memoryStore.transactions.filter(t => !(t.id === txId && t.user_id === userId));
        saveFallbackStore();
        return { rows: [target as unknown as T], rowCount: 1 };
      }
      return { rows: [], rowCount: 0 };
    }
  }

  // Handle FORECAST_SNAPSHOTS
  if (upper.includes('FORECAST_SNAPSHOTS')) {
    if (upper.startsWith('SELECT')) {
      const list = memoryStore.forecast_snapshots.filter(f => f.user_id === params[0]);
      return { rows: list as unknown as T[], rowCount: list.length };
    }
    if (upper.startsWith('INSERT INTO FORECAST_SNAPSHOTS')) {
      const hasExplicitId = params.length >= 6;
      const id = hasExplicitId ? params[0] : crypto.randomUUID();
      const offset = hasExplicitId ? 1 : 0;
      const user_id = params[offset];
      const forecast_date = params[offset + 1];
      const projected_balance = parseFloat(params[offset + 2]);
      const projected_income = parseFloat(params[offset + 3]);
      const projected_expense = parseFloat(params[offset + 4]);
      const created_at = new Date().toISOString();

      const snapshot = { id, user_id, forecast_date, projected_balance, projected_income, projected_expense, created_at };
      memoryStore.forecast_snapshots.push(snapshot);
      saveFallbackStore();
      return { rows: [snapshot as unknown as T], rowCount: 1 };
    }
  }

  // Handle AI_INSIGHTS
  if (upper.includes('AI_INSIGHTS')) {
    if (upper.startsWith('SELECT')) {
      const list = memoryStore.ai_insights
        .filter(i => i.user_id === params[0])
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      return { rows: list as unknown as T[], rowCount: list.length };
    }
    if (upper.startsWith('INSERT INTO AI_INSIGHTS')) {
      const hasExplicitId = params.length >= 5;
      const id = hasExplicitId ? params[0] : crypto.randomUUID();
      const offset = hasExplicitId ? 1 : 0;
      const user_id = params[offset];
      const insight_type = params[offset + 1];
      const summary = params[offset + 2];
      const rawJson = params[offset + 3];
      const detailed_json = typeof rawJson === 'string' ? JSON.parse(rawJson) : rawJson;
      const created_at = new Date().toISOString();

      const insight = { id, user_id, insight_type, summary, detailed_json, created_at };
      memoryStore.ai_insights.push(insight);
      saveFallbackStore();
      return { rows: [insight as unknown as T], rowCount: 1 };
    }
  }

  return { rows: [], rowCount: 0 };
}

export function getMemoryStore() {
  return memoryStore;
}
