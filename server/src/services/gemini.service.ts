import { GoogleGenAI, Type, Schema } from '@google/genai';
import { config } from '../config/env';
import { HealthAuditResponse, Transaction, Account } from '../../../shared/types';

export const HealthAuditResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    healthScore: {
      type: Type.INTEGER,
      description: "Comprehensive financial stability score from 0 (critical) to 100 (thriving)."
    },
    status: {
      type: Type.STRING,
      enum: ["Critical", "Warning", "Stable", "Thriving"]
    },
    monthlyBurnRate: { type: Type.NUMBER },
    projectedRunwayDays: { type: Type.INTEGER },
    keyRisks: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of identified financial vulnerabilities, expense spikes, or revenue deficits."
    },
    actionableSteps: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          impact: { type: Type.STRING, enum: ["High", "Medium", "Low"] },
          description: { type: Type.STRING }
        },
        required: ["title", "impact", "description"]
      }
    }
  },
  required: ["healthScore", "status", "monthlyBurnRate", "projectedRunwayDays", "keyRisks", "actionableSteps"]
};

const SYSTEM_INSTRUCTION = `You are CashFlowIQ AI, an expert Chief Financial Officer (CFO), cash flow manager, and financial strategist.
Your primary objective is to evaluate transaction histories, balances, burn rates, and scenario inputs to help users manage cash flow, eliminate bad financial habits, avoid unexpected debt, and extend runway.

Operational Directives:
1. Base all calculations and analysis strictly on the concrete financial data provided (balances, revenues, expenses, recurring transactions).
2. Never invent or hallucinate financial transactions, balances, or historical facts that were not supplied.
3. Be clear, direct, objective, and realistic. Avoid fluff or generic advice.
4. Proactively highlight negative runway trends, expense anomalies, and burn hazards.
5. Produce output conforming strictly to requested JSON schemas when structured responses are required.`;

let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI | null {
  if (!aiClient && config.geminiApiKey) {
    aiClient = new GoogleGenAI({ apiKey: config.geminiApiKey });
  }
  return aiClient;
}

export async function generateHealthAudit(
  accounts: Account[],
  transactions: Transaction[],
  metrics: {
    totalBalance: number;
    monthlyIncome: number;
    monthlyBurnRate: number;
    runwayDays: number;
    entityType: string;
    currency: string;
  },
  options: {
    horizonDays?: string;
    financialGoal?: string;
    customInquiry?: string;
  } = {}
): Promise<HealthAuditResponse> {
  const client = getAIClient();

  const financialContext = {
    entityType: metrics.entityType,
    currency: metrics.currency,
    totalBalance: metrics.totalBalance,
    monthlyIncome: metrics.monthlyIncome,
    monthlyBurnRate: metrics.monthlyBurnRate,
    runwayDays: metrics.runwayDays,
    horizonDays: options.horizonDays || '90',
    goal: options.financialGoal || 'Maximize cash runway & eliminate cash flow volatility',
    customInquiry: options.customInquiry || 'Full audit and risk diagnosis',
    accounts: accounts.map(a => ({ name: a.accountName, type: a.accountType, balance: a.currentBalance })),
    recentTransactions: transactions.slice(0, 30).map(t => ({
      date: t.transactionDate,
      type: t.type,
      amount: t.amount,
      category: t.category,
      recurring: t.isRecurring,
      desc: t.description
    }))
  };

  if (client) {
    try {
      const prompt = `Conduct a comprehensive financial health audit for this ${metrics.entityType}.
Target Horizon: ${financialContext.horizonDays} days.
Goal: ${financialContext.goal}.
Custom Inquiry: ${financialContext.customInquiry}.

Financial Data:
${JSON.stringify(financialContext, null, 2)}

Provide strict JSON conforming to the schema.`;

      const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseSchema: HealthAuditResponseSchema,
          temperature: 0.2
        }
      });

      if (response && response.text) {
        const parsed = JSON.parse(response.text);
        return {
          ...parsed,
          emergencyPlaybook: {
            triggered: parsed.projectedRunwayDays <= 30,
            urgencyLevel: parsed.projectedRunwayDays <= 15 ? 'Emergency' : parsed.projectedRunwayDays <= 30 ? 'Elevated' : 'None',
            protocolSteps: parsed.projectedRunwayDays <= 30 ? [
              'Initiate immediate freeze on all non-critical discretionary operational expenditures.',
              'Audit all SaaS licenses and downgrade unutilized premium tier subscriptions.',
              'Accelerate net-30 customer invoices with 3% early payment settlement discounts.',
              'Formulate temporary debt restructuring or emergency bridge financing request.'
            ] : []
          }
        };
      }
    } catch (err: any) {
      console.warn('[Gemini Service] Gemini API call error, falling back to algorithmic financial engine:', err.message);
    }
  }

  // Resilient heuristic engine when GEMINI_API_KEY is not configured or network call fails
  return generateAlgorithmicHealthAudit(metrics, transactions, options);
}

