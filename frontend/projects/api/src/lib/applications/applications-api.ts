import type { Observable } from 'rxjs';
import type { LoadResult } from '../load-result';
import type { WriteOutcome } from '../write-outcome';
import type { Application } from './application';
import type { ApplicationList } from './application-list';
import type { ApplicationStatus } from './application-status';

/** The organization's application pipeline (L2-072). */
export interface ApplicationsApi {
  list(status: ApplicationStatus): Observable<LoadResult<ApplicationList>>;
  get(id: string): Observable<LoadResult<Application>>;
  addNote(id: string, text: string): Observable<WriteOutcome>;
}
