import { AppError } from '../../../shared/errors/index.js';
import { mapAccount } from '../dto/accounts.mapper.js';
import { accountsRepository } from '../repository/accounts.repository.js';
import type { Account, CreateAccountInput, UpdateAccountInput } from '../types/accounts.types.js';

export class AccountsService {
  async list(): Promise<Account[]> {
    const rows = await accountsRepository.findAll();
    return rows.map(mapAccount);
  }

  async getById(id: string): Promise<Account> {
    const row = await accountsRepository.findById(id);
    if (!row) {
      throw new AppError('Account not found', 404, 'NOT_FOUND');
    }
    return mapAccount(row);
  }

  async create(input: CreateAccountInput): Promise<Account> {
    const row = await accountsRepository.create(input);
    return mapAccount(row);
  }

  async update(id: string, input: UpdateAccountInput): Promise<Account> {
    const existing = await accountsRepository.findById(id);
    if (!existing) {
      throw new AppError('Account not found', 404, 'NOT_FOUND');
    }
    const row = await accountsRepository.update(id, input);
    return mapAccount(row);
  }
}

export const accountsService = new AccountsService();
