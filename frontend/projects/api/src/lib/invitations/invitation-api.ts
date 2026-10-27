import type { Observable } from 'rxjs';
import type { WriteOutcome } from '../write-outcome';
import type { InvitationResult } from './invitation-result';

/** The invited person's side: read the invitation, accept it (which signs in), ask for a new link, save a mobile for alerts. */
export interface InvitationApi {
  get(token: string): Observable<InvitationResult>;
  accept(token: string, name: string, password: string): Observable<WriteOutcome>;
  savePhone(mobile: string): Observable<WriteOutcome>;
  /** From an expired link, asks the inviter for a new one; no account needed (L2-054). */
  requestNew(token: string): Observable<WriteOutcome>;
}
