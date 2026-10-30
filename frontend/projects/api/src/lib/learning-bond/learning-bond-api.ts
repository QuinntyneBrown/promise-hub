import type { Observable } from 'rxjs';
import type { LoadResult } from '../load-result';
import type { LearningBondLink } from './learning-bond-link';
import type { LearningBondStatus } from './learning-bond-status';

/**
 * The Learning Bond module (ADR 0076). Every call answers not-found while the module is off for the organization; the guardian calls take
 * the organization from the link. Later prompts add the agreement, coverage, claim and benefits calls.
 */
export interface LearningBondApi {
  /** GET /learning-bond: the signed-in organization's module check. */
  status(): Observable<LoadResult<LearningBondStatus>>;
  /** GET /g/learning-bond/{token}: a guardian link; not-found for an unknown link, a suspended organization or the module off. */
  link(token: string): Observable<LoadResult<LearningBondLink>>;
}
