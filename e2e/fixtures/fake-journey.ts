import type { Route } from '@playwright/test';
import { moduleDone, moduleStatus, trackDone, trackTotal, type FakeLearning, type TrackState } from './fake-learning';
import type { FakeBadges } from './fake-badges';
import type { FakeProgression } from './fake-progression';
import type { FakeReviews } from './fake-reviews';
import { NOW, type FakeProgram } from './programs';
import type { Membership } from './seed';

const DAY = 86_400_000;

/** The Monday that starts the UTC week holding the moment, as a day number. */
const weekOf = (at: Date): number => {
  const day = Math.floor(at.getTime() / DAY);
  return day - ((new Date(day * DAY).getUTCDay() + 6) % 7);
};

/** Weeks in a row with a lesson, from this week or, while it has none, last week (L2-087 criterion 2, ADR 0059). */
export const streakWeeks = (times: string[], now: Date = NOW): number => {
  const weeks = new Set(times.map((t) => weekOf(new Date(t))));
  let week = weekOf(now);
  if (!weeks.has(week)) week -= 7;
  let streak = 0;
  while (weeks.has(week)) {
    streak++;
    week -= 7;
  }
  return streak;
};

/**
 * A youth's journey, badges and progress as the API answers them (L2-087, L2-088, ADR 0059), computed from the other fakes: lessons from
 * FakeLearning, stages from FakeProgression and assessments from FakeReviews. FakeApi checked Learning, Learn, consent and placement.
 */
export class FakeJourney {
  constructor(
    private readonly learning: FakeLearning,
    private readonly progression: FakeProgression,
    private readonly reviews: FakeReviews,
    private readonly badgeBook: FakeBadges,
  ) {}

  /** What earns an automatic badge, naming its target; null when the target is not in a track she follows. */
  private describe(rule: string | null, targetId: string | null, tracks: TrackState[]): string | null {
    const modules = tracks.flatMap((t) => t.modules);
    if (rule === 'LessonCompleted') {
      const l = modules.flatMap((m) => m.lessons).find((x) => x.lesson.id === targetId);
      return l ? `Finish ${l.lesson.title}.` : null;
    }
    if (rule === 'ModuleCompleted') {
      const m = modules.find((x) => x.module.id === targetId);
      return m ? `Finish ${m.module.title}.` : null;
    }
    if (rule === 'QuizPassed') {
      const q = modules.flatMap((m) => m.quizzes).find((x) => x.quiz.id === targetId);
      return q ? `Pass ${q.quiz.title}.` : null;
    }
    if (rule === 'AssignmentAccepted') {
      const a = modules.flatMap((m) => m.assignments).find((x) => x.assignment.id === targetId);
      return a ? `Have ${a.assignment.title} accepted.` : null;
    }
    return null;
  }

  private badgeProgress(membershipId: string, rule: string | null, targetId: string | null, tracks: TrackState[]): [number, number] {
    const modules = tracks.flatMap((t) => t.modules);
    if (rule === 'ModuleCompleted') {
      const m = modules.find((x) => x.module.id === targetId)!;
      return [moduleDone(m), m.lessons.length];
    }
    if (rule === 'LessonCompleted') return [modules.flatMap((m) => m.lessons).find((x) => x.lesson.id === targetId)!.done ? 1 : 0, 1];
    if (rule === 'QuizPassed') return [modules.flatMap((m) => m.quizzes).find((x) => x.quiz.id === targetId)!.passed ? 1 : 0, 1];
    return [this.learning.work.mine(membershipId, targetId!)?.status === 'Accepted' ? 1 : 0, 1];
  }

