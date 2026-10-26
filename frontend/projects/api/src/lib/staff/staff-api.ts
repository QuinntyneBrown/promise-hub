import type { Observable } from 'rxjs';
import type { LoadResult } from '../load-result';
import type { Role } from '../session/role';
import type { WriteOutcome } from '../write-outcome';
import type { Coverage } from './coverage';
import type { StaffList } from './staff-list';

/** Admins invite staff, change roles and remove access. */
export interface StaffApi {
  list(): Observable<LoadResult<StaffList>>;
  invite(email: string, role: Role): Observable<WriteOutcome>;
  withdraw(invitationId: string): Observable<WriteOutcome>;
  changeRole(membershipId: string, role: Role): Observable<WriteOutcome>;
  remove(membershipId: string): Observable<WriteOutcome>;
  coverage(): Observable<LoadResult<Coverage>>;
  /** Replaces who works the session. */
  assign(sessionId: string, membershipIds: string[]): Observable<WriteOutcome>;
}
