import type { MyAnnouncement } from './my-announcement';

/** A member's announcements, newest first, and how many she has not read. */
export interface MyAnnouncements {
  unread: number;
  announcements: MyAnnouncement[];
}
