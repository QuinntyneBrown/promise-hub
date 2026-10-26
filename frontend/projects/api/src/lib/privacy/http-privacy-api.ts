import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api-base-url';
import { toLoad, toWrite } from '../http-results';
import { LoadResult } from '../load-result';
import { WriteOutcome } from '../write-outcome';
import { PrivacyApi } from './privacy-api';
import { PrivacySettings } from './privacy-settings';

@Injectable()
export class HttpPrivacyApi implements PrivacyApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  load(): Observable<LoadResult<PrivacySettings>> {
    return toLoad(this.http.get<PrivacySettings>(`${this.baseUrl}/settings/privacy`));
  }

  saveRetention(years: number | null): Observable<WriteOutcome> {
    return toWrite(
      this.http.put<null>(`${this.baseUrl}/settings/privacy`, { consentRetentionYears: years }),
    );
  }
}
