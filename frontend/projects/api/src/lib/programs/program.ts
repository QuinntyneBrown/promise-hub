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
}
