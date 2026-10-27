import { readFileSync } from 'node:fs';
import type { Route } from '@playwright/test';
import type { FakeCurriculum, FakeLesson, FakeModule, FakeTrack } from './fake-curriculum';
import type { FakeProgram } from './programs';

interface LessonState {
  lesson: FakeLesson;
  done: boolean;
  locked: boolean;
  unlockAfter: string | null;
}

interface ModuleState {
  module: FakeModule;
  position: number;
  lessons: LessonState[];
  locked: boolean;
  unlockAfter: string | null;
}

interface TrackState {
  track: FakeTrack;
  program: string;
  modules: ModuleState[];
}

const lessonStatus = (l: LessonState) => (l.done ? 'done' : l.locked ? 'locked' : 'next');
const moduleDone = (m: ModuleState) => m.lessons.filter((l) => l.done).length;
const moduleStatus = (m: ModuleState) =>
  m.locked ? 'locked' : m.lessons.length > 0 && m.lessons.every((l) => l.done) ? 'done' : moduleDone(m) > 0 ? 'in-progress' : 'not-started';
const trackDone = (t: TrackState) => t.modules.reduce((n, m) => n + moduleDone(m), 0);
const trackTotal = (t: TrackState) => t.modules.reduce((n, m) => n + m.lessons.length, 0);

/**
 * A youth's lessons as the API answers them (L2-068 to L2-070, ADR 0051): only Published content of Published tracks followed by
 * the programs the youth is placed in; a module locked while its published prerequisite is not done, a lesson while an earlier one
 * is not done. FakeApi checks the Learning module, the Learn permission, consent and placement before any call reaches it.
 */
export class FakeLearning {
  /** Lesson ids each youth membership has done. */
  private readonly done = new Map<string, Set<string>>();

  constructor(private readonly curriculum: FakeCurriculum) {}

  /** Marks lessons done for a youth, as if completed earlier. */
  complete(membershipId: string, ...lessonIds: string[]): void {
    const set = this.done.get(membershipId) ?? new Set<string>();
    lessonIds.forEach((id) => set.add(id));
    this.done.set(membershipId, set);
  }

  isDone(membershipId: string, lessonId: string): boolean {
    return this.done.get(membershipId)?.has(lessonId) ?? false;
  }

  /** The youth's tracks: one per Published track their active programs follow, earliest program first. */
  tracks(membershipId: string, programs: FakeProgram[]): TrackState[] {
    const seen = new Set<string>();
    const result: TrackState[] = [];
    for (const p of [...programs].sort((a, b) => a.startsOn.localeCompare(b.startsOn))) {
      const trackId = this.curriculum.programTracks.get(p.id);
      const track = this.curriculum.tracks.find((t) => t.id === trackId && t.status === 'Published' && t.organizationId === p.organizationId);
      if (!track || seen.has(track.id)) continue;
      seen.add(track.id);
      result.push(this.build(membershipId, track, p.name));
    }
    return result;
  }

  private build(membershipId: string, track: FakeTrack, program: string): TrackState {
    const done = this.done.get(membershipId) ?? new Set<string>();
    const all = this.curriculum.modules.filter((m) => m.trackId === track.id);
    const published = (moduleId: string) =>
      this.curriculum.lessons.filter((l) => l.moduleId === moduleId && l.status === 'Published' && !l.deleted).sort((a, b) => a.position - b.position);
    const complete = (moduleId: string) => published(moduleId).every((l) => done.has(l.id));
    const modules = all
      .filter((m) => m.status === 'Published')
      .sort((a, b) => a.position - b.position)
      .map((module, i): ModuleState => {
        const prereq = all.find((m) => m.id === module.prerequisiteModuleId);
        const locked = !!prereq && prereq.status === 'Published' && !complete(prereq.id);
        let firstNotDone: string | null = null;
        const lessons = published(module.id).map((lesson): LessonState => {
          const isDone = done.has(lesson.id);
          const lessonLocked = !isDone && (locked || firstNotDone !== null);
          const state = {
            lesson,
            done: isDone,
            locked: lessonLocked,
            unlockAfter: lessonLocked ? (locked ? prereq!.title : firstNotDone) : null,
          };
          if (!isDone && firstNotDone === null) firstNotDone = lesson.title;
          return state;
        });
        return {
          module,
          position: i + 1,
          lessons,
          locked,
          unlockAfter: locked ? prereq!.title : null,
        };
      });
    return { track, program, modules };
  }

