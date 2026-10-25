import type { Observable } from 'rxjs';
import type { Session } from './session';

export interface SessionApi {
  /** The current session, loaded once and shared. */
  current(): Observable<Session>;

  /** Forgets the loaded session, after signing in or out. */
  reset(): void;
}
