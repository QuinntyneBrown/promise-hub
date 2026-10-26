import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api-base-url';
import { toLoad } from '../http-results';
import { LoadResult } from '../load-result';
import { TodayApi } from './today-api';
import { TodaySummary } from './today-summary';

@Injectable()
export class HttpTodayApi implements TodayApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  summary(): Observable<LoadResult<TodaySummary>> {
    return toLoad(this.http.get<TodaySummary>(`${this.baseUrl}/today`));
  }
}
