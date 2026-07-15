import { supabase } from '../../../database/supabase.js';
import { AppError } from '../../../shared/errors/index.js';
import type { CreateClientInput, ListClientsQuery, UpdateClientInput } from '../types/clients.types.js';

export interface ClientRow {
  id: string;
  name: string;
  services: string[] | unknown;
  balance: number | string;
  created_at: string;
  updated_at: string;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(String);
}

export class ClientsRepository {
  async findPage(query: ListClientsQuery): Promise<{ rows: ClientRow[]; total: number }> {
    const from = (query.page - 1) * query.limit;
    const to = from + query.limit - 1;

    let countQuery = supabase
      .from('clients')
      .select('id', { count: 'exact', head: true })
      .is('deleted_at', null);

    let dataQuery = supabase
      .from('clients')
      .select('id, name, services, balance, created_at, updated_at')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (query.search) {
      countQuery = countQuery.ilike('name', `%${query.search}%`);
      dataQuery = dataQuery.ilike('name', `%${query.search}%`);
    }

    const [{ count, error: countError }, { data, error }] = await Promise.all([
      countQuery,
      dataQuery,
    ]);

    if (countError || error) {
      throw new AppError('Failed to fetch clients', 500, 'DATABASE_ERROR', countError ?? error);
    }

    return {
      rows: ((data ?? []) as ClientRow[]).map((row) => ({
        ...row,
        services: asStringArray(row.services),
      })),
      total: count ?? 0,
    };
  }

  async findById(id: string): Promise<ClientRow | null> {
    const { data, error } = await supabase
      .from('clients')
      .select('id, name, services, balance, created_at, updated_at')
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) {
      throw new AppError('Failed to fetch client', 500, 'DATABASE_ERROR', error);
    }
    if (!data) return null;
    return {
      ...(data as ClientRow),
      services: asStringArray((data as ClientRow).services),
    };
  }

  async create(input: CreateClientInput): Promise<ClientRow> {
    const { data, error } = await supabase
      .from('clients')
      .insert({
        name: input.name,
        services: input.services,
        balance: 0,
      })
      .select('id, name, services, balance, created_at, updated_at')
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new AppError('A client with this name already exists', 409, 'CONFLICT');
      }
      throw new AppError('Failed to create client', 500, 'DATABASE_ERROR', error);
    }

    return {
      ...(data as ClientRow),
      services: asStringArray((data as ClientRow).services),
    };
  }

  async update(id: string, input: UpdateClientInput): Promise<ClientRow> {
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (input.name !== undefined) updateData.name = input.name;
    if (input.services !== undefined) updateData.services = input.services;

    const { data, error } = await supabase
      .from('clients')
      .update(updateData)
      .eq('id', id)
      .is('deleted_at', null)
      .select('id, name, services, balance, created_at, updated_at')
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new AppError('A client with this name already exists', 409, 'CONFLICT');
      }
      if (error.code === 'PGRST116') {
        throw new AppError('Client not found', 404, 'NOT_FOUND');
      }
      throw new AppError('Failed to update client', 500, 'DATABASE_ERROR', error);
    }

    return {
      ...(data as ClientRow),
      services: asStringArray((data as ClientRow).services),
    };
  }

  async updateBalance(id: string, balance: number): Promise<void> {
    const { error } = await supabase
      .from('clients')
      .update({
        balance,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .is('deleted_at', null);

    if (error) {
      throw new AppError('Failed to update client balance', 500, 'DATABASE_ERROR', error);
    }
  }

  async softDelete(id: string): Promise<void> {
    const { error } = await supabase
      .from('clients')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .is('deleted_at', null);

    if (error) {
      throw new AppError('Failed to delete client', 500, 'DATABASE_ERROR', error);
    }
  }

  async countAll(): Promise<number> {
    const { count, error } = await supabase
      .from('clients')
      .select('id', { count: 'exact', head: true })
      .is('deleted_at', null);

    if (error) {
      throw new AppError('Failed to count clients', 500, 'DATABASE_ERROR', error);
    }
    return count ?? 0;
  }
}

export const clientsRepository = new ClientsRepository();
