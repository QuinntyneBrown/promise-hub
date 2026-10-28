import { HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import type { Rsvp } from './rsvp';
import type { RsvpOutcome } from './rsvp-outcome';

/** Maps PUT /schedule/{eventId}/rsvp to an RsvpOutcome; a 422 body carries { errors: { field: message } }. */
export function toRsvpOutcome(call: Observable<Rsvp>): Observable<RsvpOutcome> {
  return call.pipe(
    map((rsvp): RsvpOutcome => ({ status: 'sent', rsvp })),
    catchError((error: HttpErrorResponse) =>
      of<RsvpOutcome>(
        error.status === 422
          ? { status: 'invalid', errors: error.error?.errors ?? {} }
          : error.status === 409
            ? { status: 'closed' }
            : error.status === 404
              ? { status: 'not-found' }
              : error.status === 403
                ? { status: 'forbidden' }
                : { status: 'error' },
      ),
    ),
  );
}
