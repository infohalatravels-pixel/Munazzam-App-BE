import type { AnnouncementRow } from '../repository/announcements.repository.js';
import type { Announcement } from '../types/announcements.types.js';

export function mapAnnouncement(row: AnnouncementRow): Announcement {
  const author = row.users
    ? `${row.users.first_name} ${row.users.last_name}`.trim()
    : 'Nasaq Admin';

  return {
    id: row.id,
    title: row.title,
    content: row.content,
    createdBy: row.created_by,
    authorName: author,
    isActive: row.is_active,
    publishedAt: row.published_at,
    createdAt: row.created_at,
  };
}
