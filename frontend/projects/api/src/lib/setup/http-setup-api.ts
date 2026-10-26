import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api-base-url';
import { toLoad, toWrite } from '../http-results';
import { LoadResult } from '../load-result';
import { WriteOutcome } from '../write-outcome';
import { OrganizationProfile } from './organization-profile';
import { Setup } from './setup';
import { SetupApi } from './setup-api';

@Injectable()
export class HttpSetupApi implements SetupApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  checklist(): Observable<LoadResult<Setup>> {
    return toLoad(this.http.get<Setup>(`${this.baseUrl}/setup`));
  }

  profile(): Observable<LoadResult<OrganizationProfile>> {
    return toLoad(this.http.get<OrganizationProfile>(`${this.baseUrl}/settings/organization`));
  }

  saveProfile(profile: OrganizationProfile): Observable<WriteOutcome> {
    return toWrite(this.http.put<null>(`${this.baseUrl}/settings/organization`, profile));
  }
}
