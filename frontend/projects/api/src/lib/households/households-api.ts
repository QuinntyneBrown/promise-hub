import type { Observable } from 'rxjs';
import type { LoadResult } from '../load-result';
import type { WriteOutcome } from '../write-outcome';
import type { Child } from './child';
import type { ChildChanges } from './child-changes';
import type { GuardianChanges } from './guardian-changes';
import type { Household } from './household';
import type { HouseholdList } from './household-list';
import type { MedicalChanges } from './medical-changes';
import type { NewChild } from './new-child';
import type { NewFamily } from './new-family';
import type { NewGuardian } from './new-guardian';

export interface HouseholdsApi {
  list(q: string, filter: string): Observable<LoadResult<HouseholdList>>;
  get(id: string): Observable<LoadResult<Household>>;
  getChild(id: string): Observable<LoadResult<Child>>;
  create(family: NewFamily): Observable<WriteOutcome>;
  addChild(householdId: string, child: NewChild): Observable<WriteOutcome>;
  addGuardian(householdId: string, guardian: NewGuardian): Observable<WriteOutcome>;
  updateGuardian(id: string, changes: GuardianChanges): Observable<WriteOutcome>;
  updateChild(id: string, changes: ChildChanges): Observable<WriteOutcome>;
  updateMedical(id: string, changes: MedicalChanges): Observable<WriteOutcome>;
  delete(id: string, reason: string, confirmName: string): Observable<WriteOutcome>;
}
