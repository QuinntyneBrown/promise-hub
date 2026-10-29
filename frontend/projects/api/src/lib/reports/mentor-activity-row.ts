/** One mentor's cohorts, caseload, check-ins and reviews in the period, and the load against the 4 to 8 target. */
export interface MentorActivityRow {
  membershipId: string;
  name: string;
  cohorts: { programId: string; name: string; lead: boolean }[];
  caseload: number;
  checkIns: number;
  reviews: number | null;
  load: 'Overloaded' | 'Balanced' | 'Underloaded';
}
