import { HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { ConsentRequestOutcome } from './consent-request-outcome';

/** Maps a consent request: 202 with the contacts, 409 not needed, 422 no guardian, 403 forbidden. */
export function toConsentRequest(
  call: Observable<{ sentTo: string[] }>,
): Observable<ConsentRequestOutcome> {
  return call.pipe(
    map((body): ConsentRequestOutcome => ({ status: 'sent', sentTo: body.sentTo })),
    catchError((error: HttpErrorResponse) =>
      of<ConsentRequestOutcome>(
        error.status === 409
          ? { status: 'not-needed' }
          : error.status === 422
            ? { status: 'no-guardian' }
            : error.status === 403
              ? { status: 'forbidden' }
              : { status: 'error' },
      ),
    ),
  );
}
