import { HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SESSION_API } from '@promisehub/api';
import { catchError, map, of } from 'rxjs';

/**
 * Staff pages need a session. Without one, sign-in opens and returns here afterwards;
 * an expired session says so. Other failures let the shell show the server error page.
 */
export const authGuard: CanActivateFn = (_route, state) => {
  const router = inject(Router);
  return inject(SESSION_API)
    .current()
    .pipe(
      map(() => true),
      catchError((error: HttpErrorResponse) => {
        if (error.status !== 401) {
          return of(true);
        }
        const reason = error.error?.code === 'session-expired' ? 'expired' : null;
        return of(
          router.createUrlTree(['/sign-in'], { queryParams: { returnUrl: state.url, reason } }),
        );
      }),
    );
};
