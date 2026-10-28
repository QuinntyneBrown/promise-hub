import type { Observable } from 'rxjs';
import type { LoadResult } from '../load-result';
import type { WriteOutcome } from '../write-outcome';
import type { DisplayPreferences } from './display-preferences';

/** The signed-in person's own display preferences (GET and PUT /me/display). */
export interface DisplayApi {
  load(): Observable<LoadResult<DisplayPreferences>>;
  save(preferences: DisplayPreferences): Observable<WriteOutcome>;
}
