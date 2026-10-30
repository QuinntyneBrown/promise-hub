import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api-base-url';
import { toLoad, toWrite } from '../http-results';
import { LoadResult } from '../load-result';
import { WriteOutcome } from '../write-outcome';
import { LearningBondAgreement } from './learning-bond-agreement';
import { LearningBondApi } from './learning-bond-api';
import { LearningBondLink } from './learning-bond-link';
import { LearningBondStatus } from './learning-bond-status';
import { LearningBondInvitation } from './learning-bond-invitation';
import { LearningBondOverview } from './learning-bond-overview';
import { LearningBondSettings } from './learning-bond-settings';
import { RequestLearningBondSigner } from './request-learning-bond-signer';
import { SaveLearningBondSettings } from './save-learning-bond-settings';

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
