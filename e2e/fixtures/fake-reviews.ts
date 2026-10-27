import type { Route } from '@playwright/test';
import type { FakeAssessments } from './fake-assessments';
import type { FakeCurriculum } from './fake-curriculum';
import type { FakeQuizTaking } from './fake-quiz-taking';
import type { FakeSubmission, FakeSubmissions } from './fake-submissions';

const NOW = '2026-11-05T15:20:00Z';

/** A mentor's youth accounts, by membership id with the youth's name (ADR 0057). */
export type YouthAccounts = Map<string, string>;

/**
 * The mentor's reviews as the API answers them (L2-080 to L2-083, ADR 0057). FakeApi checks Mentoring and Learning, MentorYouth and
 * the mentor's youth before any call reaches it; nothing of another mentor's youth is read.
 */
export class FakeReviews {
  constructor(
    private readonly curriculum: FakeCurriculum,
    private readonly work: FakeSubmissions,
    private readonly quizzes: FakeQuizTaking,
  ) {}

  private get assessments(): FakeAssessments {
    return this.curriculum.assessments;
  }

  private moduleTitle(org: string, moduleId: string): string {
    return this.curriculum.moduleOf(org, moduleId)?.title ?? '';
  }

  /** GET /mentoring/reviews: Submitted or In review submissions and attempts awaiting approval of his youth, oldest first. */
  queue(route: Route, org: string, youth: YouthAccounts): Promise<void> {
    const submissions = this.work
      .all()
      .filter((s) => youth.has(s.membershipId) && (s.status === 'Submitted' || s.status === 'InReview'))
      .map((s) => {
        const a = this.assessments.assignments.find((x) => x.id === s.assignmentId)!;
        return { id: s.id, kind: 'Assignment', membershipId: s.membershipId, youthName: youth.get(s.membershipId)!, title: a.title, moduleTitle: this.moduleTitle(org, a.moduleId), submittedAt: s.submittedAt, late: s.late, status: s.status, score: null };
      });
    const attempts = this.quizzes.attempts
      .filter((t) => youth.has(t.membershipId) && t.status === 'AwaitingApproval')
      .map((t) => {
        const q = this.assessments.quizzes.find((x) => x.id === t.quizId)!;
        return { id: t.id, kind: 'Quiz', membershipId: t.membershipId, youthName: youth.get(t.membershipId)!, title: q.title, moduleTitle: this.moduleTitle(org, q.moduleId), submittedAt: t.submittedAt!, late: false, status: 'AwaitingApproval', score: t.score };
      });
    const items = [...submissions, ...attempts].sort((a, b) => a.submittedAt.localeCompare(b.submittedAt));
    return route.fulfill({ json: { items } });
  }

  /** The criteria of an assignment's rubric with stable ids. */
  private criteria(assignmentId: string): { id: string; description: string; points: number }[] {
    const a = this.assessments.assignments.find((x) => x.id === assignmentId)!;
    return a.rubric.map((c, i) => ({ id: `${assignmentId}-c${i + 1}`, ...c }));
  }

  private mine(youth: YouthAccounts, id: string): FakeSubmission | undefined {
    const s = this.work.all().find((x) => x.id === id);
    return s && youth.has(s.membershipId) ? s : undefined;
  }

  /** As if another mentor of hers saved a draft grade after it was opened: the version moves on. */
  otherMentorSaved(id: string, comment: string): void {
    const s = this.work.all().find((x) => x.id === id)!;
    s.reviewComment = comment;
    s.version = (s.version ?? 1) + 1;
  }

  /** GET /mentoring/submissions/{id}: the first open of a Submitted submission starts the review. */
  review(route: Route, org: string, youth: YouthAccounts, id: string, mentor: string): Promise<void> {
    const s = this.mine(youth, id);
    if (!s) return route.fulfill({ status: 404 });
    if (s.status === 'Submitted') {
      s.status = 'InReview';
      s.reviewerName = mentor;
      s.version = (s.version ?? 1) + 1;
      s.history.push({ kind: 'ReviewStarted', actor: mentor, note: null, at: NOW });
    }
    const a = this.assessments.assignments.find((x) => x.id === s.assignmentId)!;
    const rubric = this.criteria(a.id).map((c) => ({ ...c, score: s.scores?.[c.id] ?? null }));
    return route.fulfill({
      json: {
        id: s.id,
        membershipId: s.membershipId,
        youthName: youth.get(s.membershipId),
        assignmentId: a.id,
        assignmentTitle: a.title,
        moduleTitle: this.moduleTitle(org, a.moduleId),
        brief: a.brief,
        status: s.status,
        late: s.late,
        round: s.round,
        submittedAt: s.submittedAt,
        text: s.text,
        link: s.link,
        file: s.file ? { name: s.file.name, kind: s.file.kind, bytes: s.file.bytes.length } : null,
        rubric,
        totalPoints: rubric.reduce((n, c) => n + c.points, 0),
        comment: s.reviewComment ?? null,
        feedback: s.feedback,
        points: s.points,
        history: s.history,
        version: s.version ?? 1,
      },
    });
  }

