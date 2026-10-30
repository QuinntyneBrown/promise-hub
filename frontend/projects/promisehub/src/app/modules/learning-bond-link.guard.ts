import { inject } from '@angular/core';
import { CanMatchFn, Route, UrlSegment } from '@angular/router';
import { LEARNING_BOND_API } from '@promisehub/api';
import { map } from 'rxjs';

/**
 * Matches /g/learning-bond/:token only while the server answers the link, so the learning-bond library is never downloaded for an
 * unknown link, a suspended organization or Learning Bond off (L2-162 criterion 6).
 */
export const learningBondLinkOn: CanMatchFn = (_route: Route, segments: UrlSegment[]) =>
  inject(LEARNING_BOND_API)
    .link(segments[2]?.path ?? '')
    .pipe(map((r) => r.status === 'loaded'));
