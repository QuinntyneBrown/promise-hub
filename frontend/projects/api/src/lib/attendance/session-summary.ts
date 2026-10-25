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
  status: 'Scheduled' | 'Cancelled';
}
