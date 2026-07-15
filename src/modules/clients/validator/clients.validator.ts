import { z } from 'zod';

export const listClientsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().optional(),
});

export const clientIdParamSchema = z.object({
  id: z.string().uuid('Invalid client ID'),
});

export const createClientSchema = z.object({
  name: z.string().trim().min(1, 'Client name is required').max(150),
  services: z
    .array(z.string().trim().min(1).max(50))
    .min(1, 'Select at least one service'),
});

export const updateClientSchema = z.object({
  name: z.string().trim().min(1).max(150).optional(),
  services: z.array(z.string().trim().min(1).max(50)).min(1).optional(),
});

export type ListClientsQueryBody = z.infer<typeof listClientsQuerySchema>;
export type CreateClientBody = z.infer<typeof createClientSchema>;
export type UpdateClientBody = z.infer<typeof updateClientSchema>;
export type ClientIdParam = z.infer<typeof clientIdParamSchema>;
