import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api-base-url';
import { toLoad, toWrite } from '../http-results';
import { LoadResult } from '../load-result';
import { WriteOutcome } from '../write-outcome';
import { ConsentPolicy } from '../privacy/consent-policy';
import { MentoringSettings } from './mentoring-settings';
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

  uploadLogo(file: File): Observable<WriteOutcome> {
    const form = new FormData();
    form.append('file', file, file.name);
    return toWrite(this.http.post<null>(`${this.baseUrl}/settings/organization/logo`, form));
  }

  removeLogo(): Observable<WriteOutcome> {
    return toWrite(this.http.delete<null>(`${this.baseUrl}/settings/organization/logo`));
  }

  logoUrl(version: string): string {
    return `${this.baseUrl}/settings/organization/logo?v=${encodeURIComponent(version)}`;
  }

  learning(): Observable<LoadResult<ConsentPolicy>> {
    return toLoad(this.http.get<ConsentPolicy>(`${this.baseUrl}/settings/learning`));
  }

  saveLearning(policy: ConsentPolicy): Observable<WriteOutcome> {
    return toWrite(this.http.put<null>(`${this.baseUrl}/settings/learning`, policy));
  }

  mentoring(): Observable<LoadResult<MentoringSettings>> {
    return toLoad(this.http.get<MentoringSettings>(`${this.baseUrl}/settings/mentoring`));
  }

  saveMentoring(settings: MentoringSettings): Observable<WriteOutcome> {
    return toWrite(this.http.put<null>(`${this.baseUrl}/settings/mentoring`, settings));
  }
}