export async function askAdvisorChat(
  message: string,
  history: { role: 'user' | 'model' | 'assistant'; content: string }[],
  accounts: Account[],
  transactions: Transaction[],
  metrics: {
    totalBalance: number;
    monthlyIncome: number;
    monthlyBurnRate: number;
    runwayDays: number;
    entityType: string;
    currency: string;
  }
): Promise<{ reply: string; actionSuggestions: string[]; metricsCited: { label: string; value: string }[] }> {
  const client = getAIClient();

  const metricsCited = [
    { label: 'Current Liquid Balance', value: `${metrics.currency} ${metrics.totalBalance.toLocaleString()}` },
    { label: 'Monthly Inflow', value: `${metrics.currency} ${metrics.monthlyIncome.toLocaleString()}` },
    { label: 'Monthly Burn Rate', value: `${metrics.currency} ${metrics.monthlyBurnRate.toLocaleString()}` },
    { label: 'Projected Runway', value: `${Math.round(metrics.runwayDays)} days` }
  ];

  if (client) {
    try {
      const ledgerSummary = `Ledger Context:
Current Balances: ${metrics.currency} ${metrics.totalBalance} across ${accounts.length} accounts.
Monthly Burn Rate: ${metrics.currency} ${metrics.monthlyBurnRate}.
Monthly Inflow: ${metrics.currency} ${metrics.monthlyIncome}.
Current Runway: ${metrics.runwayDays} days.
Recent 15 transactions: ${JSON.stringify(transactions.slice(0, 15).map(t => ({ d: t.transactionDate, t: t.type, a: t.amount, c: t.category, desc: t.description })))}`;

      const formattedHistory = history.map(h => ({
        role: h.role === 'assistant' ? 'model' : h.role,
        parts: [{ text: h.content }]
      }));

      const chat = client.chats.create({
        model: 'gemini-2.5-flash',
        config: {
          systemInstruction: `${SYSTEM_INSTRUCTION}\n\nCurrent Financial Context:\n${ledgerSummary}\nProvide concise, direct, CFO-grade answers with bulleted action steps when applicable.`
        },
        history: formattedHistory
      });

      const response = await chat.sendMessage({ message });
      if (response && response.text) {
        return {
          reply: response.text,
          actionSuggestions: [
            'Audit high recurring expenses',
            'Model a 20% revenue dip in Scenario Planner',
            'Run a 90-day Cash Flow Projection'
          ],
          metricsCited
        };
      }
    } catch (err: any) {
      console.warn('[Gemini Service] Chat generation error, using financial logic engine:', err.message);
    }
  }

  // Algorithmic CFO Chat Advisor response
  return generateAlgorithmicChatResponse(message, metrics, transactions, metricsCited);
}

