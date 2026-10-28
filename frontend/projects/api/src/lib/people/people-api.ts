import type { Observable } from 'rxjs';
import type { LoadResult } from '../load-result';
import type { WriteOutcome } from '../write-outcome';
import type { PeoplePage } from './people-page';
import type { PeopleQuery } from './people-query';
import type { PersonRecord } from './person-record';

/** Admins find every account of their organization (L2-112 to L2-114). */
export interface PeopleApi {
  list(query: PeopleQuery): Observable<LoadResult<PeoplePage>>;
  /** One account's record; not found outside the organization or once removed. */
  get(id: string): Observable<LoadResult<PersonRecord>>;
  /** Turns the account off: signed out on its next request, records kept; not your own. */
  deactivate(id: string): Observable<WriteOutcome>;
  /** Turns it back on; refused while a youth's child record is deleted. */
  reactivate(id: string): Observable<WriteOutcome>;
}
