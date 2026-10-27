import type { MentorCohortMember } from './mentor-cohort-member';

/** A cohort on the mentor’s team (L2-065): their role, the team by name and the active roster. */
export interface MentorCohort {
  programId: string;
  name: string;
  term: string | null;
  schedule: string | null;
  role: 'Lead' | 'Supporting';
  lead: string | null;
  supporting: string[];
  members: MentorCohortMember[];
}