function generateAlgorithmicHealthAudit(
  metrics: {
    totalBalance: number;
    monthlyIncome: number;
    monthlyBurnRate: number;
    runwayDays: number;
    entityType: string;
    currency: string;
  },
  transactions: Transaction[],
  options: { horizonDays?: string; financialGoal?: string; customInquiry?: string }
): HealthAuditResponse {
  const runway = metrics.runwayDays;
  let healthScore = 50;
  let status: 'Critical' | 'Warning' | 'Stable' | 'Thriving' = 'Stable';

  if (runway >= 180) {
    healthScore = Math.min(100, 85 + Math.round(runway / 30));
    status = 'Thriving';
  } else if (runway >= 90) {
    healthScore = Math.min(84, 70 + Math.round((runway - 90) / 10));
    status = 'Stable';
  } else if (runway >= 30) {
    healthScore = Math.min(69, 45 + Math.round((runway - 30) / 3));
    status = 'Warning';
  } else {
    healthScore = Math.max(10, Math.round(runway * 1.2));
    status = 'Critical';
  }

  // Analyze top expense categories
  const expenseMap = new Map<string, number>();
  let totalExpense = 0;
  let recurringExpense = 0;

  for (const t of transactions.filter(tx => tx.type === 'expense')) {
    const amt = Number(t.amount);
    totalExpense += amt;
    expenseMap.set(t.category, (expenseMap.get(t.category) || 0) + amt);
    if (t.isRecurring) recurringExpense += amt;
  }

  const sortedCategories = Array.from(expenseMap.entries()).sort((a, b) => b[1] - a[1]);
  const topCategory = sortedCategories[0] || ['Operational Expenses', 0];

  const keyRisks: string[] = [];
  if (runway < 45) {
    keyRisks.push(`Immediate liquidity pressure: Current runway of ${Math.round(runway)} days is dangerously tight.`);
  }
  if (totalExpense > 0 && recurringExpense / totalExpense > 0.6) {
    keyRisks.push(`Fixed structural overhead: Recurring commitments account for ${Math.round((recurringExpense / totalExpense) * 100)}% of total monthly outlays.`);
  }
  if (topCategory[1] > totalExpense * 0.4 && totalExpense > 0) {
    keyRisks.push(`Category concentration: ${topCategory[0]} constitutes ${Math.round((topCategory[1] / totalExpense) * 100)}% of your operational expenditure.`);
  }
  if (keyRisks.length === 0) {
    keyRisks.push('Monitor variable vendor costs and seasonal revenue fluctuations to preserve current 90+ day liquidity buffer.');
  }

  const actionableSteps = [
    {
      title: `Optimize ${topCategory[0]} Spending`,
      impact: 'High' as const,
      description: `Review contracts and vendor line items in ${topCategory[0]} to capture an immediate 10-15% cost rationalization.`
    },
    {
      title: 'Strengthen Accounts Receivable Cycle',
      impact: 'Medium' as const,
      description: 'Enforce standard 15-day invoice terms or request 50% upfront milestone deposits to cushion working capital.'
    },
    {
      title: 'Maintain 90-Day Liquidity Cushion',
      impact: 'Medium' as const,
      description: `Target maintaining at least ${metrics.currency} ${(metrics.monthlyBurnRate * 3).toLocaleString()} in liquid operating accounts.`
    }
  ];

  return {
    healthScore,
    status,
    monthlyBurnRate: metrics.monthlyBurnRate,
    projectedRunwayDays: Math.round(runway),
    keyRisks,
    actionableSteps,
    emergencyPlaybook: {
      triggered: runway <= 30,
      urgencyLevel: runway <= 15 ? 'Emergency' : runway <= 30 ? 'Elevated' : 'None',
      protocolSteps: runway <= 30 ? [
        'Halt all non-essential discretionary expenditures and new subscriptions.',
        'Negotiate extended payment horizons (net-60) with major commercial vendors.',
        'Offer incentives for clients to pre-pay quarterly or annual retainers.',
        'Explore emergency credit facilities or founder equity injection.'
      ] : []
    }
  };
}

