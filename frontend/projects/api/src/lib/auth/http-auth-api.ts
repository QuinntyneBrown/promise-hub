import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { API_BASE_URL } from '../api-base-url';
import { SESSION_API } from '../session/session-api.token';
import { AuthApi } from './auth-api';
import { SignInOutcome } from './sign-in-outcome';
import { SignInRequest } from './sign-in-request';

@Injectable()
export class HttpAuthApi implements AuthApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly session = inject(SESSION_API);

  signIn(request: SignInRequest): Observable<SignInOutcome> {
    return this.step(this.http.post<{ status: string }>(`${this.baseUrl}/auth/sign-in`, request));
  }

  completeMfa(code: string, trustDevice: boolean): Observable<SignInOutcome> {
    return this.step(
      this.http.post<{ status: string }>(`${this.baseUrl}/auth/mfa`, { code, trustDevice }),
    );
  }

  signOut(): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/auth/sign-out`, null).pipe(
      catchError(() => of(undefined)),
      tap(() => this.session.reset()),
      map(() => undefined),
    );
  }

  private step(call: Observable<{ status: string }>): Observable<SignInOutcome> {
    return call.pipe(
      map((body): SignInOutcome =>
        body.status === 'mfa-required' ? { status: 'mfa-required' } : { status: 'signed-in' },
      ),
      tap((outcome) => outcome.status === 'signed-in' && this.session.reset()),
      catchError((error: HttpErrorResponse) =>
        of<SignInOutcome>(
          error.status === 423
            ? { status: 'locked', lockedUntil: error.error?.lockedUntil ?? '' }
            : error.status === 401
              ? { status: 'invalid' }
              : { status: 'error' },
        ),
      ),
    );
  }
}
