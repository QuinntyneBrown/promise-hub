import type { Observable } from 'rxjs';
import type { LoadResult } from '../load-result';
import type { QuickCard } from './quick-card';

export interface QuickCardApi {
  get(childId: string): Observable<LoadResult<QuickCard>>;
}
