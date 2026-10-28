/** Narrows the mentor check-in history to one youth or one kind (L2-090 criterion 4). */
export interface MentorCheckInFilter {
  childId?: string | null;
  kind?: string | null;
}
