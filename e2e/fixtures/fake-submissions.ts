import type { Route } from '@playwright/test';
import type { FakeAssignment } from './fake-assessments';

/** The day the fake API treats as today, as the API's clock in the tests. */
export const TODAY = '2026-11-05';

/** What the assignment routes need to know about the youth's module: the assignment as she stands with it, or null when not visible. */
export interface AssignmentPlace {
  assignment: FakeAssignment;
  moduleId: string;
  moduleTitle: string;
  lessonTitle: string | null;
  trackId: string;
  locked: boolean;
  unlockAfter: string | null;
}

const days = (iso: string) =>
  Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) / 86_400_000;

/** Open until the due date plus the grace days; then late when late work is accepted, otherwise closed (ADR 0056). */
export function dueState(a: FakeAssignment, today = TODAY): 'open' | 'late' | 'closed' {
  if (!a.dueDate || days(today) <= days(a.dueDate) + a.graceDays) return 'open';
  return a.allowLate ? 'late' : 'closed';
}

/**
 * Assignment submissions as the API answers them (L2-077, L2-078, ADR 0056). FakeApi checks the Learning module, Learn, consent and
 * placement first; the caller sees only her own submissions and only assignments visible to her.
 */
export class FakeSubmissions {
  /** Answers every brief and status read with 500, to show the error states. */
  failReads = false;

  /** The caller's submission of an assignment, or undefined. */
  mine(membershipId: string, assignmentId: string): { id: string; status: string } | undefined {
    void membershipId;
    void assignmentId;
    return undefined;
  }

  /** An assignment's state on the module page: locked, next, or her submission's status. */
  state(membershipId: string, assignmentId: string, locked: boolean): string {
    if (locked) return 'locked';
    const sub = this.mine(membershipId, assignmentId);
    return sub ? sub.status : 'next';
  }

  /** GET /learning/assignments/{id}. */
  brief(route: Route, place: AssignmentPlace | null, mentorName: string | null): Promise<void> {
    if (this.failReads) return route.fulfill({ status: 500 });
    if (!place) return route.fulfill({ status: 404 });
    if (place.locked)
      return route.fulfill({
        status: 403,
        json: { code: 'locked', unlockAfter: place.unlockAfter },
      });
    const a = place.assignment;
    return route.fulfill({
      json: {
        id: a.id,
        title: a.title,
        moduleId: place.moduleId,
        moduleTitle: place.moduleTitle,
        lessonTitle: place.lessonTitle,
        brief: a.brief ?? '',
        submissionTypes: (['Text', 'Photo', 'Link', 'File'] as const).filter((t) =>
          a.submissionTypes.includes(t),
        ),
        rubric: a.rubric,
        totalPoints: a.rubric.reduce((n, r) => n + r.points, 0),
        dueDate: a.dueDate,
        graceDays: a.graceDays,
        allowLate: a.allowLate,
        dueState: dueState(a),
        daysLeft: a.dueDate ? days(a.dueDate) - days(TODAY) : null,
        mentorName,
        submission: null,
      },
    });
  }
}
