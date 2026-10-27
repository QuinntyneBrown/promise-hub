import type { ProgramEvent } from './program-event';
import type { RosterChild } from './roster-child';

export interface Program {
  id: string;
  name: string;
  startsOn: string;
  endsOn: string;
  schedule: string | null;
  capacity: number;
  ages: string | null;
  enrollmentOpen: boolean;
  seasonConsent: boolean;
  status: 'Active' | 'Archived';
  enrolled: number;
  roster: RosterChild[];
  events: ProgramEvent[];
  archivedAt: string | null;
  archivedBy: string | null;
  /** The one link families use to enroll, once enrollment has been opened. */
  enrollmentUrl: string | null;
  pendingReviews: number;
  waitlisted: number;
  /** The cohort's term, such as "2026–27" (L2-061); null when none. */
  term: string | null;
}
