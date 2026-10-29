import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api-base-url';
import { toLoad } from '../http-results';
import { LoadResult } from '../load-result';
import { PublicContent } from './public-content';
import { PublicSite } from './public-site';
import { WebsiteApi } from './website-api';

@Injectable()
export class HttpWebsiteApi implements WebsiteApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  site(slug: string): Observable<LoadResult<PublicSite>> {
    return toLoad(this.http.get<PublicSite>(this.url(slug)));
  }

  content(slug: string): Observable<LoadResult<PublicContent>> {
    return toLoad(this.http.get<PublicContent>(`${this.url(slug)}/content`));
  }

  private url(slug: string): string {
    return `${this.baseUrl}/website/${encodeURIComponent(slug)}`;
  }
}
