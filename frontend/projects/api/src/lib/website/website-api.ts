import type { Observable } from 'rxjs';
import type { LoadResult } from '../load-result';
import type { ContactMessage } from './contact-message';
import type { DonationOutcome } from './donation-outcome';
import type { DonationPledge } from './donation-pledge';
import type { PublicContent } from './public-content';
import type { PublicSite } from './public-site';
import type { VolunteerOffer } from './volunteer-offer';
import type { WebsiteSubmitOutcome } from './website-submit-outcome';

/** An organization’s public website, read anonymously by its address (Public website module, ADR 0043, ADR 0075). */
export interface WebsiteApi {
  site(slug: string): Observable<LoadResult<PublicSite>>;
  content(slug: string): Observable<LoadResult<PublicContent>>;
  contact(slug: string, message: ContactMessage): Observable<WebsiteSubmitOutcome>;
  volunteer(slug: string, offer: VolunteerOffer): Observable<WebsiteSubmitOutcome>;
  donate(slug: string, pledge: DonationPledge): Observable<DonationOutcome>;
}
