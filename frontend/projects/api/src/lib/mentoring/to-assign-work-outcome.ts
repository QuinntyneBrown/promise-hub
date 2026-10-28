import { HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import type { AssignWorkOutcome } from './assign-work-outcome';
import type { AssignedWorkResult } from './assigned-work-result';

/** Maps POST /mentoring/assigned-work to an AssignWorkOutcome; a 422 body carries { errors: { field: message } }. */
export function toAssignWorkOutcome(
  call: Observable<AssignedWorkResult>,
): Observable<AssignWorkOutcome> {
  return call.pipe(
    map((result): AssignWorkOutcome => ({ status: 'assigned', result })),
    catchError((error: HttpErrorResponse) =>
      of<AssignWorkOutcome>(
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
