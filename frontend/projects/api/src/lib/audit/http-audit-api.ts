import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api-base-url';
import { toLoad } from '../http-results';
import { LoadResult } from '../load-result';
import { AuditApi } from './audit-api';
import { AuditFilter } from './audit-filter';
import { AuditLog } from './audit-log';

@Injectable()
export class HttpAuditApi implements AuditApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  search(filter: AuditFilter): Observable<LoadResult<AuditLog>> {
    return toLoad(
      this.http.get<AuditLog>(`${this.baseUrl}/audit`, {
        params: this.params(filter).set('page', filter.page),
      }),
    );
  }

  exportUrl(filter: AuditFilter): string {
    return `${this.baseUrl}/audit/export?${this.params(filter).toString()}`;
  }

  private params(filter: AuditFilter): HttpParams {
    let params = new HttpParams().set('days', filter.days);
    if (filter.q.trim()) params = params.set('q', filter.q.trim());
    if (filter.action) params = params.set('action', filter.action);
    return params;
  }
}
