import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api-base-url';
import { toLoad } from '../http-results';
import { LoadResult } from '../load-result';
import { ApplicationList } from './application-list';
import { ApplicationStatus } from './application-status';
import { ApplicationsApi } from './applications-api';

@Injectable()
export class HttpApplicationsApi implements ApplicationsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  list(status: ApplicationStatus): Observable<LoadResult<ApplicationList>> {
    return toLoad(
      this.http.get<ApplicationList>(`${this.baseUrl}/applications`, { params: { status } }),
    );
  }
}
