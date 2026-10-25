import type { Observable } from 'rxjs';
import type { SignInOutcome } from './sign-in-outcome';
import type { SignInRequest } from './sign-in-request';

export interface AuthApi {
  signIn(request: SignInRequest): Observable<SignInOutcome>;
  completeMfa(code: string, trustDevice: boolean): Observable<SignInOutcome>;
  signOut(): Observable<void>;
}
