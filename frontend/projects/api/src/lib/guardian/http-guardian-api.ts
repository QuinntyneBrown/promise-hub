import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import { API_BASE_URL } from '../api-base-url';
import { toWrite } from '../http-results';
import { WriteOutcome } from '../write-outcome';
import { NewPickup } from '../pickups/new-pickup';
import { GuardianAnswers } from './guardian-answers';
import { GuardianApi } from './guardian-api';
import { GuardianHome } from './guardian-home';
import { GuardianPageResult } from './guardian-page-result';
import { GuardianSlip } from './guardian-slip';
import { GuardianSlipResult } from './guardian-slip-result';
import { GuardianVerifyOutcome } from './guardian-verify-outcome';

@Injectable()
export class HttpGuardianApi implements GuardianApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  slip(token: string): Observable<GuardianSlipResult> {
    return this.page<GuardianSlip>(`${this.baseUrl}/g/slips/${encodeURIComponent(token)}`);
  }

  home(token: string): Observable<GuardianPageResult<GuardianHome>> {
    return this.page<GuardianHome>(`${this.baseUrl}/g/home/${encodeURIComponent(token)}`);
  }

  answerNoShow(
    token: string,
    eventId: string,
    reply: 'OnTheWay' | 'Absent',
  ): Observable<WriteOutcome> {
    return toWrite(
      this.http.post<null>(`${this.baseUrl}/g/home/${encodeURIComponent(token)}/no-show`, {
        eventId,
        reply,
      }),
    );
  }

  addPickup(token: string, childId: string, pickup: NewPickup): Observable<WriteOutcome> {
    return toWrite(
      this.http.post<{ id: string }>(
        `${this.baseUrl}/g/home/${encodeURIComponent(token)}/children/${childId}/pickups`,
        pickup,
      ),
    );
  }

  removePickup(token: string, childId: string, pickupId: string): Observable<WriteOutcome> {
    return toWrite(
      this.http.delete<null>(
        `${this.baseUrl}/g/home/${encodeURIComponent(token)}/children/${childId}/pickups/${pickupId}`,
      ),
    );
  }

  decidePickup(token: string, requestId: string, approve: boolean): Observable<WriteOutcome> {
    return toWrite(
      this.http.post<null>(
        `${this.baseUrl}/g/home/${encodeURIComponent(token)}/pickup-requests/${requestId}`,
        { approve },
      ),
    );
  }

  private page<T>(url: string): Observable<GuardianPageResult<T>> {
    return this.http.get<T>(url).pipe(
      map((value): GuardianPageResult<T> => ({ status: 'loaded', value })),
      catchError((error: HttpErrorResponse) =>
        of<GuardianPageResult<T>>(
          error.status === 401
            ? {
                status: 'verify',
                language: error.error?.language ?? 'en',
                organization: error.error?.organization ?? '',
                phone: error.error?.phone ?? null,
                contacts: error.error?.contacts ?? [],
              }
            : error.status === 410
              ? {
                  status: 'gone',
                  organization: error.error?.organization ?? null,
                  phone: error.error?.phone ?? null,
                }
              : error.status === 404
                ? { status: 'not-found' }
                : { status: 'error' },
        ),
      ),
    );
  }

  requestCode(token: string, contact: string): Observable<'sent' | 'gone' | 'error'> {
    return this.http.post(`${this.baseUrl}/g/auth/code`, { token, contact }).pipe(
      map(() => 'sent' as const),
      catchError((error: HttpErrorResponse) =>
        of(error.status === 410 ? ('gone' as const) : ('error' as const)),
      ),
    );
  }

  verify(token: string, code: string): Observable<GuardianVerifyOutcome> {
    return this.http.post(`${this.baseUrl}/g/auth/verify`, { token, code }).pipe(
      map((): GuardianVerifyOutcome => ({ status: 'verified' })),
      catchError((error: HttpErrorResponse) =>
        of<GuardianVerifyOutcome>(
          error.status === 422
            ? { status: 'invalid', message: error.error?.errors?.code ?? '' }
            : error.status === 423
              ? { status: 'locked' }
              : error.status === 410
                ? { status: 'gone' }
                : { status: 'error' },
        ),
      ),
    );
  }

  sign(token: string, answers: GuardianAnswers): Observable<WriteOutcome> {
    return toWrite(
      this.http.post<null>(`${this.baseUrl}/g/slips/${encodeURIComponent(token)}/sign`, answers),
    );
  }

  decline(token: string, name: string, reason: string): Observable<WriteOutcome> {
    return toWrite(
      this.http.post<null>(`${this.baseUrl}/g/slips/${encodeURIComponent(token)}/decline`, {
        name,
        reason,
      }),
    );
  }
}
