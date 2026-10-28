import type { Observable } from 'rxjs';
import type { LoadResult } from '../load-result';
import type { WriteOutcome } from '../write-outcome';
import type { Account } from './account';

/** The signed-in person's account. */
export interface AccountApi {
  load(): Observable<LoadResult<Account>>;
  /** Ten new codes, shown once; the old ones stop working. */
  newRecoveryCodes(): Observable<LoadResult<{ codes: string[] }>>;
  /** Saves the name and mobile of the active membership (L2-117); an empty mobile clears it. */
  saveProfile(name: string, mobile: string): Observable<WriteOutcome>;
  /** Ends every other session; this one stays signed in. */
  signOutOthers(): Observable<WriteOutcome>;
}
