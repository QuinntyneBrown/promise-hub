import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api-base-url';
import { toLoad, toWrite } from '../http-results';
import { LoadResult } from '../load-result';
import { WriteOutcome } from '../write-outcome';
import { NewOrganization } from './new-organization';
import { PlatformApi } from './platform-api';
import { PlatformOrganization } from './platform-organization';

@Injectable()
export class HttpPlatformApi implements PlatformApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  organizations(): Observable<LoadResult<{ organizations: PlatformOrganization[] }>> {
    return toLoad(
      this.http.get<{ organizations: PlatformOrganization[] }>(
        `${this.baseUrl}/platform/organizations`,
      ),
    );
  }

  add(organization: NewOrganization): Observable<WriteOutcome> {
    return toWrite(
      this.http.post<{ id: string }>(`${this.baseUrl}/platform/organizations`, organization),
    );
  }

  suspend(id: string, reason: string): Observable<WriteOutcome> {
    return toWrite(
      this.http.post<null>(`${this.baseUrl}/platform/organizations/${id}/suspend`, { reason }),
    );
  }

  reinstate(id: string): Observable<WriteOutcome> {
    return toWrite(
      this.http.post<null>(`${this.baseUrl}/platform/organizations/${id}/reinstate`, null),
    );
  }
}
