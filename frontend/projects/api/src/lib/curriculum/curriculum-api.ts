import type { Observable } from 'rxjs';
import type { LoadResult } from '../load-result';
import type { Curriculum } from './curriculum';

/** The organization’s curriculum for authors (Learning module, ADR 0043). */
export interface CurriculumApi {
  tracks(): Observable<LoadResult<Curriculum>>;
}
