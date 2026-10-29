import type { Observable } from 'rxjs';
import type { LoadResult } from '../load-result';
import type { WriteOutcome } from '../write-outcome';
import type { ConsentPolicy } from '../privacy/consent-policy';
import type { MentoringSettings } from './mentoring-settings';
import type { OrganizationDetails } from './organization-details';
import type { SaveOrganizationDetails } from './save-organization-details';

/** Settings › Organization (ADR 0073): the organization's profile and logo and the defaults of the modules it has on. */
export interface OrganizationSettingsApi {
  profile(): Observable<LoadResult<OrganizationDetails>>;
  saveProfile(profile: SaveOrganizationDetails): Observable<WriteOutcome>;
  /** Uploads a PNG or JPEG of up to 1 MB as the logo, replacing any earlier one. */
  uploadLogo(file: File): Observable<WriteOutcome>;
  removeLogo(): Observable<WriteOutcome>;
  /** Where the browser loads the logo image from; the version changes it after an upload. */
  logoUrl(version: string): string;
  /** Learning's defaults: the guardian consent policy; not found while Learning is off. */
  learning(): Observable<LoadResult<ConsentPolicy>>;
  saveLearning(policy: ConsentPolicy): Observable<WriteOutcome>;
  /** Mentoring's defaults; not found while Mentoring is off. */
  mentoring(): Observable<LoadResult<MentoringSettings>>;
  saveMentoring(settings: MentoringSettings): Observable<WriteOutcome>;
}
