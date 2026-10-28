import { HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import type { FlagOutcome } from './flag-outcome';

/** Maps a flag write to a FlagOutcome: 409 carries already-flagged or already-resolved. */
export function toFlagOutcome(call: Observable<{ id?: string } | null>): Observable<FlagOutcome> {
  return call.pipe(
    map((body): FlagOutcome => ({ status: 'saved', id: body?.id })),
    catchError((error: HttpErrorResponse) => {
      const code = error.error?.code;
      return of<FlagOutcome>(
        error.status === 422
          ? { status: 'invalid', errors: error.error?.errors ?? {} }
          : error.status === 409 && (code === 'already-flagged' || code === 'already-resolved')
            ? { status: code }
            : error.status === 404
              ? { status: 'not-found' }
              : error.status === 403
                ? { status: 'forbidden' }
                : { status: 'error' },
      );
    }),
  );
}
