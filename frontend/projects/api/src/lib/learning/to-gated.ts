import { HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import type { GatedResult } from './gated-result';

/** Maps a youth read to a GatedResult: 403 locked carries what to finish first. */
export function toGated<T>(call: Observable<T>): Observable<GatedResult<T>> {
  return call.pipe(
    map((value): GatedResult<T> => ({ status: 'loaded', value })),
    catchError((error: HttpErrorResponse) =>
      of<GatedResult<T>>(
        error.status === 403 && error.error?.code === 'locked'
          ? { status: 'locked', unlockAfter: error.error?.unlockAfter ?? null }
          : {
              status:
                error.status === 404 ? 'not-found' : error.status === 403 ? 'forbidden' : 'error',
            },
      ),
    ),
  );
}
