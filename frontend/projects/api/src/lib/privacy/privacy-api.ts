import type { Observable } from 'rxjs';
import type { LoadResult } from '../load-result';
import type { WriteOutcome } from '../write-outcome';
import type { PrivacySettings } from './privacy-settings';

/** Settings › Privacy and data. */
export interface PrivacyApi {
  load(): Observable<LoadResult<PrivacySettings>>;
  saveRetention(years: number | null): Observable<WriteOutcome>;
}
