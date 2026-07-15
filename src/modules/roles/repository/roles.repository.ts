import { supabase } from '../../../database/supabase.js';
import type { DbRole } from '../../../database/types.js';
import { AppError } from '../../../shared/errors/index.js';

export class RolesRepository {
  async findAll(): Promise<DbRole[]> {
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .is('deleted_at', null)
      .order('name', { ascending: true });

    if (error) {
      throw new AppError('Failed to fetch roles', 500, 'DATABASE_ERROR', error);
    }

    return data ?? [];
  }
}

export const rolesRepository = new RolesRepository();
