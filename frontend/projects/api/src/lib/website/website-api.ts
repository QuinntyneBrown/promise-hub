import type { Observable } from 'rxjs';
import type { LoadResult } from '../load-result';
import type { PublicSite } from './public-site';

/** An organization’s public website, read anonymously by its slug (Public website module, ADR 0043). */
export interface WebsiteApi {
  site(slug: string): Observable<LoadResult<PublicSite>>;
}