function generateAlgorithmicChatResponse(
  message: string,
  metrics: {
    totalBalance: number;
    monthlyIncome: number;
    monthlyBurnRate: number;
    runwayDays: number;
    entityType: string;
    currency: string;
  },
  transactions: Transaction[],
  metricsCited: { label: string; value: string }[]
): { reply: string; actionSuggestions: string[]; metricsCited: { label: string; value: string }[] } {
  const lower = message.toLowerCase();

  let reply = '';
  const actionSuggestions = [
    'Run What-If scenario with +$2,000 monthly income',
    'Evaluate cutting recurring software expenses',
    'Review 60-day cash projection'
  ];

  if (lower.includes('runway') || lower.includes('how long') || lower.includes('survive')) {
    reply = `Based on your liquid reserves of **${metrics.currency} ${metrics.totalBalance.toLocaleString()}** and a monthly net burn rate of **${metrics.currency} ${metrics.monthlyBurnRate.toLocaleString()}**, your current cash runway is approximately **${Math.round(metrics.runwayDays)} days** (${(metrics.runwayDays / 30).toFixed(1)} months).\n\n` +
      `**CFO Recommendation:** ` +
      (metrics.runwayDays > 90
        ? `Your runway is in a healthy posture (>90 days). Focus on deploying capital toward high-yield revenue growth while keeping fixed overhead steady.`
        : `Your runway is below the 90-day safety margin. We recommend pausing discretionary outlays and examining vendor renegotiations immediately.`);
  } else if (lower.includes('cut') || lower.includes('reduce') || lower.includes('save') || lower.includes('expense')) {
    const expenseTx = transactions.filter(t => t.type === 'expense');
    const recurringExpense = expenseTx.filter(t => t.isRecurring).reduce((s, t) => s + Number(t.amount), 0);
    reply = `To extend your runway effectively, focus on recurring overhead first:\n\n` +
      `1. **Recurring Subscriptions & Services:** You currently spend **${metrics.currency} ${recurringExpense.toLocaleString()}** monthly in recurring expenses. Trimming 15% here saves **${metrics.currency} ${(recurringExpense * 0.15).toFixed(0)}/mo**, extending runway by ~${Math.round((metrics.totalBalance / (Math.max(1, metrics.monthlyBurnRate - recurringExpense * 0.15)) * 30) - metrics.runwayDays)} days.\n` +
      `2. **Vendor Consolidation:** Check your Software & SaaS categories for overlapping tools.\n` +
      `3. **Payment Terms:** Defer non-critical vendor bills to net-45 or net-60 terms.`;
  } else if (lower.includes('hire') || lower.includes('salary') || lower.includes('employee')) {
    reply = `Before hiring, simulate the full impact in the **Forecasting & Scenarios** tab.\n\n` +
      `Remember that a new hire's total cost to company typically includes salary + ~15-20% for benefits, payroll taxes, and tooling. ` +
      `For example, a \$6,000/mo salary increases monthly burn by ~\$7,000/mo, which would shrink your current ${Math.round(metrics.runwayDays)}-day runway accordingly.`;
  } else {
    reply = `As your CashFlowIQ Financial Advisor, I've analyzed your live ledger:\n\n` +
      `- **Liquid Balance:** ${metrics.currency} ${metrics.totalBalance.toLocaleString()}\n` +
      `- **Monthly Burn Rate:** ${metrics.currency} ${metrics.monthlyBurnRate.toLocaleString()}\n` +
      `- **Estimated Runway:** ${Math.round(metrics.runwayDays)} days\n\n` +
      `Your current cash flow balance indicates you are in a **${metrics.runwayDays > 60 ? 'Stable' : 'Vulnerable'}** operating posture. Let me know if you would like me to analyze a specific cost center, evaluate a hiring decision, or model a revenue drop.`;
  }

  return {
    reply,
    actionSuggestions,
    metricsCited
  };
}
