import { inject } from '@angular/core';
import { CanMatchFn, Route, UrlSegment } from '@angular/router';
import { WEBSITE_API } from '@promisehub/api';
import { map } from 'rxjs';

/**
 * Matches /site/:slug only while the server answers for the slug, so the website library is never downloaded for an
 * unknown slug, a suspended organization or Public website off (L2-005 criterion 7).
 */
export const websiteOn: CanMatchFn = (_route: Route, segments: UrlSegment[]) =>
  inject(WEBSITE_API)
    .site(segments[1]?.path ?? '')
    .pipe(map((r) => r.status === 'loaded'));
