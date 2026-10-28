import type { Observable } from 'rxjs';
import type { LoadResult } from '../load-result';
import type { WriteOutcome } from '../write-outcome';
import type { NotificationPreference } from './notification-preference';

/** Your account › Notifications: the signed-in member's own choices (L2-111). */
export interface NotificationPreferencesApi {
  load(): Observable<LoadResult<NotificationPreference[]>>;
  save(choices: { key: string; inApp: boolean }[]): Observable<WriteOutcome>;
}
