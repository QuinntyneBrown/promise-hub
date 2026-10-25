import { HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { LoadResult } from './load-result';
import { WriteOutcome } from './write-outcome';

/** Maps an HTTP read to a LoadResult. */
export function toLoad<T>(call: Observable<T>): Observable<LoadResult<T>> {
  return call.pipe(
    map((value): LoadResult<T> => ({ status: 'loaded', value })),
    catchError((error: HttpErrorResponse) =>
      of<LoadResult<T>>({
        status: error.status === 404 ? 'not-found' : error.status === 403 ? 'forbidden' : 'error',
      }),
    ),
  );
}

/** Maps an HTTP write to a WriteOutcome; a 422 body carries { errors: { field: message } }. */
export function toWrite(call: Observable<{ id?: string } | null>): Observable<WriteOutcome> {
  return call.pipe(
    map((body): WriteOutcome => ({ status: 'saved', id: body?.id })),
    catchError((error: HttpErrorResponse) =>
      of<WriteOutcome>(
        error.status === 422
          ? { status: 'invalid', errors: error.error?.errors ?? {} }
          : error.status === 404
            ? { status: 'not-found' }
            : error.status === 403
              ? { status: 'forbidden' }
              : { status: 'error' },
      ),
    ),
  );
}
