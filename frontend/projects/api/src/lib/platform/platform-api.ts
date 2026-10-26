import type { Observable } from 'rxjs';
import type { LoadResult } from '../load-result';
import type { WriteOutcome } from '../write-outcome';
import type { NewOrganization } from './new-organization';
import type { PlatformOrganization } from './platform-organization';

/** Platform administration of organizations; refused for anyone who is not a platform admin. */
export interface PlatformApi {
  organizations(): Observable<LoadResult<{ organizations: PlatformOrganization[] }>>;
  add(organization: NewOrganization): Observable<WriteOutcome>;
  suspend(id: string, reason: string): Observable<WriteOutcome>;
  reinstate(id: string): Observable<WriteOutcome>;
}
