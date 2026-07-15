import { supabase } from '../../../database/supabase.js';
import type { DbRefreshToken, DbUserWithRelations } from '../../../database/types.js';
import { AppError } from '../../../shared/errors/index.js';

const USER_SELECT = `
  *,
  roles:role_id ( id, name, description ),
  departments:department_id ( id, name ),
  employee_types:employee_type_id ( id, name )
`;

export class AuthRepository {
  async findUserByEmail(email: string): Promise<DbUserWithRelations | null> {
    const { data, error } = await supabase
      .from('users')
      .select(USER_SELECT)
      .eq('email', email.toLowerCase())
      .is('deleted_at', null)
      .maybeSingle();

    if (error) {
      throw new AppError('Failed to fetch user', 500, 'DATABASE_ERROR', error);
    }

    return data as DbUserWithRelations | null;
  }

  async findUserById(id: string): Promise<DbUserWithRelations | null> {
    const { data, error } = await supabase
      .from('users')
      .select(USER_SELECT)
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) {
      throw new AppError('Failed to fetch user', 500, 'DATABASE_ERROR', error);
    }

    return data as DbUserWithRelations | null;
  }

  async createRefreshToken(input: {
    id?: string;
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    userAgent?: string;
    ip?: string;
  }): Promise<DbRefreshToken> {
    const { data, error } = await supabase
      .from('refresh_tokens')
      .insert({
        ...(input.id ? { id: input.id } : {}),
        user_id: input.userId,
        token_hash: input.tokenHash,
        expires_at: input.expiresAt.toISOString(),
        user_agent: input.userAgent ?? null,
        ip: input.ip ?? null,
      })
      .select('*')
      .single();

    if (error || !data) {
      throw new AppError('Failed to create refresh token', 500, 'DATABASE_ERROR', error);
    }

    return data;
  }

  async findRefreshTokenById(id: string): Promise<DbRefreshToken | null> {
    const { data, error } = await supabase
      .from('refresh_tokens')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) {
      throw new AppError('Failed to fetch refresh token', 500, 'DATABASE_ERROR', error);
    }

    return data;
  }

  async revokeRefreshToken(id: string): Promise<void> {
    const { error } = await supabase
      .from('refresh_tokens')
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', id)
      .is('deleted_at', null);

    if (error) {
      throw new AppError('Failed to revoke refresh token', 500, 'DATABASE_ERROR', error);
    }
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    const { error } = await supabase
      .from('refresh_tokens')
      .update({ revoked_at: new Date().toISOString() })
      .eq('user_id', userId)
      .is('revoked_at', null)
      .is('deleted_at', null);

    if (error) {
      throw new AppError('Failed to revoke user tokens', 500, 'DATABASE_ERROR', error);
    }
  }
}

export const authRepository = new AuthRepository();