  private findModule(tracks: TrackState[], moduleId: string): { track: TrackState; module: ModuleState } | null {
    for (const track of tracks) {
      const module = track.modules.find((m) => m.module.id === moduleId);
      if (module) return { track, module };
    }
    return null;
  }

  findLesson(tracks: TrackState[], lessonId: string): { track: TrackState; module: ModuleState; lesson: LessonState } | null {
    for (const track of tracks) {
      for (const module of track.modules) {
        const lesson = module.lessons.find((l) => l.lesson.id === lessonId);
        if (lesson) return { track, module, lesson };
      }
    }
    return null;
  }

  /** GET /learning/home. */
  home(route: Route, membershipId: string, programs: FakeProgram[]): Promise<void> {
    const tracks = this.tracks(membershipId, programs);
    let next = null;
    for (const t of tracks) {
      for (const m of t.modules) {
        const l = m.lessons.find((x) => !x.done && !x.locked);
        if (l && !next) {
          next = {
            lessonId: l.lesson.id,
            kind: l.lesson.kind,
            title: l.lesson.title,
            moduleId: m.module.id,
            moduleTitle: m.module.title,
            reading: l.lesson.reading,
            minutes: l.lesson.minutes,
            moduleCompleted: moduleDone(m),
            moduleTotal: m.lessons.length,
          };
        }
      }
    }
    return route.fulfill({
      json: {
        completedLessons: tracks.reduce((n, t) => n + trackDone(t), 0),
        totalLessons: tracks.reduce((n, t) => n + trackTotal(t), 0),
        next,
        tracks: tracks.map((t) => ({
          id: t.track.id,
          name: t.track.name,
          description: t.track.description,
          program: t.program,
          completedLessons: trackDone(t),
          totalLessons: trackTotal(t),
        })),
      },
    });
  }

  /** GET /learning/tracks/{id}. */
  track(route: Route, membershipId: string, programs: FakeProgram[], id: string): Promise<void> {
    const tracks = this.tracks(membershipId, programs);
    const t = tracks.find((x) => x.track.id === id);
    if (!t) return route.fulfill({ status: 404 });
    return route.fulfill({
      json: {
        id: t.track.id,
        name: t.track.name,
        description: t.track.description,
        completedLessons: trackDone(t),
        totalLessons: trackTotal(t),
        tracks: tracks.map((x) => ({ id: x.track.id, name: x.track.name })),
        modules: t.modules.map((m) => ({
          id: m.module.id,
          title: m.module.title,
          description: m.module.description,
          lessonCount: m.lessons.length,
          completedLessons: moduleDone(m),
          status: moduleStatus(m),
          unlockAfter: m.unlockAfter,
        })),
      },
    });
  }

  /** GET /learning/modules/{id}. */
  module(route: Route, membershipId: string, programs: FakeProgram[], id: string): Promise<void> {
    const found = this.findModule(this.tracks(membershipId, programs), id);
    if (!found) return route.fulfill({ status: 404 });
    const { track, module: m } = found;
    if (m.locked)
      return route.fulfill({
        status: 403,
        json: { code: 'locked', unlockAfter: m.unlockAfter },
      });
    return route.fulfill({
      json: {
        id: m.module.id,
        title: m.module.title,
        description: m.module.description,
        anchor: m.module.anchor,
        trackId: track.track.id,
        trackName: track.track.name,
        position: m.position,
        moduleCount: track.modules.length,
        completedLessons: moduleDone(m),
        status: moduleStatus(m),
        lessons: m.lessons.map((l) => ({
          id: l.lesson.id,
          title: l.lesson.title,
          kind: l.lesson.kind,
          reading: l.lesson.reading,
          minutes: l.lesson.minutes,
          status: lessonStatus(l),
          unlockAfter: l.unlockAfter,
        })),
      },
    });
  }

