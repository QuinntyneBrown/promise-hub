/** One announcement in a youth's or mentor's feed (L2-105 criterion 5). */
export interface MyAnnouncement {
  id: string;
  title: string;
  body: string;
  from: string;
  fromRole: string;
  sentAt: string;
  /** Null for all programs. */
  program: string | null;
  read: boolean;
}
