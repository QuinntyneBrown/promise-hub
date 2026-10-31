import { HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import type { GuardianPageResult } from './guardian-page-result';

/** Maps a guardian page read: 401 asks for the device code, 410 is an expired link, 404 isn't available (L2-026). */
export function toGuardianPage<T>(call: Observable<T>): Observable<GuardianPageResult<T>> {
  return call.pipe(
    map((value): GuardianPageResult<T> => ({ status: 'loaded', value })),
    catchError((error: HttpErrorResponse) =>
      of<GuardianPageResult<T>>(
        error.status === 401
          ? {
              status: 'verify',
              language: error.error?.language ?? 'en',
              organization: error.error?.organization ?? '',
              phone: error.error?.phone ?? null,
              contacts: error.error?.contacts ?? [],
            }
          : error.status === 410
            ? {
                status: 'gone',
                organization: error.error?.organization ?? null,
                phone: error.error?.phone ?? null,
              }
            : error.status === 404
              ? { status: 'not-found' }
              : { status: 'error' },
      ),
    ),
  );
}
