import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api-base-url';
import { toLoad, toWrite } from '../http-results';
import { LoadResult } from '../load-result';
import { WriteOutcome } from '../write-outcome';
import { OrganizationDetails } from './organization-details';
import { OrganizationSettingsApi } from './organization-settings-api';
import { SaveOrganizationDetails } from './save-organization-details';

@Injectable()
export class HttpOrganizationSettingsApi implements OrganizationSettingsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  profile(): Observable<LoadResult<OrganizationDetails>> {
    return toLoad(
      this.http.get<OrganizationDetails>(`${this.baseUrl}/settings/organization/profile`),
    );
  }

  saveProfile(profile: SaveOrganizationDetails): Observable<WriteOutcome> {
    return toWrite(this.http.put<null>(`${this.baseUrl}/settings/organization/profile`, profile));
  }
}
