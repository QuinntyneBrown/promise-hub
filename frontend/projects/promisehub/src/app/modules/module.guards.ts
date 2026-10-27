import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { ModuleId, SESSION_API } from '@promisehub/api';
import { catchError, map, of } from 'rxjs';

/** Matches the route only while its module (or every one of its modules) is on, so an off module's library is never downloaded. */
export const moduleOn =
  (module: ModuleId | ModuleId[]): CanMatchFn =>
  () =>
    inject(SESSION_API)
      .current()
      .pipe(
        map((session) => [module].flat().every((m) => session.modules.includes(m))),
        catchError(() => of(false)),
      );

/** Sends a route of a module that is off (or of which any module is off) to Today (L2-005 criterion 3). */
export const moduleOffRedirect =
  (module: ModuleId | ModuleId[]): CanMatchFn =>
  () => {
    const router = inject(Router);
    return inject(SESSION_API)
      .current()
      .pipe(
        map((session) =>
          [module].flat().every((m) => session.modules.includes(m))
            ? false
            : router.createUrlTree(['/']),
        ),
        catchError(() => of(false)),
      );
  };
