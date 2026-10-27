import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import { API_BASE_URL } from '../api-base-url';
import { toLoad } from '../http-results';
import { LoadResult } from '../load-result';
import { LearningApi } from './learning-api';
import { Learner } from './learner';
import { LearningHome } from './learning-home';
import { LearningHomeResult } from './learning-home-result';
import { GatedResult } from './gated-result';
import { toGated } from './to-gated';
import { TrackView } from './track-view';
import { ModuleView } from './module-view';
import { LessonView } from './lesson-view';
import { LessonCompletion } from './lesson-completion';
import { CodingView } from './coding-view';
import { CodingAnswers } from './coding-answers';
import { CodingSaved } from './coding-saved';
import { CodingSaveResult } from './coding-save-result';
import { ProjectSubmission } from './project-submission';
import { ConsentRequestOutcome } from '../consent/consent-request-outcome';
import { toConsentRequest } from '../consent/to-consent-request';
import { toWrite } from '../http-results';
import { WriteOutcome } from '../write-outcome';
import { OnboardingAnswers } from './onboarding-answers';
import { OnboardingResult } from './onboarding-result';
import { YouthOnboarding } from './youth-onboarding';
import { QuizIntro } from './quiz-intro';
import { QuizAttemptView } from './quiz-attempt-view';
import { StartQuizResult } from './start-quiz-result';
import { QuizAnswer } from './quiz-answer';
import { AnswersOutcome } from './answers-outcome';
import { toAnswersOutcome } from './to-answers-outcome';
import { QuizResult } from './quiz-result';
import { AssignmentBrief } from './assignment-brief';
import { AssignmentSubmissionView } from './assignment-submission-view';
import { SubmissionWork } from './submission-work';
import { SubmitOutcome } from './submit-outcome';
import { toSubmitOutcome } from './to-submit-outcome';

