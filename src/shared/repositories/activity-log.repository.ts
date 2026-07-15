import { supabase } from '../../database/supabase.js';
import type { DbActivityLog } from '../../database/types.js';
import { AppError } from '../../shared/errors/index.js';

export interface CreateActivityLogInput {
  userId?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ip?: string;
}

export class ActivityLogRepository {
  async create(input: CreateActivityLogInput): Promise<DbActivityLog> {
    const { data, error } = await supabase
      .from('activity_logs')
      .insert({
        user_id: input.userId ?? null,
        action: input.action,
        entity_type: input.entityType ?? null,
        entity_id: input.entityId ?? null,
        metadata: input.metadata ?? {},
        ip: input.ip ?? null,
      })
      .select('*')
      .single();

    if (error || !data) {
      throw new AppError('Failed to create activity log', 500, 'DATABASE_ERROR', error);
    }

    return data;
  }
}

export const activityLogRepository = new ActivityLogRepository();
