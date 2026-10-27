import type { Observable } from 'rxjs';
import type { LoadResult } from '../load-result';
import type { WriteOutcome } from '../write-outcome';
import type { AssignedYouth } from './assigned-youth';
import type { CohortMentoring } from './cohort-mentoring';

/** Mentoring (ADR 0043, ADR 0048): the calling mentor’s youth, and a cohort’s mentors set by program directors. */
export interface MentoringApi {
  youth(): Observable<LoadResult<AssignedYouth>>;
  /** A cohort's team, each roster child's mentor and the active mentors; only while Mentoring is on. */
  cohort(programId: string): Observable<LoadResult<CohortMentoring>>;
  assignYouth(
    programId: string,
    childId: string,
    mentorId: string | null,
  ): Observable<WriteOutcome>;
  unassignYouth(programId: string, childId: string): Observable<WriteOutcome>;
  setCohortMentors(
    programId: string,
    leadMentorId: string | null,
    supportingMentorIds: string[],
  ): Observable<WriteOutcome>;
}
