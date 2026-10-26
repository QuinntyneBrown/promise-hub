import type { GuardianSurvey } from './guardian-survey';
import type { NewPickup } from '../pickups/new-pickup';
import type { Observable } from 'rxjs';
import type { WriteOutcome } from '../write-outcome';
import type { GuardianAnswers } from './guardian-answers';
import type { GuardianHome } from './guardian-home';
import type { GuardianPageResult } from './guardian-page-result';
import type { GuardianSlipResult } from './guardian-slip-result';
import type { GuardianVerifyOutcome } from './guardian-verify-outcome';

/** Guardian pages: a link, a six-digit code, then the slip or the household's home. The device cookie is HttpOnly and never read here. */
export interface GuardianApi {
  slip(token: string): Observable<GuardianSlipResult>;
  home(token: string): Observable<GuardianPageResult<GuardianHome>>;
  survey(token: string): Observable<GuardianPageResult<GuardianSurvey>>;
  /** Asks for a copy (Export) or deletion (Delete) of the household's data (L2-030 criterion 4). */
  requestData(token: string, kind: 'Export' | 'Delete', email: string): Observable<WriteOutcome>;
  answerSurvey(token: string, rating: number | null, comment: string): Observable<WriteOutcome>;
  answerNoShow(
    token: string,
    eventId: string,
    reply: 'OnTheWay' | 'Absent',
  ): Observable<WriteOutcome>;
  addPickup(token: string, childId: string, pickup: NewPickup): Observable<WriteOutcome>;
  removePickup(token: string, childId: string, pickupId: string): Observable<WriteOutcome>;
  decidePickup(token: string, requestId: string, approve: boolean): Observable<WriteOutcome>;
  updateHousehold(
    token: string,
    contact: { mobile: string; email: string; language: string },
  ): Observable<WriteOutcome>;
  updateMedical(
    token: string,
    childId: string,
    medical: { allergies: string; medication: string },
  ): Observable<WriteOutcome>;
  /** The answer is the same whether or not the contact is on file. */
  requestCode(token: string, contact: string): Observable<'sent' | 'gone' | 'error'>;
  verify(token: string, code: string): Observable<GuardianVerifyOutcome>;
  sign(token: string, answers: GuardianAnswers): Observable<WriteOutcome>;
  decline(token: string, name: string, reason: string): Observable<WriteOutcome>;
}
