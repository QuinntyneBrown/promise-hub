import type { Observable } from 'rxjs';
import type { LoadResult } from '../load-result';
import type { WriteOutcome } from '../write-outcome';
import type { EnrollmentDraft } from './enrollment-draft';
import type { EnrollmentPage } from './enrollment-page';
import type { EnrollmentSavedDraft } from './enrollment-saved-draft';
import type { EnrollmentCodeOutcome } from './enrollment-code-outcome';
import type { EnrollmentSubmitOutcome } from './enrollment-submit-outcome';
import type { GuardianVerifyOutcome } from './guardian-verify-outcome';

/** Guardian enrollment through a program's link; the device cookie is HttpOnly and never read here. */
export interface GuardianEnrollmentApi {
  page(slug: string): Observable<LoadResult<EnrollmentPage>>;
  requestCode(slug: string, contact: string): Observable<EnrollmentCodeOutcome>;
  verify(slug: string, contact: string, code: string): Observable<GuardianVerifyOutcome>;
  draft(slug: string): Observable<LoadResult<EnrollmentSavedDraft>>;
  save(slug: string, draft: EnrollmentDraft): Observable<WriteOutcome>;
  submit(slug: string, consent: boolean): Observable<EnrollmentSubmitOutcome>;
}
