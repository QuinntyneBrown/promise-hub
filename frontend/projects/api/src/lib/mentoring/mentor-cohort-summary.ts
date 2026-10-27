/** A cohort on the mentor’s team, their role on it and how many youth are on its active roster. */
export interface MentorCohortSummary {
  programId: string;
  name: string;
  term: string | null;
  role: 'Lead' | 'Supporting';
  youthCount: number;
}
