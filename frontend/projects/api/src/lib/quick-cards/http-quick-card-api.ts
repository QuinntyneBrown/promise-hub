import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api-base-url';
import { toLoad } from '../http-results';
import { LoadResult } from '../load-result';
import { QuickCard } from './quick-card';
import { QuickCardApi } from './quick-card-api';

@Injectable()
export class HttpQuickCardApi implements QuickCardApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  get(childId: string): Observable<LoadResult<QuickCard>> {
    return toLoad(this.http.get<QuickCard>(`${this.baseUrl}/children/${childId}/quick-card`));
  }
}
