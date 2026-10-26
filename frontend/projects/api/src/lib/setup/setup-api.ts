import type { Observable } from 'rxjs';
import type { LoadResult } from '../load-result';
import type { WriteOutcome } from '../write-outcome';
import type { OrganizationProfile } from './organization-profile';
import type { Setup } from './setup';

/** The organization setup wizard. */
export interface SetupApi {
  checklist(): Observable<LoadResult<Setup>>;
  profile(): Observable<LoadResult<OrganizationProfile>>;
  saveProfile(profile: OrganizationProfile): Observable<WriteOutcome>;
}
