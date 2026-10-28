import type { SharedReflections } from './shared-reflections';
import type { Observable } from 'rxjs';
import type { LoadResult } from '../load-result';
import type { WriteOutcome } from '../write-outcome';
import type { AssignedYouth } from './assigned-youth';
import type { CohortMentoring } from './cohort-mentoring';
import type { MentorCohort } from './mentor-cohort';
import type { MentorDashboard } from './mentor-dashboard';
import type { MentorYouthRecord } from './mentor-youth-record';
import type { GradeOutcome } from './grade-outcome';
import type { GradeRequest } from './grade-request';
import type { ApproveAllOutcome } from './approve-all-outcome';
import type { CompetencyChange } from './competency-change';
import type { CompetencySheet } from './competency-sheet';
import type { QuizApprovals } from './quiz-approvals';
import type { ReviewQueue } from './review-queue';
import type { SubmissionReview } from './submission-review';
import type { LogMentorCheckIn } from './log-mentor-check-in';
import type { MentorCheckInFilter } from './mentor-check-in-filter';
import type { MentorCheckInHistory } from './mentor-check-in-history';
import type { AtRiskFlags } from './at-risk-flags';
import type { RaiseAtRiskFlag } from './raise-at-risk-flag';
import type { FlagOutcome } from './flag-outcome';
import type { ResolveAtRiskFlag } from './resolve-at-risk-flag';

/** Mentoring (ADR 0043, ADR 0048): the calling mentor’s youth, and a cohort’s mentors set by program directors. */
export interface MentoringApi {
  youth(): Observable<LoadResult<AssignedYouth>>;
  /** The mentor dashboard: the caller’s youth, cohorts and recent attendance. */
  dashboard(): Observable<LoadResult<MentorDashboard>>;
  /** One of the caller’s youth; forbidden when the youth is not assigned to them. */
  youthRecord(childId: string): Observable<LoadResult<MentorYouthRecord>>;
  /** A cohort the caller leads or supports; forbidden otherwise. */
  mentorCohort(programId: string): Observable<LoadResult<MentorCohort>>;
  /** Work from the caller's youth waiting for them, oldest first; not found while Learning is off. */
  reviews(): Observable<LoadResult<ReviewQueue>>;
  /** One of the caller's youth's submissions to grade; the first open starts the review. */
  submissionReview(id: string): Observable<LoadResult<SubmissionReview>>;
  /** Where the submission's file downloads from, under the caller's session. */
  submissionFileUrl(id: string): string;
  grade(id: string, request: GradeRequest): Observable<GradeOutcome>;
  /** Quiz results of the caller's youth waiting for approval. */
  quizApprovals(): Observable<LoadResult<QuizApprovals>>;
  /** Approves the auto-score, or the override (0 to 100) when given; invalid carries { override }. */
  approveQuiz(attemptId: string, override: number | null): Observable<WriteOutcome>;
  approveAllQuizzes(): Observable<ApproveAllOutcome>;
  /** The reflections one of the caller's youth shared, newest first; forbidden when the youth is not theirs (L2-089 criterion 5). */
  sharedReflections(childId: string): Observable<LoadResult<SharedReflections>>;
  /** The caller's mentor check-ins of his youth, newest first; forbidden for a youth who is not his (L2-090 criterion 4). */
  checkIns(filter?: MentorCheckInFilter): Observable<LoadResult<MentorCheckInHistory>>;
  /** Logs a mentor check-in for one of the caller's youth; invalid carries one message per field (L2-090). */
  logCheckIn(body: LogMentorCheckIn): Observable<WriteOutcome>;
  /** The at-risk flags the caller reads, open or resolved (L2-091 criterion 4); forbidden for roles that read none. */
  flags(status: 'Open' | 'Resolved'): Observable<LoadResult<AtRiskFlags>>;
  /** Raises an at-risk flag on one of the caller's youth; invalid carries one message per field, already-flagged a second open flag. */
  raiseFlag(body: RaiseAtRiskFlag): Observable<FlagOutcome>;
  /** Resolves an open flag with an outcome; invalid carries one message per field, already-resolved a flag resolved meanwhile. */
  resolveFlag(id: string, body: ResolveAtRiskFlag): Observable<FlagOutcome>;
  /** One of the caller's youth's competencies; forbidden when the youth is not theirs. */
  competencies(childId: string): Observable<LoadResult<CompetencySheet>>;
  /** Saves every competency's level and note; only changed ones become new assessments. */
  saveCompetencies(childId: string, items: CompetencyChange[]): Observable<WriteOutcome>;
  /** A cohort's team, each roster child's mentor and the active mentors; only while Mentoring is on. */
  cohort(programId: string): Observable<LoadResult<CohortMentoring>>;
  assignYouth(
    programId: string,
    childId: string,
    mentorId: string | null,
  ): Observable<WriteOutcome>;
  unassignYouth(programId: string, childId: string): Observable<WriteOutcome>;
  setCohortMentors(
    programId: string,
    leadMentorId: string | null,
    supportingMentorIds: string[],
  ): Observable<WriteOutcome>;
}
