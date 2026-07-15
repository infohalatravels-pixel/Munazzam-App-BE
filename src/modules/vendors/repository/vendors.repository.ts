import { supabase } from '../../../database/supabase.js';
import { AppError } from '../../../shared/errors/index.js';
import type { CreateVendorInput, ListVendorsQuery, UpdateVendorInput } from '../types/vendors.types.js';

export interface VendorRow {
  id: string;
  name: string;
  vendor_type: string[] | unknown;
  balance: number | string;
  created_at: string;
  updated_at: string;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(String);
}

export class VendorsRepository {
  async findPage(query: ListVendorsQuery): Promise<{ rows: VendorRow[]; total: number }> {
    const from = (query.page - 1) * query.limit;
    const to = from + query.limit - 1;

    let countQuery = supabase
      .from('vendors')
      .select('id', { count: 'exact', head: true })
      .is('deleted_at', null);

    let dataQuery = supabase
      .from('vendors')
      .select('id, name, vendor_type, balance, created_at, updated_at')
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
      throw new AppError('Failed to fetch vendors', 500, 'DATABASE_ERROR', countError ?? error);
    }

    return {
      rows: ((data ?? []) as VendorRow[]).map((row) => ({
        ...row,
        vendor_type: asStringArray(row.vendor_type),
      })),
      total: count ?? 0,
    };
  }

  async findById(id: string): Promise<VendorRow | null> {
    const { data, error } = await supabase
      .from('vendors')
      .select('id, name, vendor_type, balance, created_at, updated_at')
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) {
      throw new AppError('Failed to fetch vendor', 500, 'DATABASE_ERROR', error);
    }
    if (!data) return null;
    return {
      ...(data as VendorRow),
      vendor_type: asStringArray((data as VendorRow).vendor_type),
    };
  }

  async create(input: CreateVendorInput): Promise<VendorRow> {
    const { data, error } = await supabase
      .from('vendors')
      .insert({
        name: input.name,
        vendor_type: input.vendorType,
        balance: 0,
      })
      .select('id, name, vendor_type, balance, created_at, updated_at')
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new AppError('A vendor with this name already exists', 409, 'CONFLICT');
      }
      throw new AppError('Failed to create vendor', 500, 'DATABASE_ERROR', error);
    }

    return {
      ...(data as VendorRow),
      vendor_type: asStringArray((data as VendorRow).vendor_type),
    };
  }

  async update(id: string, input: UpdateVendorInput): Promise<VendorRow> {
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (input.name !== undefined) updateData.name = input.name;
    if (input.vendorType !== undefined) updateData.vendor_type = input.vendorType;

    const { data, error } = await supabase
      .from('vendors')
      .update(updateData)
      .eq('id', id)
      .is('deleted_at', null)
      .select('id, name, vendor_type, balance, created_at, updated_at')
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new AppError('A vendor with this name already exists', 409, 'CONFLICT');
      }
      if (error.code === 'PGRST116') {
        throw new AppError('Vendor not found', 404, 'NOT_FOUND');
      }
      throw new AppError('Failed to update vendor', 500, 'DATABASE_ERROR', error);
    }

    return {
      ...(data as VendorRow),
      vendor_type: asStringArray((data as VendorRow).vendor_type),
    };
  }

  async updateBalance(id: string, balance: number): Promise<void> {
    const { error } = await supabase
      .from('vendors')
      .update({
        balance,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .is('deleted_at', null);

    if (error) {
      throw new AppError('Failed to update vendor balance', 500, 'DATABASE_ERROR', error);
    }
  }

  async softDelete(id: string): Promise<void> {
    const { error } = await supabase
      .from('vendors')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .is('deleted_at', null);

    if (error) {
      throw new AppError('Failed to delete vendor', 500, 'DATABASE_ERROR', error);
    }
  }

  async countAll(): Promise<number> {
    const { count, error } = await supabase
      .from('vendors')
      .select('id', { count: 'exact', head: true })
      .is('deleted_at', null);

    if (error) {
      throw new AppError('Failed to count vendors', 500, 'DATABASE_ERROR', error);
    }
    return count ?? 0;
  }
}

export const vendorsRepository = new VendorsRepository();
