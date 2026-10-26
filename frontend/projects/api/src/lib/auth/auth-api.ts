import type { ResetCheck } from './reset-check';
import type { ResetOutcome } from './reset-outcome';
import type { Observable } from 'rxjs';
import type { SignInOutcome } from './sign-in-outcome';
import type { SignInRequest } from './sign-in-request';

export interface AuthApi {
  signIn(request: SignInRequest): Observable<SignInOutcome>;
  completeMfa(code: string, trustDevice: boolean): Observable<SignInOutcome>;
  signOut(): Observable<void>;
  /** Emails a reset link when the address has an account; the answer is the same either way. */
  forgotPassword(email: string): Observable<'sent' | 'error'>;
  checkReset(token: string): Observable<ResetCheck>;
  resetPassword(token: string, password: string, repeat: string): Observable<ResetOutcome>;
}
