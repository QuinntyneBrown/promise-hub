import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api-base-url';
import { toLoad, toWrite } from '../http-results';
import { LoadResult } from '../load-result';
import { WriteOutcome } from '../write-outcome';
import { Application } from './application';
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

  get(id: string): Observable<LoadResult<Application>> {
    return toLoad(this.http.get<Application>(`${this.baseUrl}/applications/${id}`));
  }

  addNote(id: string, text: string): Observable<WriteOutcome> {
    return toWrite(
      this.http.post<{ id: string }>(`${this.baseUrl}/applications/${id}/notes`, { text }),
    );
  }
}
