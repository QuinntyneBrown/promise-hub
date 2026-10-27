import type { Observable } from 'rxjs';
import type { LoadResult } from '../load-result';
import type { Learner } from './learner';
import type { LessonsResult } from './lessons-result';
import type { ConsentRequestOutcome } from '../consent/consent-request-outcome';

/** The signed-in youth’s own learning record (Learning module, ADR 0043). */
export interface LearningApi {
  learner(): Observable<LoadResult<Learner>>;
  /** Youth work: refused as consent-required until a guardian consents (L2-056). */
  lessons(): Observable<LessonsResult>;
  /** Asks the guardians of the youth's household for consent. */
  askGuardian(): Observable<ConsentRequestOutcome>;
}
