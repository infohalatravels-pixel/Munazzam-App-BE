import { supabase } from '../../../database/supabase.js';
import { AppError } from '../../../shared/errors/index.js';

export interface AnnouncementRow {
  id: string;
  title: string;
  content: string;
  created_by: string;
  is_active: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  users: {
    first_name: string;
    last_name: string;
  } | null;
}

export class AnnouncementsRepository {
  async findActive(): Promise<AnnouncementRow[]> {
    const { data, error } = await supabase
      .from('announcements')
      .select('*, users:created_by ( first_name, last_name )')
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('published_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (error) {
      throw new AppError('Failed to fetch announcements', 500, 'DATABASE_ERROR', error);
    }

    return (data ?? []) as AnnouncementRow[];
  }
}

export const announcementsRepository = new AnnouncementsRepository();
