import type { Observable } from 'rxjs';
import type { LoadResult } from '../load-result';
import type { WriteOutcome } from '../write-outcome';
import type { NotificationSettings } from './notification-settings';

/** Settings › Notifications. */
export interface NotificationSettingsApi {
  load(): Observable<LoadResult<NotificationSettings>>;
  save(settings: Omit<NotificationSettings, 'smsUsed'>): Observable<WriteOutcome>;
}
