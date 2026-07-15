import { z } from 'zod';

export const createDepositSchema = z.object({
  destinationAccountId: z.string().uuid('Select a destination account'),
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  notes: z.string().trim().max(1000).nullable().optional(),
});

export const createTransferSchema = z
  .object({
    sourceAccountId: z.string().uuid('Select a source account'),
    destinationAccountId: z.string().uuid('Select a destination account'),
    amount: z.coerce.number().positive('Amount must be greater than 0'),
    notes: z.string().trim().max(1000).nullable().optional(),
  })
  .refine((data) => data.sourceAccountId !== data.destinationAccountId, {
    message: 'Source and destination accounts must be different',
    path: ['destinationAccountId'],
  });

export const createPayrollSchema = z.object({
  sourceAccountId: z.string().uuid('Select a source account'),
  employeeId: z.string().uuid('Select an employee'),
  amount: z.coerce.number().positive('Amount must be greater than 0').nullable().optional(),
  notes: z.string().trim().max(1000).nullable().optional(),
});

const moneySchema = z.coerce.number().min(0, 'Amount cannot be negative');

const vendorItemSchema = z.object({
  productName: z.string().trim().min(1, 'Product name is required').max(200),
  unitPrice: z.coerce.number().positive('Unit price must be greater than 0'),
  quantity: z.coerce.number().positive('Quantity must be greater than 0').nullable().optional(),
});

const clientItemSchema = z.object({
  serviceName: z.string().trim().min(1, 'Service name is required').max(200),
  amount: z.coerce.number().positive('Service amount must be greater than 0'),
  description: z.string().trim().max(500).nullable().optional(),
});

export const createVendorPaymentSchema = z
  .object({
    vendorId: z.string().uuid('Select a vendor'),
    sourceAccountId: z.string().uuid('Select a source account').nullable().optional(),
    paymentMode: z.enum(['unpaid', 'partial', 'full', 'advance']),
    paidAmount: moneySchema,
    notes: z.string().trim().max(1000).nullable().optional(),
    items: z.array(vendorItemSchema).min(1, 'Add at least one product'),
  })
  .superRefine((data, ctx) => {
    if (data.paymentMode === 'unpaid') {
      if (data.paidAmount !== 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Unpaid mode must have paid amount 0',
          path: ['paidAmount'],
        });
      }
      return;
    }

    if (data.paidAmount <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Paid amount must be greater than 0 for this payment mode',
        path: ['paidAmount'],
      });
    }

    if (!data.sourceAccountId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Select a source account',
        path: ['sourceAccountId'],
      });
    }
  });

export const createVendorClearSchema = z.object({
  vendorId: z.string().uuid('Select a vendor'),
  sourceAccountId: z.string().uuid('Select a source account'),
  paidAmount: z.coerce.number().positive('Payment amount must be greater than 0'),
  notes: z.string().trim().max(1000).nullable().optional(),
});

export const createClientPaymentSchema = z
  .object({
    clientId: z.string().uuid('Select a client'),
    destinationAccountId: z.string().uuid('Select a destination account').nullable().optional(),
    paymentMode: z.enum(['unpaid', 'partial', 'full', 'advance']),
    paidAmount: moneySchema,
    notes: z.string().trim().max(1000).nullable().optional(),
    items: z.array(clientItemSchema).min(1, 'Add at least one service'),
  })
  .superRefine((data, ctx) => {
    if (data.paymentMode === 'unpaid') {
      if (data.paidAmount !== 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Unpaid mode must have paid amount 0',
          path: ['paidAmount'],
        });
      }
      return;
    }

    if (data.paidAmount <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Paid amount must be greater than 0 for this payment mode',
        path: ['paidAmount'],
      });
    }

    if (!data.destinationAccountId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Select a destination account',
        path: ['destinationAccountId'],
      });
    }
  });

export const createClientClearSchema = z.object({
  clientId: z.string().uuid('Select a client'),
  destinationAccountId: z.string().uuid('Select a destination account'),
  paidAmount: z.coerce.number().positive('Payment amount must be greater than 0'),
  notes: z.string().trim().max(1000).nullable().optional(),
});

export const listLedgerQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(5),
});

export type CreateDepositBody = z.infer<typeof createDepositSchema>;
export type CreateTransferBody = z.infer<typeof createTransferSchema>;
export type CreatePayrollBody = z.infer<typeof createPayrollSchema>;
export type CreateVendorPaymentBody = z.infer<typeof createVendorPaymentSchema>;
export type CreateVendorClearBody = z.infer<typeof createVendorClearSchema>;
export type CreateClientPaymentBody = z.infer<typeof createClientPaymentSchema>;
export type CreateClientClearBody = z.infer<typeof createClientClearSchema>;
export type ListLedgerQueryBody = z.infer<typeof listLedgerQuerySchema>;