  /** GET /mentoring/submissions/{id}/file. */
  file(route: Route, youth: YouthAccounts, id: string): Promise<void> {
    const s = this.mine(youth, id);
    if (!s?.file) return route.fulfill({ status: 404 });
    return route.fulfill({ status: 200, contentType: s.file.type, body: s.file.bytes, headers: { 'content-disposition': `attachment; filename="${s.file.name}"`, 'x-content-type-options': 'nosniff' } });
  }

  /** POST /mentoring/submissions/{id}/grade: version, status, then each score against its criterion, as GradeSubmissionHandler checks. */
  grade(route: Route, youth: YouthAccounts, id: string, mentor: string): Promise<void> {
    const s = this.mine(youth, id);
    if (!s) return route.fulfill({ status: 404 });
    const body = route.request().postDataJSON() as { decision: string; scores: { criterionId: string; points: number }[]; comment: string | null; version: number };
    if ((s.version ?? 1) !== body.version) return route.fulfill({ status: 409, json: { code: 'stale' } });
    if (s.status === 'Accepted' || s.status === 'NeedsRevision') return route.fulfill({ status: 409, json: { code: 'not-reviewable' } });
    const criteria = this.criteria(s.assignmentId);
    const given = new Map((body.scores ?? []).map((x) => [x.criterionId, x.points]));
    const comment = body.comment?.trim() || null;
    const errors: Record<string, string> = {};
    criteria.forEach((c, i) => {
      const p = given.get(c.id);
      if (p !== undefined && (p < 0 || p > c.points)) errors[`scores.${i}`] = `Give 0 to ${c.points} points.`;
      else if (body.decision === 'approve' && p === undefined) errors[`scores.${i}`] = 'Score this criterion before you approve.';
    });
    if (comment && comment.length > 2000) errors['comment'] = 'Keep the comment to 2,000 characters.';
    else if (body.decision === 'revise' && !comment) errors['comment'] = 'Write what they should change.';
    if (Object.keys(errors).length) return route.fulfill({ status: 422, json: { errors } });
    s.scores = Object.fromEntries(given);
    s.reviewComment = comment;
    s.version = (s.version ?? 1) + 1;
    const total = [...given.values()].reduce((n, p) => n + p, 0);
    if (body.decision === 'approve') {
      Object.assign(s, { status: 'Accepted', points: total, feedback: comment, reviewerName: mentor });
      s.history.push({ kind: 'Accepted', actor: mentor, note: comment, at: NOW });
    } else if (body.decision === 'revise') {
      Object.assign(s, { status: 'NeedsRevision', feedback: comment, reviewerName: mentor });
      s.history.push({ kind: 'RevisionRequested', actor: mentor, note: comment, at: NOW });
    }
    return route.fulfill({ json: { status: s.status, points: s.points, version: s.version } });
  }

  /** GET /mentoring/quiz-approvals: attempts of his youth awaiting approval, oldest first. */
  quizApprovals(route: Route, org: string, youth: YouthAccounts): Promise<void> {
    const items = this.quizzes.attempts
      .filter((t) => youth.has(t.membershipId) && t.status === 'AwaitingApproval')
      .sort((a, b) => a.submittedAt!.localeCompare(b.submittedAt!))
      .map((t) => {
        const q = this.assessments.quizzes.find((x) => x.id === t.quizId)!;
        return { id: t.id, youthName: youth.get(t.membershipId), quizTitle: q.title, moduleTitle: this.moduleTitle(org, q.moduleId), number: t.number, score: t.score, correct: t.correct, total: t.total, passMark: q.passMark, submittedAt: t.submittedAt };
      });
    return route.fulfill({ json: { items } });
  }

  private approveAttempt(t: { quizId: string; score: number | null; passed: boolean | null; status: string; autoScore?: number | null }, override: number | null): void {
    const q = this.assessments.quizzes.find((x) => x.id === t.quizId)!;
    t.autoScore = t.score;
    t.score = override ?? t.score;
    t.passed = t.score! >= q.passMark;
    t.status = 'Scored';
  }

  /** POST /mentoring/quiz-attempts/{id}/approve. */
  approveQuiz(route: Route, youth: YouthAccounts, id: string): Promise<void> {
    const t = this.quizzes.attempts.find((x) => x.id === id && youth.has(x.membershipId));
    if (!t) return route.fulfill({ status: 404 });
    if (t.status !== 'AwaitingApproval') return route.fulfill({ status: 409, json: { code: 'not-awaiting' } });
    const override = (route.request().postDataJSON() as { override: number | null }).override ?? null;
    if (override !== null && (!Number.isInteger(override) || override < 0 || override > 100))
      return route.fulfill({ status: 422, json: { errors: { override: 'Enter a whole number from 0 to 100, or leave it blank.' } } });
    this.approveAttempt(t, override);
    return route.fulfill({ json: { approved: 1 } });
  }

  /** POST /mentoring/quiz-approvals/approve-all. */
  approveAll(route: Route, youth: YouthAccounts): Promise<void> {
    const waiting = this.quizzes.attempts.filter((t) => youth.has(t.membershipId) && t.status === 'AwaitingApproval');
    waiting.forEach((t) => this.approveAttempt(t, null));
    return route.fulfill({ json: { approved: waiting.length } });
  }
}
