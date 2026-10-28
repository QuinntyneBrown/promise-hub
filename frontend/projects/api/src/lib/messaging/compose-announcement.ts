import type { AnnouncementAudience } from './announcement-audience';

/** An announcement as staff compose it: a null program is all programs, a null send time is now. */
export interface ComposeAnnouncement {
  title: string;
  body: string;
  programId: string | null;
  audience: AnnouncementAudience | null;
  sendAt: string | null;
}
