import { supabase } from '../../../database/supabase.js';
import { AppError } from '../../../shared/errors/index.js';
import type { AccountType, CreateAccountInput, UpdateAccountInput } from '../types/accounts.types.js';

export interface AccountRow {
  id: string;
  ac_name: string;
  ac_type: AccountType;
  balance: number | string;
  created_at: string;
  updated_at: string;
}

export class AccountsRepository {
  async findAll(): Promise<AccountRow[]> {
    const { data, error } = await supabase
      .from('accounts')
      .select('id, ac_name, ac_type, balance, created_at, updated_at')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      throw new AppError('Failed to fetch accounts', 500, 'DATABASE_ERROR', error);
    }

    return (data ?? []) as AccountRow[];
  }

  async findById(id: string): Promise<AccountRow | null> {
    const { data, error } = await supabase
      .from('accounts')
      .select('id, ac_name, ac_type, balance, created_at, updated_at')
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) {
      throw new AppError('Failed to fetch account', 500, 'DATABASE_ERROR', error);
    }

    return (data as AccountRow | null) ?? null;
  }

  async create(input: CreateAccountInput): Promise<AccountRow> {
    const { data, error } = await supabase
      .from('accounts')
      .insert({
        ac_name: input.acName,
        ac_type: input.acType,
        balance: 0,
      })
      .select('id, ac_name, ac_type, balance, created_at, updated_at')
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new AppError('An account with this name already exists', 409, 'CONFLICT');
      }
      throw new AppError('Failed to create account', 500, 'DATABASE_ERROR', error);
    }

    return data as AccountRow;
  }

  async update(id: string, input: UpdateAccountInput): Promise<AccountRow> {
    const { data, error } = await supabase
      .from('accounts')
      .update({
        ac_name: input.acName,
        ac_type: input.acType,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .is('deleted_at', null)
      .select('id, ac_name, ac_type, balance, created_at, updated_at')
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new AppError('An account with this name already exists', 409, 'CONFLICT');
      }
      if (error.code === 'PGRST116') {
        throw new AppError('Account not found', 404, 'NOT_FOUND');
      }
      throw new AppError('Failed to update account', 500, 'DATABASE_ERROR', error);
    }

    return data as AccountRow;
  }
}

export const accountsRepository = new AccountsRepository();
