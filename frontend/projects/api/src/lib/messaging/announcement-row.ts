import type { AnnouncementAudience } from './announcement-audience';

/** One announcement on the staff list (L2-105 criterion 7). */
export interface AnnouncementRow {
  id: string;
  title: string;
  body: string;
  /** Null for all programs. */
  program: string | null;
  audience: AnnouncementAudience;
  status: 'Sent' | 'Scheduled';
  sendAt: string;
  sentBy: string;
  /** Youth and mentors it reaches in the app. */
  recipients: number;
  reads: number;
  /** Households sent the guardians' copy. */
  households: number;
}
