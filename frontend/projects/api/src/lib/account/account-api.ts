import type { Observable } from 'rxjs';
import type { LoadResult } from '../load-result';
import type { WriteOutcome } from '../write-outcome';
import type { Account } from './account';

/** The signed-in person's account. */
export interface AccountApi {
  load(): Observable<LoadResult<Account>>;
  /** Ten new codes, shown once; the old ones stop working. */
  newRecoveryCodes(): Observable<LoadResult<{ codes: string[] }>>;
  /** Ends every other session; this one stays signed in. */
  signOutOthers(): Observable<WriteOutcome>;
}
