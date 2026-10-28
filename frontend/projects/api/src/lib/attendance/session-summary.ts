export interface SessionSummary {
  id: string;
  name: string;
  programId: string;
  programName: string;
  startsAt: string;
  endsAt: string;
  place: string | null;
  expected: number;
  checkedIn: number;
  absent: number;
  notYet: number;
  status: 'Scheduled' | 'Cancelled' | 'Ended';
  endedAt?: string | null;
  endedBy?: string | null;
  /** The site lead's notes for the next site lead or the director. */
  notes?: string | null;
  /** Of those checked in, how many were late; of those absent, how many were excused (L2-095). */
  late?: number;
  excused?: number;
}
