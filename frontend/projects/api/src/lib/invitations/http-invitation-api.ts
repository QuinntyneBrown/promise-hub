import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import { API_BASE_URL } from '../api-base-url';
import { toWrite } from '../http-results';
import { WriteOutcome } from '../write-outcome';
import { Invitation } from './invitation';
import { InvitationApi } from './invitation-api';
import { InvitationResult } from './invitation-result';

@Injectable()
export class HttpInvitationApi implements InvitationApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  get(token: string): Observable<InvitationResult> {
    return this.http
      .get<Invitation>(`${this.baseUrl}/invitations/${encodeURIComponent(token)}`)
      .pipe(
        map((invitation): InvitationResult => ({ status: 'open', invitation })),
        catchError((error: HttpErrorResponse) =>
          of<InvitationResult>(
            error.status === 410
              ? {
                  status: 'gone',
                  reason: error.error?.reason ?? 'used',
                  invitedBy: error.error?.invitedBy ?? null,
                  organization: error.error?.organization ?? null,
                }
              : { status: 'error' },
          ),
        ),
      );
  }

  accept(token: string, name: string, password: string): Observable<WriteOutcome> {
    return toWrite(
      this.http.post<null>(`${this.baseUrl}/invitations/${encodeURIComponent(token)}/accept`, {
        name,
        password,
      }),
    );
  }

  requestNew(token: string): Observable<WriteOutcome> {
    return toWrite(
      this.http.post<null>(
        `${this.baseUrl}/invitations/${encodeURIComponent(token)}/request-new`,
        null,
      ),
    );
  }

  savePhone(mobile: string): Observable<WriteOutcome> {
    return toWrite(this.http.put<null>(`${this.baseUrl}/me/phone`, { mobile }));
  }
}
