import type { Observable } from 'rxjs';
import type { LoadResult } from '../load-result';
import type { ApplicationList } from './application-list';
import type { ApplicationStatus } from './application-status';

/** The organization's application pipeline (L2-072). */
export interface ApplicationsApi {
  list(status: ApplicationStatus): Observable<LoadResult<ApplicationList>>;
}
