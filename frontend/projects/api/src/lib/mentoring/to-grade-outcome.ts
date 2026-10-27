import { HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import type { GradeOutcome } from './grade-outcome';

/** Maps a grade to a GradeOutcome: 409 carries stale or not-reviewable. */
export function toGradeOutcome(
  call: Observable<{ status: string; points: number | null; version: number }>,
): Observable<GradeOutcome> {
  return call.pipe(
    map((body): GradeOutcome => ({
      status: 'saved',
      submissionStatus: body.status,
      points: body.points,
      version: body.version,
    })),
    catchError((error: HttpErrorResponse) => {
      const code = error.error?.code;
      return of<GradeOutcome>(
        error.status === 422
          ? { status: 'invalid', errors: error.error?.errors ?? {} }
          : error.status === 409 && (code === 'stale' || code === 'not-reviewable')
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
