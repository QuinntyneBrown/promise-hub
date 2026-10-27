import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, throwError } from 'rxjs';
import { API_BASE_URL } from '../api-base-url';
import { toLoad, toWrite } from '../http-results';
import { LoadResult } from '../load-result';
import { WriteOutcome } from '../write-outcome';
import { EnrollmentDraft } from './enrollment-draft';
import { EnrollmentPage } from './enrollment-page';
import { EnrollmentSavedDraft } from './enrollment-saved-draft';
import { EnrollmentCodeOutcome } from './enrollment-code-outcome';
import { EnrollmentSubmitOutcome } from './enrollment-submit-outcome';
import { EnrollmentSubmitted } from './enrollment-submitted';
import { GuardianEnrollmentApi } from './guardian-enrollment-api';
import { GuardianVerifyOutcome } from './guardian-verify-outcome';

@Injectable()
export class HttpGuardianEnrollmentApi implements GuardianEnrollmentApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  private url(slug: string): string {
    return `${this.baseUrl}/g/enroll/${encodeURIComponent(slug)}`;
  }

  page(slug: string): Observable<LoadResult<EnrollmentPage>> {
    return toLoad(this.http.get<EnrollmentPage>(this.url(slug)));
  }

  requestCode(slug: string, contact: string): Observable<EnrollmentCodeOutcome> {
    return this.http.post<null>(`${this.url(slug)}/code`, { contact }).pipe(
      map((): EnrollmentCodeOutcome => ({ status: 'saved' })),
      catchError((error: HttpErrorResponse) =>
        error.status === 429
          ? of<EnrollmentCodeOutcome>({ status: 'too-many' })
          : toWrite(throwError(() => error)),
      ),
    );
  }

  verify(slug: string, contact: string, code: string): Observable<GuardianVerifyOutcome> {
    return this.http.post(`${this.url(slug)}/verify`, { contact, code }).pipe(
      map((): GuardianVerifyOutcome => ({ status: 'verified' })),
      catchError((error: HttpErrorResponse) =>
        of<GuardianVerifyOutcome>(
          error.status === 422
            ? { status: 'invalid', message: error.error?.errors?.code ?? '' }
            : error.status === 423
              ? { status: 'locked' }
              : { status: 'error' },
        ),
      ),
    );
  }

  draft(slug: string): Observable<LoadResult<EnrollmentSavedDraft>> {
    return toLoad(this.http.get<EnrollmentSavedDraft>(`${this.url(slug)}/draft`));
  }

  save(slug: string, draft: EnrollmentDraft): Observable<WriteOutcome> {
    return toWrite(this.http.put<null>(`${this.url(slug)}/draft`, draft));
  }

  submit(slug: string, consent: boolean): Observable<EnrollmentSubmitOutcome> {
    return this.http.post<EnrollmentSubmitted>(`${this.url(slug)}/submit`, { consent }).pipe(
      map((value): EnrollmentSubmitOutcome => ({ status: 'submitted', value })),
      catchError((error: HttpErrorResponse) =>
        of<EnrollmentSubmitOutcome>(
          error.status === 422
            ? { status: 'invalid', errors: (error.error?.errors ?? {}) as Record<string, string> }
            : error.status === 409 && error.error?.code === 'duplicate'
              ? { status: 'duplicate', name: String(error.error.name ?? '') }
              : { status: 'error' },
        ),
      ),
    );
  }
}
