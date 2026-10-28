import { SharedReflections } from './shared-reflections';
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import { API_BASE_URL } from '../api-base-url';
import { toLoad, toWrite } from '../http-results';
import { LoadResult } from '../load-result';
import { WriteOutcome } from '../write-outcome';
import { AssignedYouth } from './assigned-youth';
import { CohortMentoring } from './cohort-mentoring';
import { MentorCohort } from './mentor-cohort';
import { MentorDashboard } from './mentor-dashboard';
import { MentorYouthRecord } from './mentor-youth-record';
import { MentoringApi } from './mentoring-api';
import { GradeOutcome } from './grade-outcome';
import { GradeRequest } from './grade-request';
import { ApproveAllOutcome } from './approve-all-outcome';
import { CompetencyChange } from './competency-change';
import { CompetencySheet } from './competency-sheet';
import { QuizApprovals } from './quiz-approvals';
import { ReviewQueue } from './review-queue';
import { SubmissionReview } from './submission-review';
import { toGradeOutcome } from './to-grade-outcome';
import { LogMentorCheckIn } from './log-mentor-check-in';
import { MentorCheckInFilter } from './mentor-check-in-filter';
import { MentorCheckInHistory } from './mentor-check-in-history';
import { AtRiskFlags } from './at-risk-flags';
import { RaiseAtRiskFlag } from './raise-at-risk-flag';
import { FlagOutcome } from './flag-outcome';
import { toFlagOutcome } from './to-flag-outcome';

@Injectable()
export class HttpMentoringApi implements MentoringApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  youth(): Observable<LoadResult<AssignedYouth>> {
    return toLoad(this.http.get<AssignedYouth>(`${this.baseUrl}/mentoring/youth`));
  }

  dashboard(): Observable<LoadResult<MentorDashboard>> {
    return toLoad(this.http.get<MentorDashboard>(`${this.baseUrl}/mentoring/dashboard`));
  }

  youthRecord(childId: string): Observable<LoadResult<MentorYouthRecord>> {
    return toLoad(this.http.get<MentorYouthRecord>(`${this.baseUrl}/mentoring/youth/${childId}`));
  }

  mentorCohort(programId: string): Observable<LoadResult<MentorCohort>> {
    return toLoad(this.http.get<MentorCohort>(`${this.baseUrl}/mentoring/cohorts/${programId}`));
  }

  reviews(): Observable<LoadResult<ReviewQueue>> {
    return toLoad(this.http.get<ReviewQueue>(`${this.baseUrl}/mentoring/reviews`));
  }

  submissionReview(id: string): Observable<LoadResult<SubmissionReview>> {
    return toLoad(
      this.http.get<SubmissionReview>(
        `${this.baseUrl}/mentoring/submissions/${encodeURIComponent(id)}`,
      ),
    );
  }

  submissionFileUrl(id: string): string {
    return `${this.baseUrl}/mentoring/submissions/${encodeURIComponent(id)}/file`;
  }

  grade(id: string, request: GradeRequest): Observable<GradeOutcome> {
    return toGradeOutcome(
      this.http.post<{ status: string; points: number | null; version: number }>(
        `${this.baseUrl}/mentoring/submissions/${encodeURIComponent(id)}/grade`,
        request,
      ),
    );
  }

  checkIns(filter: MentorCheckInFilter = {}): Observable<LoadResult<MentorCheckInHistory>> {
    const params: Record<string, string> = {};
    if (filter.childId) params['childId'] = filter.childId;
    if (filter.kind) params['kind'] = filter.kind;
    return toLoad(
      this.http.get<MentorCheckInHistory>(`${this.baseUrl}/mentoring/check-ins`, { params }),
    );
  }

  logCheckIn(body: LogMentorCheckIn): Observable<WriteOutcome> {
    return toWrite(this.http.post<{ id: string }>(`${this.baseUrl}/mentoring/check-ins`, body));
  }

  flags(status: 'Open' | 'Resolved'): Observable<LoadResult<AtRiskFlags>> {
    return toLoad(
      this.http.get<AtRiskFlags>(`${this.baseUrl}/mentoring/flags`, { params: { status } }),
    );
  }

  raiseFlag(body: RaiseAtRiskFlag): Observable<FlagOutcome> {
    return toFlagOutcome(this.http.post<{ id: string }>(`${this.baseUrl}/mentoring/flags`, body));
  }

  quizApprovals(): Observable<LoadResult<QuizApprovals>> {
    return toLoad(this.http.get<QuizApprovals>(`${this.baseUrl}/mentoring/quiz-approvals`));
  }

  approveQuiz(attemptId: string, override: number | null): Observable<WriteOutcome> {
    return toWrite(
      this.http.post<null>(
        `${this.baseUrl}/mentoring/quiz-attempts/${encodeURIComponent(attemptId)}/approve`,
        { override },
      ),
    );
  }

  approveAllQuizzes(): Observable<ApproveAllOutcome> {
    return this.http
      .post<{ approved: number }>(`${this.baseUrl}/mentoring/quiz-approvals/approve-all`, null)
      .pipe(
        map((body): ApproveAllOutcome => ({ status: 'saved', approved: body.approved })),
        catchError(() => of<ApproveAllOutcome>({ status: 'error' })),
      );
  }

  sharedReflections(childId: string): Observable<LoadResult<SharedReflections>> {
    return toLoad(
      this.http.get<SharedReflections>(
        `${this.baseUrl}/mentoring/youth/${encodeURIComponent(childId)}/reflections`,
      ),
    );
  }

  competencies(childId: string): Observable<LoadResult<CompetencySheet>> {
    return toLoad(
      this.http.get<CompetencySheet>(
        `${this.baseUrl}/mentoring/youth/${encodeURIComponent(childId)}/competencies`,
      ),
    );
  }

  saveCompetencies(childId: string, items: CompetencyChange[]): Observable<WriteOutcome> {
    return toWrite(
      this.http
        .put<CompetencySheet>(
          `${this.baseUrl}/mentoring/youth/${encodeURIComponent(childId)}/competencies`,
          { items },
        )
        .pipe(map(() => null)),
    );
  }

  cohort(programId: string): Observable<LoadResult<CohortMentoring>> {
    return toLoad(
      this.http.get<CohortMentoring>(`${this.baseUrl}/programs/${programId}/mentoring`),
    );
  }

  assignYouth(
    programId: string,
    childId: string,
    mentorId: string | null,
  ): Observable<WriteOutcome> {
    return toWrite(
      this.http.put<null>(`${this.baseUrl}/programs/${programId}/youth/${childId}/mentor`, {
        mentorId,
      }),
    );
  }

  unassignYouth(programId: string, childId: string): Observable<WriteOutcome> {
    return toWrite(
      this.http.delete<null>(`${this.baseUrl}/programs/${programId}/youth/${childId}/mentor`),
    );
  }

  setCohortMentors(
    programId: string,
    leadMentorId: string | null,
    supportingMentorIds: string[],
  ): Observable<WriteOutcome> {
    return toWrite(
      this.http.put<null>(`${this.baseUrl}/programs/${programId}/mentors`, {
        leadMentorId,
        supportingMentorIds,
      }),
    );
  }
}
