import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { API_BASE_URL } from '../api-base-url';
import { OfflineStore } from '../offline/offline-store';
import { SESSION_API } from '../session/session-api.token';
import { AuthApi } from './auth-api';
import { ResetCheck } from './reset-check';
import { ResetOutcome } from './reset-outcome';
import { SignInOutcome } from './sign-in-outcome';
import { SignInRequest } from './sign-in-request';

@Injectable()
export class HttpAuthApi implements AuthApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly session = inject(SESSION_API);
  private readonly offline = inject(OfflineStore);

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
      // The device forgets the session and its saved data even when the request fails (L2-048).
      tap(() => {
        this.session.reset();
        this.offline.clear();
      }),
      map(() => undefined),
    );
  }

  forgotPassword(email: string): Observable<'sent' | 'error'> {
    return this.http.post(`${this.baseUrl}/auth/forgot-password`, { email }).pipe(
      map(() => 'sent' as const),
      catchError(() => of('error' as const)),
    );
  }

  checkReset(token: string): Observable<ResetCheck> {
    return this.http
      .get<{ email: string }>(`${this.baseUrl}/auth/reset-password/${encodeURIComponent(token)}`)
      .pipe(
        map((r): ResetCheck => ({ status: 'ok', email: r.email })),
        catchError((e: HttpErrorResponse) =>
          of<ResetCheck>(e.status === 410 ? { status: 'gone' } : { status: 'error' }),
        ),
      );
  }

  resetPassword(token: string, password: string, repeat: string): Observable<ResetOutcome> {
    return this.http
      .post<{ status: string }>(`${this.baseUrl}/auth/reset-password`, { token, password, repeat })
      .pipe(
        map((body): ResetOutcome =>
          body.status === 'mfa-required' ? { status: 'mfa-required' } : { status: 'signed-in' },
        ),
        tap((outcome) => outcome.status === 'signed-in' && this.session.reset()),
        catchError((e: HttpErrorResponse) =>
          of<ResetOutcome>(
            e.status === 422
              ? { status: 'invalid', errors: e.error?.errors ?? {} }
              : e.status === 410
                ? { status: 'gone' }
                : { status: 'error' },
          ),
        ),
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
