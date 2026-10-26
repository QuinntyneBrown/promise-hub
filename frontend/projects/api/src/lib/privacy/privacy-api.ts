import type { Observable } from 'rxjs';
import type { LoadResult } from '../load-result';
import type { WriteOutcome } from '../write-outcome';
import type { DataRequest } from './data-request';
import type { PrivacySettings } from './privacy-settings';

/** Settings › Privacy and data. */
export interface PrivacyApi {
  load(): Observable<LoadResult<PrivacySettings>>;
  saveRetention(years: number | null): Observable<WriteOutcome>;
  requests(): Observable<LoadResult<{ requests: DataRequest[] }>>;
  fulfil(id: string): Observable<WriteOutcome>;
  /** Where the browser downloads a fulfilled export from. */
  exportUrl(id: string): string;
}
