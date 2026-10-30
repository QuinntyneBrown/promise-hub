import type { Observable } from 'rxjs';
import type { LoadResult } from '../load-result';
import type { WriteOutcome } from '../write-outcome';
import type { LearningBondAgreement } from './learning-bond-agreement';
import type { LearningBondLaunch } from './learning-bond-launch';
import type { LearningBondLink } from './learning-bond-link';
import type { LearningBondMissingContact } from './learning-bond-missing-contact';
import type { LearningBondStatus } from './learning-bond-status';
import type { LearningBondInvitation } from './learning-bond-invitation';
import type { LearningBondOverview } from './learning-bond-overview';
import type { LearningBondSettings } from './learning-bond-settings';
import type { RequestLearningBondSigner } from './request-learning-bond-signer';
import type { SaveLearningBondSettings } from './save-learning-bond-settings';
import type { LearningBondSignerOutcome } from './learning-bond-signer-outcome';
import type { LearningBondSignerResult } from './learning-bond-signer-result';

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
  /** GET /sign/learning-bond/{token}: the named signer's agreement, with no sign-in, whether Learning Bond is on or off (ADR 0078). */
  signerAgreement(token: string): Observable<LearningBondSignerResult>;
  /** POST /sign/learning-bond/{token}/acceptances: accepts as the named signer; invalid without the authority box. */
  acceptAsSigner(token: string, authority: boolean): Observable<LearningBondSignerOutcome>;
  /** GET /learning-bond/settings: coverage and status roles, with each running program's households. */
  settings(): Observable<LoadResult<LearningBondSettings>>;
  /** PUT /learning-bond/settings: invalid for no program, a program that isn't running, or a role that may not see status. */
  saveSettings(request: SaveLearningBondSettings): Observable<WriteOutcome>;
  /** GET /learning-bond/overview: the hub's agreement, coverage, invitation and launch summary. */
  overview(): Observable<LoadResult<LearningBondOverview>>;
  /** GET /learning-bond/launch: the covered households, how each can be reached, and the launch as chosen. */
  launch(): Observable<LoadResult<LearningBondLaunch>>;
  /** GET /learning-bond/launch/missing-contacts: covered households with no mobile number or email. */
  missingContacts(): Observable<LoadResult<LearningBondMissingContact[]>>;
  /** POST /learning-bond/launch: schedules for a day (yyyy-mm-dd) or chooses at the door; invalid by field. */
  scheduleLaunch(mode: 'Scheduled' | 'AtTheDoor', date: string | null): Observable<WriteOutcome>;
  /** PUT /learning-bond/launch: moves a scheduled launch that hasn't sent. */
  moveLaunch(date: string): Observable<WriteOutcome>;
  /** DELETE /learning-bond/launch: cancels a launch that hasn't sent; nothing goes out. */
  cancelLaunch(): Observable<WriteOutcome>;
  /** GET /learning-bond/invitation: the sender name and the wording in each language the households use. */
  invitation(): Observable<LoadResult<LearningBondInvitation>>;
  /** PUT /learning-bond/invitation: the sender name; invalid unless 1 to 30 letters, numbers and spaces. */
  saveInvitation(senderName: string): Observable<WriteOutcome>;
}
