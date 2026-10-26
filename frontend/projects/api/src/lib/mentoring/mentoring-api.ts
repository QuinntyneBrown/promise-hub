import type { Observable } from 'rxjs';
import type { LoadResult } from '../load-result';
import type { AssignedYouth } from './assigned-youth';

/** The calling mentor’s assigned youth (Mentoring module, ADR 0043). */
export interface MentoringApi {
  youth(): Observable<LoadResult<AssignedYouth>>;
}
