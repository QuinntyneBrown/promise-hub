import type { Observable } from 'rxjs';
import type { LoadResult } from '../load-result';
import type { WriteOutcome } from '../write-outcome';
import type { Child } from './child';
import type { ChildMatch } from './child-match';
import type { ChildChanges } from './child-changes';
import type { GuardianChanges } from './guardian-changes';
import type { Household } from './household';
import type { HouseholdList } from './household-list';
import type { MedicalChanges } from './medical-changes';
import type { NewChild } from './new-child';
import type { NewFamily } from './new-family';
import type { NewGuardian } from './new-guardian';
import type { ChildConsent } from '../consent/child-consent';
import type { ConsentRequestOutcome } from '../consent/consent-request-outcome';

export interface HouseholdsApi {
  list(q: string, filter: string): Observable<LoadResult<HouseholdList>>;
  get(id: string): Observable<LoadResult<Household>>;
  getChild(id: string): Observable<LoadResult<Child>>;
  /** Children whose name contains the text, for pickers. */
  findChildren(q: string): Observable<LoadResult<{ children: ChildMatch[] }>>;
  create(family: NewFamily): Observable<WriteOutcome>;
  addChild(householdId: string, child: NewChild): Observable<WriteOutcome>;
  addGuardian(householdId: string, guardian: NewGuardian): Observable<WriteOutcome>;
  updateGuardian(id: string, changes: GuardianChanges): Observable<WriteOutcome>;
  updateChild(id: string, changes: ChildChanges): Observable<WriteOutcome>;
  updateMedical(id: string, changes: MedicalChanges): Observable<WriteOutcome>;
  delete(id: string, reason: string, confirmName: string): Observable<WriteOutcome>;
  /** A child's guardian consent (L2-058); not found while Roster is off. */
  consent(childId: string): Observable<LoadResult<ChildConsent>>;
  /** Texts or emails the household a consent link (admins and program directors). */
  sendConsentLink(childId: string): Observable<ConsentRequestOutcome>;
}
