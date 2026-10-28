/** What the compose dialog closes with: the title, and the send time when it was scheduled. */
export interface ComposeAnnouncementResult {
  title: string;
  scheduledFor: string | null;
}
