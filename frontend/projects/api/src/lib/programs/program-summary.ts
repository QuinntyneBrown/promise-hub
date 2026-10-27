export interface ProgramSummary {
  id: string;
  name: string;
  schedule: string | null;
  startsOn: string;
  endsOn: string;
  enrolled: number;
  capacity: number;
  enrollmentOpen: boolean;
  status: 'Active' | 'Archived';
  /** The cohort's term, such as "2026–27" (L2-061); null when none. */
  term: string | null;
}
