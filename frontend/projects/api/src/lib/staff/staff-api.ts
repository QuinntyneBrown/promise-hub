import type { Observable } from 'rxjs';
import type { LoadResult } from '../load-result';
import type { Role } from '../session/role';
import type { WriteOutcome } from '../write-outcome';
import type { Coverage } from './coverage';
import type { StaffList } from './staff-list';
import type { YouthAccount } from './youth-account';

/** Admins invite staff and youth, change roles and remove access. */
export interface StaffApi {
  list(): Observable<LoadResult<StaffList>>;
  invite(email: string, role: Role): Observable<WriteOutcome>;
  withdraw(invitationId: string): Observable<WriteOutcome>;
  /** A fresh link lasting 14 days; the previous link stops working. */
  resend(invitationId: string): Observable<WriteOutcome>;
  changeRole(membershipId: string, role: Role): Observable<WriteOutcome>;
  remove(membershipId: string): Observable<WriteOutcome>;
  /** A child's youth account, while Learning is on; admins only (L2-051). */
  youthAccount(childId: string): Observable<LoadResult<YouthAccount>>;
  /** Invites a youth with their own email; the account links to the child. */
  inviteYouth(childId: string, email: string): Observable<WriteOutcome>;
  coverage(): Observable<LoadResult<Coverage>>;
  /** Replaces who works the session. */
  assign(sessionId: string, membershipIds: string[]): Observable<WriteOutcome>;
}
