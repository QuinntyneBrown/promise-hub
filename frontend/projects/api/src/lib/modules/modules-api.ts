import type { Observable } from 'rxjs';
import type { ModuleId } from './module-id';
import type { ModulesLoad } from './modules-load';
import type { SaveModulesOutcome } from './save-modules-outcome';

export interface ModulesApi {
  load(): Observable<ModulesLoad>;
  save(on: ModuleId[]): Observable<SaveModulesOutcome>;
}
