import { z } from 'zod';

export const listVendorsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().optional(),
});

export const vendorIdParamSchema = z.object({
  id: z.string().uuid('Invalid vendor ID'),
});

export const createVendorSchema = z.object({
  name: z.string().trim().min(1, 'Vendor name is required').max(150),
  vendorType: z
    .array(z.string().trim().min(1).max(50))
    .min(1, 'Select at least one vendor type'),
});

export const updateVendorSchema = z.object({
  name: z.string().trim().min(1).max(150).optional(),
  vendorType: z.array(z.string().trim().min(1).max(50)).min(1).optional(),
});

export type ListVendorsQueryBody = z.infer<typeof listVendorsQuerySchema>;
export type CreateVendorBody = z.infer<typeof createVendorSchema>;
export type UpdateVendorBody = z.infer<typeof updateVendorSchema>;
export type VendorIdParam = z.infer<typeof vendorIdParamSchema>;
