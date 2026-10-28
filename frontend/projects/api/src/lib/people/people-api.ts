import type { Observable } from 'rxjs';
import type { LoadResult } from '../load-result';
import type { PeoplePage } from './people-page';
import type { PeopleQuery } from './people-query';

/** Admins find every account of their organization (L2-112 to L2-114). */
export interface PeopleApi {
  list(query: PeopleQuery): Observable<LoadResult<PeoplePage>>;
}
