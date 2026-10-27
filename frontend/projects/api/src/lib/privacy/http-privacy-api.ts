import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api-base-url';
import { toLoad, toWrite } from '../http-results';
import { LoadResult } from '../load-result';
import { WriteOutcome } from '../write-outcome';
import { DataRequest } from './data-request';
import { PrivacyApi } from './privacy-api';
import { PrivacySettings } from './privacy-settings';
import { ConsentPolicy } from './consent-policy';

@Injectable()
export class HttpPrivacyApi implements PrivacyApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  load(): Observable<LoadResult<PrivacySettings>> {
    return toLoad(this.http.get<PrivacySettings>(`${this.baseUrl}/settings/privacy`));
  }

  requests(): Observable<LoadResult<{ requests: DataRequest[] }>> {
    return toLoad(
      this.http.get<{ requests: DataRequest[] }>(`${this.baseUrl}/settings/data-requests`),
    );
  }

  fulfil(id: string): Observable<WriteOutcome> {
    return toWrite(
      this.http.post<null>(`${this.baseUrl}/settings/data-requests/${id}/fulfil`, null),
    );
  }

  exportUrl(id: string): string {
    return `${this.baseUrl}/settings/data-requests/${id}/export`;
  }

  consentPolicy(): Observable<LoadResult<ConsentPolicy>> {
    return toLoad(this.http.get<ConsentPolicy>(`${this.baseUrl}/settings/consent`));
  }

  saveConsentPolicy(policy: ConsentPolicy): Observable<WriteOutcome> {
    return toWrite(this.http.put<null>(`${this.baseUrl}/settings/consent`, policy));
  }

  saveRetention(years: number | null): Observable<WriteOutcome> {
    return toWrite(
      this.http.put<null>(`${this.baseUrl}/settings/privacy`, { consentRetentionYears: years }),
    );
  }
}
