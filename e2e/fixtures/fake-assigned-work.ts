import type { Route } from '@playwright/test';
import type { FakeCurriculum } from './fake-curriculum';
import type { FakeProgram } from './programs';

export type WorkKind = 'Lesson' | 'Quiz' | 'Assignment';

export interface FakeAssignedWork {
  id: string;
  organizationId: string;
  childId: string;
  kind: WorkKind;
  itemId: string;
  programId: string | null;
  dueOn: string;
  message: string | null;
  assignedBy: string;
}

export interface WorkItem {
  id: string;
  kind: WorkKind;
  title: string;
  moduleId: string;
  moduleTitle: string;
  trackId: string;
  trackName: string;
  /** Published all the way up: the item, its lesson, its module and its track. */
  published: boolean;
}

/** A recipient: the child's id and name, and the tracks of the active programs she is on. */
export interface Recipient {
  id: string;
  name: string;
  trackIds: string[];
}

const KINDS: WorkKind[] = ['Lesson', 'Quiz', 'Assignment'];
const TODAY = '2026-11-05';

/**
 * Assigned work as the API keeps it (L2-092, ADR 0063): one row per youth and item. FakeApi checks the Mentoring and Learning modules,
 * the Mentor role, the organization and the mentor's scope before a call reaches it.
 */
export class FakeAssignedWorkStore {
  readonly rows: FakeAssignedWork[] = [];
  private next = 1;

  /** Answers every save with 500, to show the failed state. */
  failSaves = false;

  constructor(private readonly curriculum: FakeCurriculum) {}

  /** Work a mentor assigned earlier. */
  seed(row: Pick<FakeAssignedWork, 'childId' | 'kind' | 'itemId' | 'dueOn'> & Partial<FakeAssignedWork>): void {
    this.rows.push({ organizationId: 'org-harbourview', programId: null, message: null, assignedBy: 'Daniel Osei', ...row, id: row.id ?? `aw-${this.next++}` });
  }

  /** Every lesson, quiz and assignment of the tracks, in the order the dialog lists them. */
  items(trackIds: string[]): WorkItem[] {
    const c = this.curriculum;
    const tracks = c.tracks.filter((t) => trackIds.includes(t.id));
    const result: WorkItem[] = [];
    for (const track of [...tracks].sort((a, b) => a.name.localeCompare(b.name))) {
      for (const module of c.modules.filter((m) => m.trackId === track.id).sort((a, b) => a.position - b.position)) {
        const up = module.status === 'Published' && track.status === 'Published';
        const lessons = c.lessons.filter((l) => l.moduleId === module.id).sort((a, b) => a.position - b.position);
        const open = (lessonId: string | null) => lessonId === null || lessons.some((l) => l.id === lessonId && l.status === 'Published' && !l.deleted);
        const base = { moduleId: module.id, moduleTitle: module.title, trackId: track.id, trackName: track.name };
        lessons.forEach((l) => result.push({ ...base, id: l.id, kind: 'Lesson', title: l.title, published: up && l.status === 'Published' && !l.deleted }));
        c.assessments.quizzes
          .filter((q) => q.moduleId === module.id)
          .forEach((q) => result.push({ ...base, id: q.id, kind: 'Quiz', title: q.title, published: up && q.status === 'Published' && open(q.lessonId) }));
        c.assessments.assignments
          .filter((a) => a.moduleId === module.id)
          .forEach((a) => result.push({ ...base, id: a.id, kind: 'Assignment', title: a.title, published: up && a.status === 'Published' && open(a.lessonId) }));
      }
    }
    return result;
  }

  /** The item in the organization, published or not. */
  item(org: string, id: string): WorkItem | undefined {
    const trackIds = this.curriculum.tracks.filter((t) => t.organizationId === org).map((t) => t.id);
    return this.items(trackIds).find((i) => i.id === id);
  }

  /** The track a program follows. */
  trackOf(program: FakeProgram): string | null {
    return this.curriculum.programTracks.get(program.id) ?? null;
  }

  /**
   * POST /mentoring/assigned-work once every child and the cohort are known to be his (L2-092 criteria 2 and 3): each field checked as the
   * server does, every recipient following the item's track, one row per youth and item. Answers how many youth it went to, 0 when refused.
   */
  async assign(route: Route, org: string, by: string, item: WorkItem | null, chosen: Recipient[], cohort: { program: FakeProgram; roster: string[] } | null): Promise<number> {
    const refuse = async (status: number, json?: unknown) => (await route.fulfill({ status, json }), 0);
    if (this.failSaves) return refuse(500);
    const b = route.request().postDataJSON() as Record<string, unknown>;
    const errors: Record<string, string> = {};
    const kind = b['kind'] as WorkKind;
    if (!item || !KINDS.includes(kind) || item.kind !== kind || !item.published) errors['itemId'] = 'Choose what to assign.';
    if ((chosen.length > 0) === (cohort !== null)) errors['who'] = 'Choose who it’s for.';
    const dueOn = typeof b['dueOn'] === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(b['dueOn']) ? b['dueOn'] : null;
    if (!dueOn) errors['dueOn'] = 'Choose a due date.';
    else if (dueOn < TODAY) errors['dueOn'] = 'The due date can’t be in the past.';
    const message = typeof b['message'] === 'string' && b['message'].trim() ? b['message'].trim() : null;
    if (message && message.length > 500) errors['message'] = 'Keep it to 500 characters.';
    if (Object.keys(errors).length) return refuse(422, { errors });
    const noun = kind.toLowerCase();
    let recipients: string[];
    if (cohort) {
      if (this.trackOf(cohort.program) !== item!.trackId) {
        return refuse(422, { errors: { programId: `${cohort.program.name} doesn’t follow the track this ${noun} is in.` } });
      }
      if (cohort.roster.length === 0) return refuse(422, { errors: { programId: 'That cohort has no youth on its roster.' } });
      recipients = cohort.roster;
    } else {
      const stray = [...chosen].sort((x, y) => x.name.localeCompare(y.name)).find((r) => !r.trackIds.includes(item!.trackId));
      if (stray) return refuse(422, { errors: { childIds: `${stray.name} doesn’t follow the track this ${noun} is in.` } });
      recipients = chosen.map((r) => r.id);
    }
    for (const childId of recipients) {
      const row = this.rows.find((r) => r.organizationId === org && r.childId === childId && r.kind === kind && r.itemId === item!.id);
      if (row) Object.assign(row, { programId: cohort?.program.id ?? null, dueOn: dueOn!, message, assignedBy: by });
      else
        this.rows.push({ id: `aw-${this.next++}`, organizationId: org, childId, kind, itemId: item!.id, programId: cohort?.program.id ?? null, dueOn: dueOn!, message, assignedBy: by });
    }
    await route.fulfill({ status: 201, json: { count: recipients.length, title: item!.title, dueOn } });
    return recipients.length;
  }
}
