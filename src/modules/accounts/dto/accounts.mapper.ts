import type { AccountRow } from '../repository/accounts.repository.js';
import type { Account } from '../types/accounts.types.js';

export function mapAccount(row: AccountRow): Account {
  return {
    id: row.id,
    acName: row.ac_name,
    acType: row.ac_type,
    balance: Number(row.balance),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
