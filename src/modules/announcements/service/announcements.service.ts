import { announcementsRepository } from '../repository/announcements.repository.js';
import { mapAnnouncement } from '../dto/announcements.mapper.js';
import type { Announcement } from '../types/announcements.types.js';

export class AnnouncementsService {
  async listActive(): Promise<Announcement[]> {
    const rows = await announcementsRepository.findActive();
    return rows.map(mapAnnouncement);
  }
}

export const announcementsService = new AnnouncementsService();
