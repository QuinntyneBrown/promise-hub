/** One attendance change of a mentor’s youth at a session. */
export interface MentorActivity {
  childId: string;
  youthName: string;
  kind: 'CheckedIn' | 'SignedOut' | 'Absent';
  session: string;
  at: string;
}
