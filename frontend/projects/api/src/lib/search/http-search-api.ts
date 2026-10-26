import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api-base-url';
import { toLoad } from '../http-results';
import { LoadResult } from '../load-result';
import { SearchApi } from './search-api';
import { SearchResults } from './search-results';

@Injectable()
export class HttpSearchApi implements SearchApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  search(q: string): Observable<LoadResult<SearchResults>> {
    return toLoad(
      this.http.get<SearchResults>(`${this.baseUrl}/search`, {
        params: new HttpParams().set('q', q),
      }),
    );
  }
}
