import { HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import type { SubmitOutcome } from './submit-outcome';

/** Maps a submit or resubmit to a SubmitOutcome: 409 carries submitted, closed or not-revisable; 403 locked. */
export function toSubmitOutcome(call: Observable<{ id: string }>): Observable<SubmitOutcome> {
  return call.pipe(
    map((body): SubmitOutcome => ({ status: 'saved', id: body.id })),
    catchError((error: HttpErrorResponse) => {
      const code = error.error?.code;
      return of<SubmitOutcome>(
        error.status === 422
          ? { status: 'invalid', errors: error.error?.errors ?? {} }
          : error.status === 409 &&
              (code === 'submitted' || code === 'closed' || code === 'not-revisable')
            ? { status: code }
            : error.status === 403 && code === 'locked'
              ? { status: 'locked' }
              : error.status === 404
                ? { status: 'not-found' }
                : error.status === 403
                  ? { status: 'forbidden' }
                  : { status: 'error' },
      );
    }),
  );
}
