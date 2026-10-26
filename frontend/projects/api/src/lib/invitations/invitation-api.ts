import type { Observable } from 'rxjs';
import type { WriteOutcome } from '../write-outcome';
import type { InvitationResult } from './invitation-result';

/** The invited person's side: read the invitation, accept it (which signs in), and save a mobile for alerts. */
export interface InvitationApi {
  get(token: string): Observable<InvitationResult>;
  accept(token: string, name: string, password: string): Observable<WriteOutcome>;
  savePhone(mobile: string): Observable<WriteOutcome>;
}
