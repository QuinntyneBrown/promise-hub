import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, Subject, tap } from 'rxjs';
import { API_BASE_URL } from '../api-base-url';
import { toLoad, toWrite } from '../http-results';
import { LoadResult } from '../load-result';
import { WriteOutcome } from '../write-outcome';
import { NotificationList } from './notification-list';
import { NotificationsApi } from './notifications-api';

@Injectable()
export class HttpNotificationsApi implements NotificationsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly changes = new Subject<void>();
  readonly changed = this.changes.asObservable();

  list(): Observable<LoadResult<NotificationList>> {
    return toLoad(this.http.get<NotificationList>(`${this.baseUrl}/notifications`));
  }

  read(id: string): Observable<WriteOutcome> {
    return toWrite(this.http.post<null>(`${this.baseUrl}/notifications/${id}/read`, null)).pipe(
      tap(() => this.changes.next()),
    );
  }

  readAll(): Observable<WriteOutcome> {
    return toWrite(this.http.post<null>(`${this.baseUrl}/notifications/read-all`, null)).pipe(
      tap(() => this.changes.next()),
    );
  }
}
