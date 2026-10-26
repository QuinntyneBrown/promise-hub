import type { Observable } from 'rxjs';
import type { LoadResult } from '../load-result';
import type { TodaySummary } from './today-summary';

/** Today's summary for staff. */
export interface TodayApi {
  summary(): Observable<LoadResult<TodaySummary>>;
}
