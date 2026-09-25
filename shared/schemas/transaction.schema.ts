import { z } from 'zod';

export const TransactionSchema = z.object({
  accountId: z.string().uuid("Invalid Account ID"),
  amount: z.number().positive("Amount must be greater than zero"),
  type: z.enum(['income', 'expense']),
  category: z.string().min(1, "Category is required"),
  description: z.string().optional().default(''),
  transactionDate: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date format"),
  isRecurring: z.boolean().default(false),
  recurringFrequency: z.enum(['none', 'weekly', 'monthly', 'annually']).default('none')
});

export const UpdateTransactionSchema = TransactionSchema.partial().extend({
  id: z.string().uuid("Invalid Transaction ID").optional()
});

export const AccountSchema = z.object({
  accountName: z.string().min(1, "Account name is required").max(100),
  accountType: z.enum(['checking', 'savings', 'credit', 'operating']),
  currentBalance: z.number().default(0.00)
});

export const UpdateAccountSchema = AccountSchema.partial();

export type TransactionInput = z.infer<typeof TransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof UpdateTransactionSchema>;
export type AccountInput = z.infer<typeof AccountSchema>;