  /** Her badges: earned oldest first (deleted or not), and those she can still earn in the order made (L2-087 criteria 4 and 5). */
  badgesOf(m: Membership, programs: FakeProgram[]) {
    const tracks = this.learning.tracks(m.id, programs);
    const book = this.badgeBook.badges.filter((b) => b.organizationId === m.organizationId);
    const mine = this.badgeBook.awards.filter((a) => a.membershipId === m.id && book.some((b) => b.id === a.badgeId));
    const earned = [...mine]
      .sort((a, b) => a.awardedAt.localeCompare(b.awardedAt))
      .map((a) => {
        const b = book.find((x) => x.id === a.badgeId)!;
        const fallback = b.kind === 'Manual' ? 'Awarded by hand.' : 'Earned as you learned.';
        return {
          id: b.id,
          name: b.name,
          icon: b.icon,
          description: b.description ?? this.describe(b.rule, b.targetId, tracks) ?? fallback,
          awardedAt: a.awardedAt,
          awardedBy: a.awardedBy,
        };
      });
    const locked = book
      .filter(
        (b) => !b.deleted && !mine.some((a) => a.badgeId === b.id) && (b.kind === 'Manual' || this.describe(b.rule, b.targetId, tracks) !== null),
      )
      .map((b) => {
        const [completed, total] = b.kind === 'Manual' ? [null, null] : this.badgeProgress(m.id, b.rule, b.targetId, tracks);
        const description =
          b.kind === 'Manual'
            ? (b.description ?? 'Your program team awards it by hand.')
            : (b.description ?? this.describe(b.rule, b.targetId, tracks)!);
        return {
          id: b.id,
          name: b.name,
          icon: b.icon,
          description,
          kind: b.kind,
          rule: b.rule,
          completed,
          total,
        };
      });
    const milestones: {
      kind: string;
      title: string;
      text: string;
      at: string | null;
    }[] = [...programs]
      .sort((a, b) => a.startsOn.localeCompare(b.startsOn))
      .map((p) => ({
        kind: 'joined',
        title: `Joined ${p.name}`,
        text: 'Welcome to PromiseHub',
        at: `${p.startsOn}T12:00:00Z`,
      }));
    milestones.push(
      ...earned.map((b) => ({
        kind: 'badge',
        title: `${b.name} badge`,
        text: b.description,
        at: b.awardedAt,
      })),
    );
    const next = locked
      .filter((b) => (b.total ?? 0) > 0)
      .sort((a, b) => b.completed! / b.total! - a.completed! / a.total! || (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))[0];
    if (next) {
      const progress = next.rule === 'ModuleCompleted' ? `${next.completed} of ${next.total} lessons` : `${next.completed} of ${next.total}`;
      milestones.push({
        kind: 'next',
        title: `Next up: ${next.name}`,
        text: `${progress} · ${next.description}`,
        at: null,
      });
    }
    return { earned, locked, milestones };
  }

  /** GET /learning/progress; attendance is null while Roll Call is off (L2-088 criterion 4). */
  progress(
    route: Route,
    m: Membership,
    programs: FakeProgram[],
    childId: string | null,
    attendance: { eventId: string; name: string; startsAt: string; status: string }[] | null,
  ): Promise<void> {
    const tracks = this.learning.tracks(m.id, programs);
    const quizzes = tracks
      .flatMap((t) => t.modules)
      .flatMap((x) =>
        x.quizzes.map((q) => {
          const mine = this.learning.quizzes.mine(m.id, q.quiz.id);
          const best = this.learning.quizzes.best(m.id, q.quiz.id)?.score ?? null;
          return {
            quizId: q.quiz.id,
            title: q.quiz.title,
            moduleTitle: x.module.title,
            bestScore: best,
            passed: best === null ? null : best >= q.quiz.passMark,
            waiting: best === null && mine.some((a) => a.status === 'AwaitingApproval'),
          };
        }),
      )
      .filter((q) => q.bestScore !== null || q.waiting);
    const scores = quizzes.filter((q) => q.bestScore !== null).map((q) => q.bestScore!);
    const stages = new Map(this.progression.stagesOf(m.organizationId).map((s) => [s.id, s.name]));
    const sessions = attendance ? [...attendance].sort((a, b) => b.startsAt.localeCompare(a.startsAt)) : null;
    return route.fulfill({
      json: {
        completedLessons: tracks.reduce((n, t) => n + trackDone(t), 0),
        totalLessons: tracks.reduce((n, t) => n + trackTotal(t), 0),
        streakWeeks: streakWeeks(this.learning.completionTimes(m.id)),
        quizAverage: scores.length ? Math.round(scores.reduce((n, x) => n + x, 0) / scores.length) : null,
        quizzes,
        competencies: this.competencies(m.organizationId, childId).map((c) => ({
          id: c.id,
          name: c.name,
          stage: stages.get(c.stageId) ?? null,
          level: c.level,
        })),
        attendance: sessions
          ? {
              attended: sessions.filter((x) => x.status === 'Present').length,
              marked: sessions.length,
              sessions,
            }
          : null,
      },
    });
  }

