import type { Observable } from 'rxjs';
import type { LoadResult } from '../load-result';
import type { Learner } from './learner';

/** The signed-in youth’s own learning record (Learning module, ADR 0043). */
export interface LearningApi {
  learner(): Observable<LoadResult<Learner>>;
}
