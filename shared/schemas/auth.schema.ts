import { z } from 'zod';

export const RegisterUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  fullName: z.string().min(2, "Full name is required"),
  entityType: z.enum(['individual', 'freelancer', 'smb', 'startup']).default('individual'),
  currency: z.string().default('USD')
});

export const LoginUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required")
});

export const UpdateProfileSchema = z.object({
  fullName: z.string().min(2, "Full name is required").optional(),
  entityType: z.enum(['individual', 'freelancer', 'smb', 'startup']).optional(),
  currency: z.string().min(1).max(10).optional(),
  lowRunwayThresholdDays: z.number().int().min(5).max(365).optional()
});

export type RegisterUserInput = z.infer<typeof RegisterUserSchema>;
export type LoginUserInput = z.infer<typeof LoginUserSchema>;
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
