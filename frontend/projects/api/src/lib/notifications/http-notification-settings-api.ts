import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api-base-url';
import { toLoad, toWrite } from '../http-results';
import { LoadResult } from '../load-result';
import { WriteOutcome } from '../write-outcome';
import { NotificationSettings } from './notification-settings';
import { NotificationSettingsApi } from './notification-settings-api';

@Injectable()
export class HttpNotificationSettingsApi implements NotificationSettingsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  load(): Observable<LoadResult<NotificationSettings>> {
    return toLoad(this.http.get<NotificationSettings>(`${this.baseUrl}/settings/notifications`));
  }

  save(settings: Omit<NotificationSettings, 'smsUsed'>): Observable<WriteOutcome> {
    return toWrite(this.http.put<null>(`${this.baseUrl}/settings/notifications`, settings));
  }
}
