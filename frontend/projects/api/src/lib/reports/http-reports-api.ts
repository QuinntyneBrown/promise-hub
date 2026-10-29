import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api-base-url';
import { toLoad } from '../http-results';
import { LoadResult } from '../load-result';
import { CohortReport } from './cohort-report';
import { Report } from './report';
import { ProgressBoard } from './progress-board';
import { StaffReport } from './staff-report';
import { YouthReport } from './youth-report';
import { ReportExport } from './report-export';
import { ReportExportRequest } from './report-export-request';
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

  cohort(programId: string): Observable<LoadResult<CohortReport>> {
    return toLoad(this.http.get<CohortReport>(`${this.baseUrl}/reports/cohorts/${programId}`));
  }

  youth(childId: string): Observable<LoadResult<YouthReport>> {
    return toLoad(this.http.get<YouthReport>(`${this.baseUrl}/reports/youth/${childId}`));
  }

  staff(days: 30 | 90 | null): Observable<LoadResult<StaffReport>> {
    const params = days ? new HttpParams().set('days', days) : undefined;
    return toLoad(this.http.get<StaffReport>(`${this.baseUrl}/reports/staff`, { params }));
  }

  progress(programId: string): Observable<LoadResult<ProgressBoard>> {
    return toLoad(this.http.get<ProgressBoard>(`${this.baseUrl}/reports/progress/${programId}`));
  }

  export(programId: string | null): Observable<LoadResult<ReportExport>> {
    return toLoad(this.http.post<ReportExport>(`${this.baseUrl}/reports/exports`, { programId }));
  }

  exportReport(request: ReportExportRequest): Observable<LoadResult<ReportExport>> {
    return toLoad(this.http.post<ReportExport>(`${this.baseUrl}/reports/exports`, request));
  }

  sendSurvey(eventId: string): Observable<LoadResult<SurveySent>> {
    return toLoad(this.http.post<SurveySent>(`${this.baseUrl}/events/${eventId}/survey`, {}));
  }

  downloadUrl(id: string): string {
    return `${this.baseUrl}/reports/exports/${id}`;
  }
}
