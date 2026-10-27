import type { Route } from "@playwright/test";
import {
  moduleDone,
  moduleStatus,
  trackDone,
  trackTotal,
  type FakeLearning,
  type TrackState,
} from "./fake-learning";
import type { FakeProgression } from "./fake-progression";
import type { FakeReviews } from "./fake-reviews";
import { NOW, type FakeProgram } from "./programs";
import type { Membership } from "./seed";

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
  ) {}

  /** Each competency of the organization not removed, in framework order, with the child's latest level. */
  competencies(
    org: string,
    childId: string | null,
  ): { id: string; name: string; stageId: string; level: string }[] {
    return this.reviews.competencies
      .filter((c) => c.organizationId === org && !c.removed)
      .map((c) => ({
        id: c.id,
        name: c.name,
        stageId: c.stageId,
        level:
          this.reviews.competencyAssessments
            .filter((a) => a.childId === childId && a.competencyId === c.id)
            .at(-1)?.level ?? "NotStarted",
      }));
  }

  stages(org: string, childId: string | null) {
    const competencies = this.competencies(org, childId);
    let reached = false;
    return this.progression.stagesOf(org).map((s) => {
      const mine = competencies.filter((c) => c.stageId === s.id);
      const proficient = mine.filter(
        (c) => c.level === "Proficient" || c.level === "Mastered",
      ).length;
      const status = reached
        ? "ahead"
        : proficient === mine.length
          ? "earned"
          : "current";
      reached ||= status === "current";
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
  journey(
    route: Route,
    m: Membership,
    programs: FakeProgram[],
    childId: string | null,
  ): Promise<void> {
    const tracks = this.learning.tracks(m.id, programs);
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
      },
    });
  }
}