  /** GET /learning/lessons/{id}: never the leader notes. */
  lesson(route: Route, membershipId: string, programs: FakeProgram[], id: string): Promise<void> {
    const found = this.findLesson(this.tracks(membershipId, programs), id);
    if (!found) return route.fulfill({ status: 404 });
    const { track, module: m, lesson: l } = found;
    if (l.locked) return route.fulfill({ status: 403, json: { code: 'locked', unlockAfter: l.unlockAfter } });
    const index = m.lessons.indexOf(l);
    const next = m.lessons[index + 1]?.lesson ?? null;
    return route.fulfill({
      json: {
        id: l.lesson.id,
        kind: l.lesson.kind,
        title: l.lesson.title,
        reading: l.lesson.reading,
        passage: l.lesson.passage,
        minutes: l.lesson.minutes,
        objectives: l.lesson.objectives,
        body: l.lesson.body,
        prompts: l.lesson.prompts,
        moduleId: m.module.id,
        moduleTitle: m.module.title,
        trackId: track.track.id,
        trackName: track.track.name,
        position: index + 1,
        lessonCount: m.lessons.length,
        hasVideo: !!l.lesson.video,
        done: l.done,
        next: next ? { id: next.id, title: next.title, kind: next.kind } : null,
      },
    });
  }

  /** Answers every complete call with 500, to show the failed state. */
  failCompletes = false;

  /** POST /learning/lessons/{id}/complete: reading and scripture only; once. */
  completeLesson(route: Route, membershipId: string, programs: FakeProgram[], id: string): Promise<void> {
    if (this.failCompletes) return route.fulfill({ status: 500 });
    const found = this.findLesson(this.tracks(membershipId, programs), id);
    if (!found) return route.fulfill({ status: 404 });
    const { module: m, lesson: l } = found;
    if (l.locked) return route.fulfill({ status: 403, json: { code: 'locked', unlockAfter: l.unlockAfter } });
    if (l.lesson.kind === 'Coding' || l.lesson.kind === 'Project') return route.fulfill({ status: 409, json: { code: 'conflict' } });
    this.complete(membershipId, id);
    return route.fulfill({ json: this.after(m, id) });
  }

  /** The next lesson of the module after this one, counting it as done. */
  after(
    m: ModuleState,
    lessonId: string,
  ): { nextLessonId: string | null; nextLessonTitle: string | null; nextLessonKind: string | null; moduleCompleted: boolean } {
    const index = m.lessons.findIndex((x) => x.lesson.id === lessonId);
    const completed = m.lessons.every((x, i) => i === index || x.done);
    const next = m.lessons.slice(index + 1).find((x) => !x.done)?.lesson ?? null;
    return { nextLessonId: next?.id ?? null, nextLessonTitle: next?.title ?? null, nextLessonKind: next?.kind ?? null, moduleCompleted: completed };
  }

  /** Answers every video request with 500, to show the player's failed state. */
  failVideos = false;

  /** GET /learning/lessons/{id}/video: the stored file with range support, only for a lesson the youth may open (ADR 0051). */
  video(route: Route, membershipId: string, programs: FakeProgram[], id: string): Promise<void> {
    if (this.failVideos) return route.fulfill({ status: 500 });
    const found = this.findLesson(this.tracks(membershipId, programs), id);
    if (!found || !found.lesson.lesson.video) return route.fulfill({ status: 404 });
    if (found.lesson.locked) return route.fulfill({ status: 403, json: { code: 'locked', unlockAfter: found.lesson.unlockAfter } });
    const bytes = readFileSync(new URL('./media/lesson.webm', import.meta.url));
    const range = /bytes=(\d+)-(\d*)/.exec(route.request().headers()['range'] ?? '');
    if (!range) return route.fulfill({ status: 200, contentType: 'video/webm', body: bytes, headers: { 'accept-ranges': 'bytes' } });
    const start = Number(range[1]);
    const end = range[2] ? Math.min(Number(range[2]), bytes.length - 1) : bytes.length - 1;
    return route.fulfill({
      status: 206,
      contentType: 'video/webm',
      body: bytes.subarray(start, end + 1),
      headers: { 'accept-ranges': 'bytes', 'content-range': `bytes ${start}-${end}/${bytes.length}` },
    });
  }

