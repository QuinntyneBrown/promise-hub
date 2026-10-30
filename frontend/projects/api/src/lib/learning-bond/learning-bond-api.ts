import type { Observable } from 'rxjs';
import type { LoadResult } from '../load-result';
import type { WriteOutcome } from '../write-outcome';
import type { LearningBondAgreement } from './learning-bond-agreement';
import type { LearningBondLink } from './learning-bond-link';
import type { LearningBondStatus } from './learning-bond-status';
import type { LearningBondSettings } from './learning-bond-settings';
import type { RequestLearningBondSigner } from './request-learning-bond-signer';
import type { SaveLearningBondSettings } from './save-learning-bond-settings';

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
  /** POST /learning-bond/agreement/signers: names a signer and emails the link; replaces an open request; invalid by field. */
  requestSigner(request: RequestLearningBondSigner): Observable<WriteOutcome>;
  /** POST /learning-bond/agreement/signers/{id}/resend: a new link to the same signer. */
  resendSigner(id: string): Observable<WriteOutcome>;
  /** DELETE /learning-bond/agreement/signers/{id}: cancels the open request; its link stops working. */
  cancelSigner(id: string): Observable<WriteOutcome>;
  /** GET /learning-bond/settings: coverage and status roles, with each running program's households. */
  settings(): Observable<LoadResult<LearningBondSettings>>;
  /** PUT /learning-bond/settings: invalid for no program, a program that isn't running, or a role that may not see status. */
  saveSettings(request: SaveLearningBondSettings): Observable<WriteOutcome>;
}
