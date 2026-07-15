import type { ClientRow } from '../repository/clients.repository.js';
import type { Client } from '../types/clients.types.js';

export function mapClient(row: ClientRow): Client {
  return {
    id: row.id,
    name: row.name,
    services: Array.isArray(row.services) ? row.services.map(String) : [],
    balance: Number(row.balance),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
