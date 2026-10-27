import type { Route } from '@playwright/test';
import type { FakeAssessments } from './fake-assessments';
import type { FakeCurriculum } from './fake-curriculum';
import type { FakeQuizTaking } from './fake-quiz-taking';
import type { FakeSubmissions } from './fake-submissions';

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
}
