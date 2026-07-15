import { z } from 'zod';

export const accountTypeSchema = z.enum(['bank', 'cash'], {
  errorMap: () => ({ message: 'Account type must be bank or cash' }),
});

export const createAccountSchema = z.object({
  acName: z.string().trim().min(1, 'Account name is required').max(150),
  acType: accountTypeSchema,
});

export const updateAccountSchema = z.object({
  acName: z.string().trim().min(1, 'Account name is required').max(150),
  acType: accountTypeSchema,
});

export const accountIdParamSchema = z.object({
  id: z.string().uuid('Invalid account ID'),
});
