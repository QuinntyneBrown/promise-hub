import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import { API_BASE_URL } from '../api-base-url';
import { toLoad } from '../http-results';
import { LoadResult } from '../load-result';
import { LearningApi } from './learning-api';
import { Learner } from './learner';
import { Lessons } from './lessons';
import { LessonsResult } from './lessons-result';
import { ConsentRequestOutcome } from '../consent/consent-request-outcome';
import { toConsentRequest } from '../consent/to-consent-request';
import { toWrite } from '../http-results';
import { WriteOutcome } from '../write-outcome';
import { OnboardingAnswers } from './onboarding-answers';
import { OnboardingResult } from './onboarding-result';
import { YouthOnboarding } from './youth-onboarding';

@Injectable()
export class HttpLearningApi implements LearningApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  learner(): Observable<LoadResult<Learner>> {
    return toLoad(this.http.get<Learner>(`${this.baseUrl}/learning/me`));
  }

  lessons(): Observable<LessonsResult> {
    return this.http.get<Lessons>(`${this.baseUrl}/learning/lessons`).pipe(
      map((value): LessonsResult => ({ status: 'loaded', value })),
      catchError((error: HttpErrorResponse) =>
        of<LessonsResult>(
          error.status === 403 && error.error?.code === 'consent-required'
            ? { status: 'consent-required', consentAge: error.error?.consentAge ?? 18 }
            : error.status === 404
              ? { status: 'not-found' }
              : error.status === 403
                ? { status: 'forbidden' }
                : { status: 'error' },
        ),
      ),
    );
  }

  askGuardian(): Observable<ConsentRequestOutcome> {
    return toConsentRequest(
      this.http.post<{ sentTo: string[] }>(`${this.baseUrl}/learning/consent-request`, null),
    );
  }

  onboarding(): Observable<OnboardingResult> {
    return this.http.get<YouthOnboarding>(`${this.baseUrl}/learning/onboarding`).pipe(
      map((value): OnboardingResult => ({ status: 'loaded', value })),
      catchError((error: HttpErrorResponse) =>
        of<OnboardingResult>(
          error.status === 403 && error.error?.code === 'consent-required'
            ? { status: 'consent-required', consentAge: error.error?.consentAge ?? 18 }
            : error.status === 404
              ? { status: 'not-found' }
              : error.status === 403
                ? { status: 'forbidden' }
                : { status: 'error' },
        ),
      ),
    );
  }

  saveOnboarding(answers: OnboardingAnswers): Observable<WriteOutcome> {
    return toWrite(this.http.put<null>(`${this.baseUrl}/learning/onboarding`, answers));
  }

  completeOnboarding(): Observable<WriteOutcome> {
    return toWrite(this.http.post<null>(`${this.baseUrl}/learning/onboarding/complete`, null));
  }
}
