import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import { API_BASE_URL } from '../api-base-url';
import { toLoad, toWrite } from '../http-results';
import { LoadResult } from '../load-result';
import { WriteOutcome } from '../write-outcome';
import { LearningBondAgreement } from './learning-bond-agreement';
import { LearningBondApi } from './learning-bond-api';
import { LearningBondLaunch } from './learning-bond-launch';
import { LearningBondLink } from './learning-bond-link';
import { LearningBondMissingContact } from './learning-bond-missing-contact';
import { LearningBondStatus } from './learning-bond-status';
import { LearningBondInvitation } from './learning-bond-invitation';
import { LearningBondOverview } from './learning-bond-overview';
import { LearningBondSettings } from './learning-bond-settings';
import { RequestLearningBondSigner } from './request-learning-bond-signer';
import { SaveLearningBondSettings } from './save-learning-bond-settings';
import { LearningBondSignerAcceptance } from './learning-bond-signer-acceptance';
import { LearningBondSignerAgreement } from './learning-bond-signer-agreement';
import { LearningBondSignerOutcome } from './learning-bond-signer-outcome';
import { LearningBondSignerResult } from './learning-bond-signer-result';

@Injectable()
export class HttpLearningBondApi implements LearningBondApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  status(): Observable<LoadResult<LearningBondStatus>> {
    return toLoad(this.http.get<LearningBondStatus>(`${this.baseUrl}/learning-bond`));
  }

  link(token: string): Observable<LoadResult<LearningBondLink>> {
    return toLoad(
      this.http.get<LearningBondLink>(
        `${this.baseUrl}/g/learning-bond/${encodeURIComponent(token)}`,
      ),
    );
  }

  signerAgreement(token: string): Observable<LearningBondSignerResult> {
    return this.http
      .get<LearningBondSignerAgreement>(
        `${this.baseUrl}/sign/learning-bond/${encodeURIComponent(token)}`,
      )
      .pipe(
        map((value): LearningBondSignerResult => ({ status: 'loaded', value })),
        catchError((error: HttpErrorResponse) =>
          of<LearningBondSignerResult>(
            error.status === 410
              ? { status: 'expired', organization: error.error?.organization ?? '' }
              : error.status === 404
                ? { status: 'not-found' }
                : { status: 'error' },
          ),
        ),
      );
  }

  acceptAsSigner(token: string, authority: boolean): Observable<LearningBondSignerOutcome> {
    return this.http
      .post<LearningBondSignerAcceptance>(
        `${this.baseUrl}/sign/learning-bond/${encodeURIComponent(token)}/acceptances`,
        { authority },
      )
      .pipe(
        map((value): LearningBondSignerOutcome => ({ status: 'accepted', value })),
        catchError((error: HttpErrorResponse) =>
          of<LearningBondSignerOutcome>(
            error.status === 422
              ? { status: 'invalid', errors: error.error?.errors ?? {} }
              : error.status === 410
                ? { status: 'expired', organization: error.error?.organization ?? '' }
                : error.status === 404
                  ? { status: 'not-found' }
                  : { status: 'error' },
          ),
        ),
      );
  }

  launch(): Observable<LoadResult<LearningBondLaunch>> {
    return toLoad(this.http.get<LearningBondLaunch>(`${this.baseUrl}/learning-bond/launch`));
  }

  missingContacts(): Observable<LoadResult<LearningBondMissingContact[]>> {
    return toLoad(
      this.http
        .get<{
          households: LearningBondMissingContact[];
        }>(`${this.baseUrl}/learning-bond/launch/missing-contacts`)
        .pipe(map((r) => r.households)),
    );
  }

  scheduleLaunch(mode: 'Scheduled' | 'AtTheDoor', date: string | null): Observable<WriteOutcome> {
    return toWrite(
      this.http.post<{ id: string }>(`${this.baseUrl}/learning-bond/launch`, { mode, date }),
    );
  }

  moveLaunch(date: string): Observable<WriteOutcome> {
    return toWrite(this.http.put<null>(`${this.baseUrl}/learning-bond/launch`, { date }));
  }

  cancelLaunch(): Observable<WriteOutcome> {
    return toWrite(this.http.delete<null>(`${this.baseUrl}/learning-bond/launch`));
  }

  agreement(): Observable<LoadResult<LearningBondAgreement>> {
    return toLoad(this.http.get<LearningBondAgreement>(`${this.baseUrl}/learning-bond/agreement`));
  }

  acceptAgreement(authority: boolean): Observable<WriteOutcome> {
    return toWrite(
      this.http.post<{ id: string }>(`${this.baseUrl}/learning-bond/agreement/acceptances`, {
        authority,
      }),
    );
  }

  requestSigner(request: RequestLearningBondSigner): Observable<WriteOutcome> {
    return toWrite(
      this.http.post<{ id: string }>(`${this.baseUrl}/learning-bond/agreement/signers`, request),
    );
  }

  resendSigner(id: string): Observable<WriteOutcome> {
    return toWrite(
      this.http.post<null>(
        `${this.baseUrl}/learning-bond/agreement/signers/${encodeURIComponent(id)}/resend`,
        null,
      ),
    );
  }

  settings(): Observable<LoadResult<LearningBondSettings>> {
    return toLoad(this.http.get<LearningBondSettings>(`${this.baseUrl}/learning-bond/settings`));
  }

  saveSettings(request: SaveLearningBondSettings): Observable<WriteOutcome> {
    return toWrite(this.http.put<null>(`${this.baseUrl}/learning-bond/settings`, request));
  }

  overview(): Observable<LoadResult<LearningBondOverview>> {
    return toLoad(this.http.get<LearningBondOverview>(`${this.baseUrl}/learning-bond/overview`));
  }

  invitation(): Observable<LoadResult<LearningBondInvitation>> {
    return toLoad(
      this.http.get<LearningBondInvitation>(`${this.baseUrl}/learning-bond/invitation`),
    );
  }

  saveInvitation(senderName: string): Observable<WriteOutcome> {
    return toWrite(this.http.put<null>(`${this.baseUrl}/learning-bond/invitation`, { senderName }));
  }

  cancelSigner(id: string): Observable<WriteOutcome> {
    return toWrite(
      this.http.delete<null>(
        `${this.baseUrl}/learning-bond/agreement/signers/${encodeURIComponent(id)}`,
      ),
    );
  }
}
