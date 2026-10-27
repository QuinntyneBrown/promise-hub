import type { Observable } from 'rxjs';
import type { LoadResult } from '../load-result';
import type { WriteOutcome } from '../write-outcome';
import type { DataRequest } from './data-request';
import type { PrivacySettings } from './privacy-settings';
import type { ConsentPolicy } from './consent-policy';

/** Settings › Privacy and data. */
export interface PrivacyApi {
  load(): Observable<LoadResult<PrivacySettings>>;
  saveRetention(years: number | null): Observable<WriteOutcome>;
  /** The consent age and wording; not found while Roster is off. */
  consentPolicy(): Observable<LoadResult<ConsentPolicy>>;
  saveConsentPolicy(policy: ConsentPolicy): Observable<WriteOutcome>;
  requests(): Observable<LoadResult<{ requests: DataRequest[] }>>;
  fulfil(id: string): Observable<WriteOutcome>;
  /** Where the browser downloads a fulfilled export from. */
  exportUrl(id: string): string;
}
