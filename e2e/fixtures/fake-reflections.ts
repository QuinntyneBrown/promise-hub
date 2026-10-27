import type { Route } from '@playwright/test';
import { NOW } from './programs';
import type { LessonState, ModuleState } from './fake-learning';

export interface FakeReflection {
  organizationId: string;
  membershipId: string;
  lessonId: string;
  mood: string;
  text: string;
  action: string | null;
  shared: boolean;
  savedAt: string;
}

const MOODS = ['Hopeful', 'Thoughtful', 'Unsure', 'Challenged'];

/**
 * Youth reflections as the API keeps them (L2-089, ADR 0060): one per youth membership and lesson, private unless shared. FakeApi checks
 * the Learning module, the Learn permission, consent and placement, and finds the lesson she can see, before a call reaches it.
 */
export class FakeReflections {
  private readonly rows = new Map<string, FakeReflection>();

  /** Answers every save with 500, to show the failed state. */
  failSaves = false;

  of(membershipId: string, lessonId: string): FakeReflection | null {
    return this.rows.get(`${membershipId}:${lessonId}`) ?? null;
  }

  seed(row: Omit<FakeReflection, 'savedAt'> & { savedAt?: string }): void {
    this.rows.set(`${row.membershipId}:${row.lessonId}`, { ...row, savedAt: row.savedAt ?? NOW.toISOString() });
  }

  /** GET /learning/lessons/{id}/reflection. */
  editor(route: Route, membershipId: string, found: { module: ModuleState; lesson: LessonState } | null, mentorName: string | null): Promise<void> {
    if (!found) return route.fulfill({ status: 404 });
    const { module: m, lesson: l } = found;
    if (l.locked) return route.fulfill({ status: 403, json: { code: 'locked', unlockAfter: l.unlockAfter } });
    const r = this.of(membershipId, l.lesson.id);
    return route.fulfill({
      json: {
        lessonId: l.lesson.id,
        lessonTitle: l.lesson.title,
        moduleId: m.module.id,
        moduleTitle: m.module.title,
        prompts: l.lesson.prompts,
        mentorName,
        reflection: r ? this.view(r) : null,
      },
    });
  }

  /** PUT /learning/lessons/{id}/reflection: a mood and her words, within their limits. */
  save(route: Route, organizationId: string, membershipId: string, found: { lesson: LessonState } | null): Promise<void> {
    if (this.failSaves) return route.fulfill({ status: 500 });
    if (!found) return route.fulfill({ status: 404 });
    const l = found.lesson;
    if (l.locked) return route.fulfill({ status: 403, json: { code: 'locked', unlockAfter: l.unlockAfter } });
    const body = route.request().postDataJSON() as { mood: string | null; text: string | null; action: string | null; shared: boolean };
    const text = (body.text ?? '').trim();
    const action = (body.action ?? '').trim() || null;
    const errors: Record<string, string> = {};
    if (!body.mood || !MOODS.includes(body.mood)) errors['mood'] = 'Choose how you’re feeling.';
    if (!text) errors['text'] = 'Write your reflection.';
    else if (text.length > 5000) errors['text'] = 'Keep your reflection under 5,000 characters.';
    if (action && action.length > 1000) errors['action'] = 'Keep it under 1,000 characters.';
    if (Object.keys(errors).length) return route.fulfill({ status: 422, json: { errors } });
    const row: FakeReflection = { organizationId, membershipId, lessonId: l.lesson.id, mood: body.mood!, text, action, shared: !!body.shared, savedAt: NOW.toISOString() };
    this.rows.set(`${membershipId}:${l.lesson.id}`, row);
    return route.fulfill({ json: this.view(row) });
  }

  /** GET /mentoring/youth/{childId}/reflections: only the shared reflections of her youth memberships, newest first (L2-089 criterion 5). */
  shared(
    route: Route,
    childId: string,
    name: string,
    membershipIds: string[],
    lesson: (id: string) => { title: string; moduleTitle: string } | null,
  ): Promise<void> {
    const reflections = [...this.rows.values()]
      .filter((r) => r.shared && membershipIds.includes(r.membershipId))
      .sort((a, b) => b.savedAt.localeCompare(a.savedAt))
      .flatMap((r) => {
        const l = lesson(r.lessonId);
        return l ? [{ lessonId: r.lessonId, lessonTitle: l.title, moduleTitle: l.moduleTitle, mood: r.mood, text: r.text, action: r.action, savedAt: r.savedAt }] : [];
      });
    return route.fulfill({ json: { childId, name, reflections } });
  }

  private view(r: FakeReflection) {
    return { mood: r.mood, text: r.text, action: r.action, shared: r.shared, savedAt: r.savedAt };
  }
}
