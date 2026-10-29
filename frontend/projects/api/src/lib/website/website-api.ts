import type { Observable } from 'rxjs';
import type { LoadResult } from '../load-result';
import type { PublicContent } from './public-content';
import type { PublicSite } from './public-site';

/** An organization’s public website, read anonymously by its address (Public website module, ADR 0043, ADR 0075). */
export interface WebsiteApi {
  site(slug: string): Observable<LoadResult<PublicSite>>;
  content(slug: string): Observable<LoadResult<PublicContent>>;
}
