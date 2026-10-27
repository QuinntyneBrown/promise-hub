import type { Observable } from 'rxjs';
import type { LoadResult } from '../load-result';
import type { WriteOutcome } from '../write-outcome';
import type { Curriculum } from './curriculum';
import type { ModuleDetail } from './module-detail';
import type { ModuleFields } from './module-fields';
import type { NewTrack } from './new-track';

/** Curriculum authoring for admins and program directors (Learning module, L2-066, L2-067). */
export interface CurriculumApi {
  tracks(): Observable<LoadResult<Curriculum>>;
  createTrack(track: NewTrack): Observable<WriteOutcome>;
  reorderModules(trackId: string, moduleIds: string[]): Observable<WriteOutcome>;
  createModule(trackId: string, title: string, description: string): Observable<WriteOutcome>;
  module(id: string): Observable<LoadResult<ModuleDetail>>;
  updateModule(id: string, fields: ModuleFields): Observable<WriteOutcome>;
}
