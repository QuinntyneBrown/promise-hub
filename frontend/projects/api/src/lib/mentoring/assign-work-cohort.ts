/** A cohort the mentor is on, with the youth on its active roster and the track it follows (L2-092 criterion 1). */
export interface AssignWorkCohort {
  id: string;
  name: string;
  youthCount: number;
  trackId: string | null;
}
