import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_BASE_URL } from '../api-base-url';
import { toLoad, toWrite } from '../http-results';
import { LoadResult } from '../load-result';
import { WriteOutcome } from '../write-outcome';
import { NotificationPreference } from './notification-preference';
import { NotificationPreferencesApi } from './notification-preferences-api';

@Injectable()
export class HttpNotificationPreferencesApi implements NotificationPreferencesApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  load(): Observable<LoadResult<NotificationPreference[]>> {
    return toLoad(
      this.http
        .get<{ kinds: NotificationPreference[] }>(`${this.baseUrl}/notifications/preferences`)
        .pipe(map((r) => r.kinds)),
    );
  }

  save(choices: { key: string; inApp: boolean }[]): Observable<WriteOutcome> {
    return toWrite(
      this.http.put<null>(`${this.baseUrl}/notifications/preferences`, { kinds: choices }),
    );
  }
}
