import type { Observable } from 'rxjs';
import type { LoadResult } from '../load-result';
import type { SearchResults } from './search-results';

/** Global search across the organization. */
export interface SearchApi {
  search(q: string): Observable<LoadResult<SearchResults>>;
}
