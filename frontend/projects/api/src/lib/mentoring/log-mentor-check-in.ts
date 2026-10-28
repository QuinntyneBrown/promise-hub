/** Logging a mentor check-in (L2-090 criterion 2); dates are yyyy-MM-dd, kind and engagement by name. */
export interface LogMentorCheckIn {
  childId: string | null;
  date: string;
  kind: string | null;
  engagement: string | null;
  topics: string | null;
  actionItems: string | null;
  privateNotes: string | null;
  followUpOn: string | null;
  shared: boolean;
  guardianInformed: boolean;
}
