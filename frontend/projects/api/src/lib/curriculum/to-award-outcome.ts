import { HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { toWrite } from '../http-results';
import type { AwardOutcome } from './award-outcome';

/** Maps an award to an AwardOutcome: 409 carries already-awarded or automatic; anything else as a write. */
export function toAwardOutcome(call: Observable<{ id: string }>): Observable<AwardOutcome> {
  return call.pipe(
    map((body): AwardOutcome => ({ status: 'saved', id: body.id })),
    catchError((error: HttpErrorResponse) => {
      const code = error.error?.code;
      return error.status === 409 && (code === 'already-awarded' || code === 'automatic')
        ? of<AwardOutcome>({ status: code })
        : toWrite(new Observable<null>((s) => s.error(error)));
    }),
  );
}
