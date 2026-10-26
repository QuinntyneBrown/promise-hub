import type { Observable } from 'rxjs';
import type { LoadResult } from '../load-result';
import type { WriteOutcome } from '../write-outcome';
import type { NotificationList } from './notification-list';

/** The signed-in person's in-app notifications. */
export interface NotificationsApi {
  list(): Observable<LoadResult<NotificationList>>;
  read(id: string): Observable<WriteOutcome>;
  readAll(): Observable<WriteOutcome>;
}
