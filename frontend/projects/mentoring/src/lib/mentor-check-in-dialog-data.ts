/** What opens the mentor check-in dialog: the youth to choose from, or the one youth it is fixed to when opened from her record. */
export interface MentorCheckInDialogData {
  youth: { id: string; name: string }[];
  fixed: { id: string; name: string } | null;
}
