/** An active program (cohort) and the track it follows, for choosing a track's cohorts. */
export interface CurriculumProgram {
  id: string;
  name: string;
  term: string | null;
  schedule: string | null;
  trackId: string | null;
}
