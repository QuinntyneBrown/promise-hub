import type { Observable } from 'rxjs';
import type { LoadResult } from '../load-result';
import type { WriteOutcome } from '../write-outcome';
import type { OrganizationDetails } from './organization-details';
import type { SaveOrganizationDetails } from './save-organization-details';

/** Settings › Organization (ADR 0073): the organization's profile. */
export interface OrganizationSettingsApi {
  profile(): Observable<LoadResult<OrganizationDetails>>;
  saveProfile(profile: SaveOrganizationDetails): Observable<WriteOutcome>;
}
