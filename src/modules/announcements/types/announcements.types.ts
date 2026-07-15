export interface Announcement {
  id: string;
  title: string;
  content: string;
  createdBy: string;
  authorName: string;
  isActive: boolean;
  publishedAt: string | null;
  createdAt: string;
}
