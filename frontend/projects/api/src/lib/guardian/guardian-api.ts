import type { Observable } from 'rxjs';
import type { WriteOutcome } from '../write-outcome';
import type { GuardianAnswers } from './guardian-answers';
import type { GuardianSlipResult } from './guardian-slip-result';
import type { GuardianVerifyOutcome } from './guardian-verify-outcome';

/** Guardian pages: a link, a six-digit code, then the slip. The device cookie is HttpOnly and never read here. */
export interface GuardianApi {
  slip(token: string): Observable<GuardianSlipResult>;
  /** The answer is the same whether or not the contact is on file. */
  requestCode(token: string, contact: string): Observable<'sent' | 'gone' | 'error'>;
  verify(token: string, code: string): Observable<GuardianVerifyOutcome>;
  sign(token: string, answers: GuardianAnswers): Observable<WriteOutcome>;
  decline(token: string, name: string, reason: string): Observable<WriteOutcome>;
}
