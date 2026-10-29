/** A youth due a mentor check-in under the organization's cadence (L2-125 criterion 3). */
export interface MentorCheckInDue {
  childId: string;
  youthName: string;
  /** yyyy-MM-dd of his last mentor check-in with them, or null when there is none. */
  lastCheckIn: string | null;
}
