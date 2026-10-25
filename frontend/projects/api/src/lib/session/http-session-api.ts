import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, shareReplay } from 'rxjs';
import { API_BASE_URL } from '../api-base-url';
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

  reset(): void {
    this.session$ = null;
  }
}
