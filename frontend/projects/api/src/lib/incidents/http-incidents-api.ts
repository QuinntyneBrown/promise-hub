import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api-base-url';
import { toLoad, toWrite } from '../http-results';
import { LoadResult } from '../load-result';
import { WriteOutcome } from '../write-outcome';
import { Incident, ReviewOutcome } from './incident';
import { IncidentForm } from './incident-form';
import { IncidentReport } from './incident-report';
import { IncidentSummary } from './incident-summary';
import { IncidentsApi } from './incidents-api';

@Injectable()
export class HttpIncidentsApi implements IncidentsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  list(): Observable<LoadResult<{ canReadLog: boolean; incidents: IncidentSummary[] }>> {
    return toLoad(
      this.http.get<{ canReadLog: boolean; incidents: IncidentSummary[] }>(
        `${this.baseUrl}/incidents`,
      ),
    );
  }

  get(id: string): Observable<LoadResult<Incident>> {
    return toLoad(this.http.get<Incident>(`${this.baseUrl}/incidents/${id}`));
  }

  form(): Observable<LoadResult<IncidentForm>> {
    return toLoad(this.http.get<IncidentForm>(`${this.baseUrl}/incidents/form`));
  }

  report(report: IncidentReport): Observable<WriteOutcome> {
    return toWrite(this.http.post<{ id: string }>(`${this.baseUrl}/incidents`, report));
  }

  review(id: string, note: string, outcome: ReviewOutcome): Observable<WriteOutcome> {
    return toWrite(
      this.http.post<null>(`${this.baseUrl}/incidents/${id}/review`, { note, outcome }),
    );
  }

  addFollowUp(id: string, text: string): Observable<WriteOutcome> {
    return toWrite(this.http.post<null>(`${this.baseUrl}/incidents/${id}/notes`, { text }));
  }

  reopen(id: string): Observable<WriteOutcome> {
    return toWrite(this.http.post<null>(`${this.baseUrl}/incidents/${id}/reopen`, {}));
  }
}
