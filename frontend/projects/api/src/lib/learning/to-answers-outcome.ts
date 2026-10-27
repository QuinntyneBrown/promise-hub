import { HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import type { AnswersOutcome } from './answers-outcome';

/** Maps an answers save or submit: status 0 is offline, 409 already submitted, 422 invalid. */
export function toAnswersOutcome(call: Observable<unknown>): Observable<AnswersOutcome> {
  return call.pipe(
    map((): AnswersOutcome => ({ status: 'saved' })),
    catchError((error: HttpErrorResponse) =>
      of<AnswersOutcome>(
        error.status === 0
          ? { status: 'offline' }
          : error.status === 409
            ? { status: 'submitted' }
            : error.status === 422
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
