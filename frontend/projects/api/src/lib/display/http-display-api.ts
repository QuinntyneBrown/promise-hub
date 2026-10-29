import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api-base-url';
import { toLoad, toWrite } from '../http-results';
import { LoadResult } from '../load-result';
import { WriteOutcome } from '../write-outcome';
import { DisplayApi } from './display-api';
import { DisplayPreferences } from './display-preferences';

@Injectable()
export class HttpDisplayApi implements DisplayApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  load(): Observable<LoadResult<DisplayPreferences>> {
    return toLoad(this.http.get<DisplayPreferences>(`${this.baseUrl}/me/display`));
  }

  save(preferences: DisplayPreferences): Observable<WriteOutcome> {
    return toWrite(this.http.put<null>(`${this.baseUrl}/me/display`, preferences));
  }
}
