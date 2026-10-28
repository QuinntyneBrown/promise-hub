import type { AnnouncementRow } from './announcement-row';

/** The organization's announcements, newest send time first. */
export interface AnnouncementList {
  announcements: AnnouncementRow[];
}
