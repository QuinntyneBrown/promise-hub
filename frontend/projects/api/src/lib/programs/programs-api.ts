import type { Observable } from 'rxjs';
import type { LoadResult } from '../load-result';
import type { WriteOutcome } from '../write-outcome';
import type { Program } from './program';
import type { ProgramFields } from './program-fields';
import type { ProgramList } from './program-list';

export interface ProgramsApi {
  list(status: 'active' | 'archived'): Observable<LoadResult<ProgramList>>;
  get(id: string): Observable<LoadResult<Program>>;
  create(fields: ProgramFields): Observable<WriteOutcome>;
  update(id: string, fields: ProgramFields): Observable<WriteOutcome>;
  archive(id: string, confirmName: string): Observable<WriteOutcome>;
  restore(id: string): Observable<WriteOutcome>;
  enroll(id: string, childId: string): Observable<WriteOutcome>;
  removeFromRoster(id: string, childId: string, reason: string): Observable<WriteOutcome>;
  /** Opens enrollment and returns the link to share; the link stays the same if it is closed and opened again. */
  openEnrollment(id: string): Observable<LoadResult<{ url: string }>>;
  closeEnrollment(id: string): Observable<WriteOutcome>;
}