@Injectable()
export class HttpLearningApi implements LearningApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  learner(): Observable<LoadResult<Learner>> {
    return toLoad(this.http.get<Learner>(`${this.baseUrl}/learning/me`));
  }

  home(): Observable<LearningHomeResult> {
    return this.http.get<LearningHome>(`${this.baseUrl}/learning/home`).pipe(
      map((value): LearningHomeResult => ({ status: 'loaded', value })),
      catchError((error: HttpErrorResponse) =>
        of<LearningHomeResult>(
          error.status === 403 && error.error?.code === 'consent-required'
            ? { status: 'consent-required', consentAge: error.error?.consentAge ?? 18 }
            : error.status === 403 && error.error?.code === 'no-cohort'
              ? { status: 'no-cohort' }
              : error.status === 404
                ? { status: 'not-found' }
                : error.status === 403
                  ? { status: 'forbidden' }
                  : { status: 'error' },
        ),
      ),
    );
  }

  track(id: string): Observable<GatedResult<TrackView>> {
    return toGated(
      this.http.get<TrackView>(`${this.baseUrl}/learning/tracks/${encodeURIComponent(id)}`),
    );
  }

  module(id: string): Observable<GatedResult<ModuleView>> {
    return toGated(
      this.http.get<ModuleView>(`${this.baseUrl}/learning/modules/${encodeURIComponent(id)}`),
    );
  }

  lesson(id: string): Observable<GatedResult<LessonView>> {
    return toGated(
      this.http.get<LessonView>(`${this.baseUrl}/learning/lessons/${encodeURIComponent(id)}`),
    );
  }

  completeLesson(id: string): Observable<GatedResult<LessonCompletion>> {
    return toGated(
      this.http.post<LessonCompletion>(
        `${this.baseUrl}/learning/lessons/${encodeURIComponent(id)}/complete`,
        null,
      ),
    );
  }

  lessonVideoUrl(id: string): string {
    return `${this.baseUrl}/learning/lessons/${encodeURIComponent(id)}/video`;
  }

  coding(id: string): Observable<GatedResult<CodingView>> {
    return toGated(
      this.http.get<CodingView>(`${this.baseUrl}/learning/coding/${encodeURIComponent(id)}`),
    );
  }

  saveCoding(id: string, answers: CodingAnswers): Observable<CodingSaveResult> {
    return this.http
      .put<CodingSaved>(
        `${this.baseUrl}/learning/coding/${encodeURIComponent(id)}/progress`,
        answers,
      )
      .pipe(
        map((value): CodingSaveResult => ({ status: 'loaded', value })),
        catchError((error: HttpErrorResponse) =>
          of<CodingSaveResult>(
            error.status === 422
              ? { status: 'invalid', errors: error.error?.errors ?? {} }
              : error.status === 403 && error.error?.code === 'locked'
                ? { status: 'locked', unlockAfter: error.error?.unlockAfter ?? null }
                : {
                    status:
                      error.status === 404
                        ? 'not-found'
                        : error.status === 403
                          ? 'forbidden'
                          : 'error',
                  },
          ),
        ),
      );
  }

  submitProject(id: string, submission: ProjectSubmission): Observable<WriteOutcome> {
    return toWrite(
      this.http.post<{ id: string }>(
        `${this.baseUrl}/learning/coding/${encodeURIComponent(id)}/submission`,
        submission,
      ),
    );
  }

  quiz(id: string): Observable<GatedResult<QuizIntro>> {
    return toGated(
      this.http.get<QuizIntro>(`${this.baseUrl}/learning/quizzes/${encodeURIComponent(id)}`),
    );
  }

  startQuiz(quizId: string): Observable<StartQuizResult> {
    return this.http
      .post<QuizAttemptView>(
        `${this.baseUrl}/learning/quizzes/${encodeURIComponent(quizId)}/attempts`,
        null,
      )
      .pipe(
        map((value): StartQuizResult => ({ status: 'loaded', value })),
        catchError((error: HttpErrorResponse) =>
          of<StartQuizResult>(
            error.status === 409 && error.error?.code === 'no-attempts'
              ? { status: 'no-attempts' }
              : error.status === 403 && error.error?.code === 'locked'
                ? { status: 'locked', unlockAfter: error.error?.unlockAfter ?? null }
                : {
                    status:
                      error.status === 404
                        ? 'not-found'
                        : error.status === 403
                          ? 'forbidden'
                          : 'error',
                  },
          ),
        ),
      );
  }

  saveAnswers(
    attemptId: string,
    answers: QuizAnswer[],
    position: number,
  ): Observable<AnswersOutcome> {
    return toAnswersOutcome(
      this.http.put<null>(
        `${this.baseUrl}/learning/attempts/${encodeURIComponent(attemptId)}/answers`,
        { answers, position },
      ),
    );
  }

  submitQuiz(
    attemptId: string,
    answers: QuizAnswer[],
    position: number,
  ): Observable<AnswersOutcome> {
    return toAnswersOutcome(
      this.http.post<{ id: string }>(
        `${this.baseUrl}/learning/attempts/${encodeURIComponent(attemptId)}/submit`,
        { answers, position },
      ),
    );
  }

  attempt(id: string): Observable<GatedResult<QuizResult>> {
    return toGated(
      this.http.get<QuizResult>(`${this.baseUrl}/learning/attempts/${encodeURIComponent(id)}`),
    );
  }

  submitAssignment(assignmentId: string, work: SubmissionWork): Observable<SubmitOutcome> {
    return toSubmitOutcome(
      this.http.post<{ id: string }>(
        `${this.baseUrl}/learning/assignments/${encodeURIComponent(assignmentId)}/submission`,
        this.form(work),
      ),
    );
  }

  submission(id: string): Observable<GatedResult<AssignmentSubmissionView>> {
    return toGated(
      this.http.get<AssignmentSubmissionView>(
        `${this.baseUrl}/learning/submissions/${encodeURIComponent(id)}`,
      ),
    );
  }

  resubmit(submissionId: string, work: SubmissionWork): Observable<SubmitOutcome> {
    return toSubmitOutcome(
      this.http.post<{ id: string }>(
        `${this.baseUrl}/learning/submissions/${encodeURIComponent(submissionId)}/resubmit`,
        this.form(work),
      ),
    );
  }

  submissionFileUrl(id: string): string {
    return `${this.baseUrl}/learning/submissions/${encodeURIComponent(id)}/file`;
  }

  private form(work: SubmissionWork): FormData {
    const form = new FormData();
    if (work.text) form.append('text', work.text);
    if (work.link) form.append('link', work.link);
    form.append('attest', work.attest ? 'true' : 'false');
    if (work.removeFile) form.append('removeFile', 'true');
    if (work.file) form.append('file', work.file, work.file.name);
    return form;
  }

  assignment(id: string): Observable<GatedResult<AssignmentBrief>> {
    return toGated(
      this.http.get<AssignmentBrief>(
        `${this.baseUrl}/learning/assignments/${encodeURIComponent(id)}`,
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
