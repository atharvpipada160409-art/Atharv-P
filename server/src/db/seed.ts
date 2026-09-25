import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { query, initDb } from './db';

export async function seedDemoData(): Promise<void> {
  console.log('[Seed] Checking if seed data is needed...');

  const existing = await query('SELECT id FROM users WHERE email = $1', ['demo@cashflowiq.com']);
  if (existing.rows.length > 0) {
    console.log('[Seed] Demo user already exists. Skipping seed.');
    return;
  }

  console.log('[Seed] Seeding CashFlowIQ with realistic starter dataset...');

  const userId = crypto.randomUUID();
  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Create Demo User
  await query(
    `INSERT INTO users (id, email, password_hash, full_name, entity_type, currency, low_runway_threshold_days)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [userId, 'demo@cashflowiq.com', passwordHash, 'Alex Rivera', 'startup', 'USD', 30]
  );

  // 2. Create Accounts
  const opAccountId = crypto.randomUUID();
  const savAccountId = crypto.randomUUID();
  const stripeAccountId = crypto.randomUUID();

  await query(
    `INSERT INTO accounts (id, user_id, account_name, account_type, current_balance)
     VALUES ($1, $2, $3, $4, $5)`,
    [opAccountId, userId, 'Mercury Operating Account', 'operating', 42500.00]
  );

  await query(
    `INSERT INTO accounts (id, user_id, account_name, account_type, current_balance)
     VALUES ($1, $2, $3, $4, $5)`,
    [savAccountId, userId, 'Silicon Valley Reserve (Yield)', 'savings', 25000.00]
  );

  await query(
    `INSERT INTO accounts (id, user_id, account_name, account_type, current_balance)
     VALUES ($1, $2, $3, $4, $5)`,
    [stripeAccountId, userId, 'Stripe Clearing Account', 'checking', 12800.00]
  );

  // 3. Transactions data (spanning past 60 days)
  const now = new Date();
  const getPastDate = (daysAgo: number) => {
    const d = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    return d.toISOString().split('T')[0];
  };

  const seedTransactions = [
    // Incomes
    { accountId: opAccountId, amount: 14500.00, type: 'income', category: 'Client Invoices', description: 'Acme Corp Enterprise Annual Q1 Retainer', daysAgo: 3, isRecurring: true, freq: 'monthly' },
    { accountId: stripeAccountId, amount: 8900.00, type: 'income', category: 'Product Sales', description: 'Monthly Stripe recurring subscription payouts', daysAgo: 7, isRecurring: true, freq: 'monthly' },
    { accountId: opAccountId, amount: 6500.00, type: 'income', category: 'Client Invoices', description: 'Venture Capital Strategy Advisory Fee', daysAgo: 14, isRecurring: false, freq: 'none' },
    { accountId: savAccountId, amount: 20000.00, type: 'income', category: 'Capital Injection', description: 'Safe Note Angel Tranche B Investment', daysAgo: 28, isRecurring: false, freq: 'none' },
    { accountId: stripeAccountId, amount: 3200.00, type: 'income', category: 'Product Sales', description: 'Self-serve Developer API Token volume', daysAgo: 21, isRecurring: true, freq: 'monthly' },
    { accountId: opAccountId, amount: 14500.00, type: 'income', category: 'Client Invoices', description: 'Acme Corp Enterprise Annual Q4 Retainer', daysAgo: 33, isRecurring: true, freq: 'monthly' },
    { accountId: stripeAccountId, amount: 7800.00, type: 'income', category: 'Product Sales', description: 'Prior month Stripe recurring payout', daysAgo: 38, isRecurring: true, freq: 'monthly' },
    { accountId: savAccountId, amount: 340.00, type: 'income', category: 'Investment Yields', description: 'Monthly Treasury Yield Interest Payment', daysAgo: 4, isRecurring: true, freq: 'monthly' },

    // Expenses
    { accountId: opAccountId, amount: 12500.00, type: 'expense', category: 'Payroll & Benefits', description: 'Gusto Core Engineering & Product Payroll', daysAgo: 5, isRecurring: true, freq: 'monthly' },
    { accountId: opAccountId, amount: 2800.00, type: 'expense', category: 'Rent & Utilities', description: 'WeWork Collaborative Headquarters Lease', daysAgo: 8, isRecurring: true, freq: 'monthly' },
    { accountId: opAccountId, amount: 2450.00, type: 'expense', category: 'Software & SaaS', description: 'AWS Cloud Hosting & Gemini AI Infrastructure', daysAgo: 9, isRecurring: true, freq: 'monthly' },
    { accountId: opAccountId, amount: 3500.00, type: 'expense', category: 'Marketing & Advertising', description: 'Google Ads & LinkedIn Sponsored Pipeline', daysAgo: 12, isRecurring: true, freq: 'monthly' },
    { accountId: opAccountId, amount: 650.00, type: 'expense', category: 'Software & SaaS', description: 'GitHub Enterprise, Figma & Slack workspaces', daysAgo: 15, isRecurring: true, freq: 'monthly' },
    { accountId: opAccountId, amount: 1800.00, type: 'expense', category: 'Operational Expenses', description: 'KPMG Quarterly Tax Compliance & Audit Preparation', daysAgo: 18, isRecurring: false, freq: 'none' },
    { accountId: opAccountId, amount: 3200.00, type: 'expense', category: 'Operational Expenses', description: 'MacBook Pro M3 Max for Senior ML Engineer (Spike)', daysAgo: 22, isRecurring: false, freq: 'none' },
    { accountId: opAccountId, amount: 450.00, type: 'expense', category: 'Software & SaaS', description: 'Intercom Customer Support Suite & Chatbot', daysAgo: 25, isRecurring: true, freq: 'monthly' },
    { accountId: opAccountId, amount: 1200.00, type: 'expense', category: 'Operational Expenses', description: 'San Francisco Client Summit travel & lodging', daysAgo: 29, isRecurring: false, freq: 'none' },
    { accountId: opAccountId, amount: 12500.00, type: 'expense', category: 'Payroll & Benefits', description: 'Gusto Core Payroll (Prior Month)', daysAgo: 35, isRecurring: true, freq: 'monthly' },
    { accountId: opAccountId, amount: 2800.00, type: 'expense', category: 'Rent & Utilities', description: 'WeWork Office Space (Prior Month)', daysAgo: 39, isRecurring: true, freq: 'monthly' },
    { accountId: opAccountId, amount: 2300.00, type: 'expense', category: 'Software & SaaS', description: 'AWS Cloud Hosting & DB clusters', daysAgo: 40, isRecurring: true, freq: 'monthly' },
    { accountId: opAccountId, amount: 4200.00, type: 'expense', category: 'Contractor Fees', description: 'External Security Penetration Testing Contractor', daysAgo: 45, isRecurring: false, freq: 'none' },
    { accountId: opAccountId, amount: 950.00, type: 'expense', category: 'Marketing & Advertising', description: 'Design assets for Product Hunt launch', daysAgo: 50, isRecurring: false, freq: 'none' }
  ];

  for (const tx of seedTransactions) {
    await query(
      `INSERT INTO transactions (id, user_id, account_id, amount, type, category, description, transaction_date, is_recurring, recurring_frequency)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [crypto.randomUUID(), userId, tx.accountId, tx.amount, tx.type, tx.category, tx.description, getPastDate(tx.daysAgo), tx.isRecurring, tx.freq]
    );
  }

  // 4. Initial AI Insight
  const initialInsight = {
    healthScore: 78,
    status: 'Stable',
    monthlyBurnRate: 24350,
    projectedRunwayDays: 98,
    keyRisks: [
      'Single client concentration: Acme Corp accounts for ~40% of predictable monthly top-line revenue.',
      'Recent hardware spike of $3,200 drove non-recurring discretionary spend up 18% month-over-month.',
      'High recurring SaaS infrastructure overhead ($3,550/mo) across 5 separate vendor subscriptions.'
    ],
    actionableSteps: [
      {
        title: 'Diversify Enterprise Inflow Pipeline',
        impact: 'High',
        description: 'Accelerate closing of 2 prospective mid-market contracts to reduce revenue exposure to Acme Corp below 25%.'
      },
      {
        title: 'Implement 1-Year Annual Cloud Reserved Instances',
        impact: 'Medium',
        description: 'Commit to AWS 1-year compute savings plans to immediately yield a 28% reduction in monthly cloud infrastructure burn.'
      },
      {
        title: 'Consolidate Redundant Collaboration Tooling',
        impact: 'Low',
        description: 'Deprecate unused seat licenses in Figma and secondary SaaS dashboards to trim ~$300/mo in recurring operational leak.'
      }
    ]
  };

  await query(
    `INSERT INTO ai_insights (id, user_id, insight_type, summary, detailed_json)
     VALUES ($1, $2, $3, $4, $5)`,
    [crypto.randomUUID(), userId, 'health_audit', 'Initial Q1 AI Financial Health Audit & Risk Diagnosis', JSON.stringify(initialInsight)]
  );

  console.log('[Seed] Demo data seeding completed successfully! Demo user: demo@cashflowiq.com / password123');
}

if (require.main === module) {
  (async () => {
    await initDb();
    await seedDemoData();
    process.exit(0);
  })();
}
