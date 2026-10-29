import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import { API_BASE_URL } from '../api-base-url';
import { toLoad } from '../http-results';
import { LoadResult } from '../load-result';
import { ContactMessage } from './contact-message';
import { PublicContent } from './public-content';
import { PublicSite } from './public-site';
import { VolunteerOffer } from './volunteer-offer';
import { WebsiteApi } from './website-api';
import { WebsiteSubmitOutcome } from './website-submit-outcome';

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

  contact(slug: string, message: ContactMessage): Observable<WebsiteSubmitOutcome> {
    return this.submit(this.http.post<null>(`${this.url(slug)}/contact`, message));
  }

  volunteer(slug: string, offer: VolunteerOffer): Observable<WebsiteSubmitOutcome> {
    return this.submit(this.http.post<null>(`${this.url(slug)}/volunteer`, offer));
  }

  private submit(call: Observable<null>): Observable<WebsiteSubmitOutcome> {
    return call.pipe(
      map((): WebsiteSubmitOutcome => ({ status: 'sent' })),
      catchError((error: HttpErrorResponse) => of(outcome(error))),
    );
  }

  private url(slug: string): string {
    return `${this.baseUrl}/website/${encodeURIComponent(slug)}`;
  }
}

/** Maps a failed request to its outcome: 422 field errors, 429 too many, 404 not found, anything else an error. */
function outcome(error: HttpErrorResponse): WebsiteSubmitOutcome {
  if (error.status === 422) return { status: 'invalid', errors: error.error?.errors ?? {} };
  if (error.status === 429) return { status: 'too-many' };
  if (error.status === 404) return { status: 'not-found' };
  return { status: 'error' };
}
