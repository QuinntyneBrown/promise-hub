/** A youth’s attendance at a session that has started. */
export interface MentorAttendance {
  session: string;
  at: string;
  status: 'CheckedIn' | 'SignedOut' | 'Absent';
}