  /** GET /learning/badges. */
  badges(route: Route, m: Membership, programs: FakeProgram[]): Promise<void> {
    return route.fulfill({ json: this.badgesOf(m, programs) });
  }

  /** Each competency of the organization not removed, in framework order, with the child's latest level. */
  competencies(org: string, childId: string | null): { id: string; name: string; stageId: string; level: string }[] {
    return this.reviews.competencies
      .filter((c) => c.organizationId === org && !c.removed)
      .map((c) => ({
        id: c.id,
        name: c.name,
        stageId: c.stageId,
        level: this.reviews.competencyAssessments.filter((a) => a.childId === childId && a.competencyId === c.id).at(-1)?.level ?? 'NotStarted',
      }));
  }

  stages(org: string, childId: string | null) {
    const competencies = this.competencies(org, childId);
    let reached = false;
    return this.progression.stagesOf(org).map((s) => {
      const mine = competencies.filter((c) => c.stageId === s.id);
      const proficient = mine.filter((c) => c.level === 'Proficient' || c.level === 'Mastered').length;
      const status = reached ? 'ahead' : proficient === mine.length ? 'earned' : 'current';
      reached ||= status === 'current';
      return {
        id: s.id,
        name: s.name,
        description: s.description,
        status,
        proficient,
        competencies: mine.map((c) => c.name),
      };
    });
  }

  private current(tracks: TrackState[]) {
    for (const t of tracks) {
      for (const m of t.modules) {
        if (m.lessons.some((l) => !l.done && !l.locked))
          return {
            trackId: t.track.id,
            moduleId: m.module.id,
            moduleTitle: m.module.title,
          };
      }
    }
    return null;
  }

  /** GET /learning/journey. */
  journey(route: Route, m: Membership, programs: FakeProgram[], childId: string | null): Promise<void> {
    const tracks = this.learning.tracks(m.id, programs);
    const mine = this.badgesOf(m, programs);
    return route.fulfill({
      json: {
        completedLessons: tracks.reduce((n, t) => n + trackDone(t), 0),
        totalLessons: tracks.reduce((n, t) => n + trackTotal(t), 0),
        streakWeeks: streakWeeks(this.learning.completionTimes(m.id)),
        current: this.current(tracks),
        tracks: tracks.map((t) => ({
          id: t.track.id,
          name: t.track.name,
          completedLessons: trackDone(t),
          totalLessons: trackTotal(t),
          modules: t.modules.map((x) => ({
            id: x.module.id,
            title: x.module.title,
            description: x.module.description,
            lessonCount: x.lessons.length,
            completedLessons: moduleDone(x),
            status: moduleStatus(x),
            unlockAfter: x.unlockAfter,
          })),
        })),
        stages: this.stages(m.organizationId, childId),
        badges: {
          earned: mine.earned.length,
          total: mine.earned.length + mine.locked.length,
          items: [
            ...mine.earned.map((b) => ({
              id: b.id,
              name: b.name,
              icon: b.icon,
              earned: true,
            })),
            ...mine.locked.map((b) => ({
              id: b.id,
              name: b.name,
              icon: b.icon,
              earned: false,
            })),
          ],
        },
      },
    });
  }
}
