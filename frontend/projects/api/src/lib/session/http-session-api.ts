import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, shareReplay } from 'rxjs';
import { API_BASE_URL } from '../api-base-url';
import { toWrite } from '../http-results';
import { WriteOutcome } from '../write-outcome';
import { MyOrganization } from './my-organization';
import { Session } from './session';
import { SessionApi } from './session-api';

@Injectable()
export class HttpSessionApi implements SessionApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private session$: Observable<Session> | null = null;

  current(): Observable<Session> {
    this.session$ ??= this.http
      .get<Session>(`${this.baseUrl}/me`)
      .pipe(shareReplay({ bufferSize: 1, refCount: false }));
    return this.session$;
  }

  organizations(): Observable<MyOrganization[]> {
    return this.http
      .get<{ organizations: MyOrganization[] }>(`${this.baseUrl}/me/organizations`)
      .pipe(
        map((r) => r.organizations),
        catchError(() => of([])),
      );
  }

  switchTo(membershipId: string): Observable<WriteOutcome> {
    return toWrite(this.http.post<null>(`${this.baseUrl}/me/organization`, { membershipId }));
  }

  reset(): void {
    this.session$ = null;
  }
}
