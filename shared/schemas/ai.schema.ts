import { z } from 'zod';

export const ActionableStepSchema = z.object({
  title: z.string(),
  impact: z.enum(['High', 'Medium', 'Low']),
  description: z.string()
});

export const HealthAuditResponseZodSchema = z.object({
  healthScore: z.number().int().min(0).max(100),
  status: z.enum(['Critical', 'Warning', 'Stable', 'Thriving']),
  monthlyBurnRate: z.number(),
  projectedRunwayDays: z.number().int(),
  keyRisks: z.array(z.string()),
  actionableSteps: z.array(ActionableStepSchema),
  emergencyPlaybook: z.object({
    triggered: z.boolean(),
    urgencyLevel: z.enum(['None', 'Elevated', 'Emergency']),
    protocolSteps: z.array(z.string())
  }).optional()
});

export type HealthAuditResponse = z.infer<typeof HealthAuditResponseZodSchema>;
export type ActionableStep = z.infer<typeof ActionableStepSchema>;

export const HealthAuditRequestSchema = z.object({
  horizonDays: z.enum(['30', '60', '90']).default('90'),
  financialGoal: z.string().optional(),
  customInquiry: z.string().optional()
});

export type HealthAuditRequest = z.infer<typeof HealthAuditRequestSchema>;

export const AdvisorChatRequestSchema = z.object({
  message: z.string().min(1, "Message cannot be empty"),
  history: z.array(z.object({
    role: z.enum(['user', 'model', 'assistant']),
    content: z.string()
  })).optional().default([]),
  contextHorizon: z.enum(['30', '60', '90']).default('60')
});

export type AdvisorChatRequest = z.infer<typeof AdvisorChatRequestSchema>;

export interface AdvisorChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  actionSuggestions?: string[];
  metricsCited?: {
    label: string;
    value: string;
  }[];
}
