import type { MyOrganization } from './my-organization';
import type { WriteOutcome } from '../write-outcome';
import type { Observable } from 'rxjs';
import type { Session } from './session';

export interface SessionApi {
  /** The person's organizations, the active one marked (L2-002). */
  organizations(): Observable<MyOrganization[]>;
  /** Moves the session to another of the person's memberships; the app then reloads. */
  switchTo(membershipId: string): Observable<WriteOutcome>;
  /** The current session, loaded once and shared. */
  current(): Observable<Session>;

  /** Forgets the loaded session, after signing in or out. */
  reset(): void;

  /** Loads the session again after the person changed it (their name, their display), and tells `changed` subscribers. */
  refresh(): void;

  /** Emits after `refresh()`, so the shell reads the session again. */
  readonly changed: Observable<void>;
}
