import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api-base-url';
import { toLoad } from '../http-results';
import { LoadResult } from '../load-result';
import { Report } from './report';
import { ReportExport } from './report-export';
import { ReportsApi } from './reports-api';
import { SurveySent } from './survey-sent';

@Injectable()
export class HttpReportsApi implements ReportsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  report(programId: string | null): Observable<LoadResult<Report>> {
    const params = programId ? new HttpParams().set('programId', programId) : undefined;
    return toLoad(this.http.get<Report>(`${this.baseUrl}/reports`, { params }));
  }

  export(programId: string | null): Observable<LoadResult<ReportExport>> {
    return toLoad(this.http.post<ReportExport>(`${this.baseUrl}/reports/exports`, { programId }));
  }

  sendSurvey(eventId: string): Observable<LoadResult<SurveySent>> {
    return toLoad(this.http.post<SurveySent>(`${this.baseUrl}/events/${eventId}/survey`, {}));
  }

  downloadUrl(id: string): string {
    return `${this.baseUrl}/reports/exports/${id}`;
  }
}