  /** Each youth's saved code and ticks, by membership and lesson. */
  private readonly workspaces = new Map<string, { code: string; checked: string[] }>();

  /** Answers every coding save with 500, to show the failed state. */
  failSaves = false;

  /** GET /learning/coding/{id}: coding lessons and projects only. */
  coding(route: Route, membershipId: string, programs: FakeProgram[], id: string): Promise<void> {
    const found = this.findLesson(this.tracks(membershipId, programs), id);
    if (!found || (found.lesson.lesson.kind !== 'Coding' && found.lesson.lesson.kind !== 'Project')) return route.fulfill({ status: 404 });
    const { module: m, lesson: l } = found;
    if (l.locked) return route.fulfill({ status: 403, json: { code: 'locked', unlockAfter: l.unlockAfter } });
    const saved = this.workspaces.get(`${membershipId}:${id}`);
    const index = m.lessons.indexOf(l);
    const next = m.lessons[index + 1]?.lesson ?? null;
    return route.fulfill({
      json: {
        id: l.lesson.id,
        kind: l.lesson.kind,
        title: l.lesson.title,
        body: l.lesson.body,
        minutes: l.lesson.minutes,
        moduleId: m.module.id,
        moduleTitle: m.module.title,
        position: index + 1,
        lessonCount: m.lessons.length,
        steps: l.lesson.steps,
        code: saved?.code ?? l.lesson.starterCode ?? '',
        checkedStepIds: saved?.checked ?? [],
        done: l.done,
        next: next ? { id: next.id, title: next.title, kind: next.kind } : null,
      },
    });
  }

  /** PUT /learning/coding/{id}/progress: saves code and ticks; ticking every step completes a coding lesson. */
  saveCoding(route: Route, membershipId: string, programs: FakeProgram[], id: string): Promise<void> {
    if (this.failSaves) return route.fulfill({ status: 500 });
    const found = this.findLesson(this.tracks(membershipId, programs), id);
    if (!found || (found.lesson.lesson.kind !== 'Coding' && found.lesson.lesson.kind !== 'Project')) return route.fulfill({ status: 404 });
    const { module: m, lesson: l } = found;
    if (l.locked) return route.fulfill({ status: 403, json: { code: 'locked', unlockAfter: l.unlockAfter } });
    const body = route.request().postDataJSON() as { code?: string; checkedStepIds?: string[] };
    const code = body.code ?? '';
    const ticks = [...new Set(body.checkedStepIds ?? [])];
    const stepIds = l.lesson.steps.map((x) => x.id);
    const errors: Record<string, string> = {};
    if (code.length > 50000) errors['code'] = 'Keep your code under 50,000 characters.';
    if (ticks.some((t) => !stepIds.includes(t))) errors['checkedStepIds'] = 'Tick only items of this checklist.';
    if (Object.keys(errors).length) return route.fulfill({ status: 422, json: { errors } });
    this.workspaces.set(`${membershipId}:${id}`, { code, checked: stepIds.filter((x) => ticks.includes(x)) });
    const completes = l.lesson.kind === 'Coding' && stepIds.length > 0 && ticks.length === stepIds.length;
    if (completes) this.complete(membershipId, id);
    const done = completes || l.done;
    const after = done ? this.after(m, id) : null;
    return route.fulfill({
      json: {
        checked: ticks.length,
        total: stepIds.length,
        done,
        nextLessonId: after?.nextLessonId ?? null,
        nextLessonTitle: after?.nextLessonTitle ?? null,
        nextLessonKind: after?.nextLessonKind ?? null,
        moduleCompleted: after?.moduleCompleted ?? false,
      },
    });
  }
}
