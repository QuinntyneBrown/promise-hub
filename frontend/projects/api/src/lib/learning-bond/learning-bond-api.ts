import type { Observable } from 'rxjs';
import type { LoadResult } from '../load-result';
import type { WriteOutcome } from '../write-outcome';
import type { LearningBondAgreement } from './learning-bond-agreement';
import type { LearningBondLink } from './learning-bond-link';
import type { LearningBondStatus } from './learning-bond-status';

/**
 * The Learning Bond module (ADR 0076). Every call answers not-found while the module is off for the organization, except the agreement,
 * which is served while Roster and Messages are on (ADR 0077); the guardian calls take the organization from the link.
 */
export interface LearningBondApi {
  /** GET /learning-bond: the signed-in organization's module check. */
  status(): Observable<LoadResult<LearningBondStatus>>;
  /** GET /g/learning-bond/{token}: a guardian link; not-found for an unknown link, a suspended organization or the module off. */
  link(token: string): Observable<LoadResult<LearningBondLink>>;
  /** GET /learning-bond/agreement: the current version, the organization's acceptance and the open signer request. */
  agreement(): Observable<LoadResult<LearningBondAgreement>>;
  /** POST /learning-bond/agreement/acceptances: accepts the current version; invalid without the authority box. */
  acceptAgreement(authority: boolean): Observable<WriteOutcome>;
}
