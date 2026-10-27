import type { Route } from '@playwright/test';
import type { FakeProgram } from './programs';

export type ContentStatus = 'Draft' | 'InReview' | 'Published';

export interface FakeTrack {
  id: string;
  organizationId: string;
  name: string;
  key: string;
  description: string | null;
  status: ContentStatus;
}

export interface FakeModule {
  id: string;
  organizationId: string;
  trackId: string;
  title: string;
  description: string | null;
  prerequisiteModuleId: string | null;
  anchor: string | null;
  position: number;
  status: ContentStatus;
}

export type LessonKind = 'Reading' | 'Scripture' | 'Coding' | 'Project';

export interface FakeCodingStep {
  id: string;
  title: string;
  instructions: string;
  sample: string | null;
  checkLabel: string;
}

export interface FakeLesson {
  id: string;
  /** Reading, Scripture, Coding or Project (ADR 0051); authoring it is deferred, so authored lessons are Reading. */
  kind: LessonKind;
  /** The passage a scripture lesson quotes. */
  passage: string | null;
  /** Where a coding lesson or project starts. */
  starterCode: string | null;
  steps: FakeCodingStep[];
  organizationId: string;
  moduleId: string;
  title: string;
  reading: string | null;
  minutes: number | null;
  objectives: string[];
  body: string | null;
  prompts: string[];
  leaderNotes: string | null;
  position: number;
  status: ContentStatus;
  deleted: boolean;
  video: { fileName: string; bytes: number; uploadedAt: string; uploadedBy: string } | null;
}

const lesson = (id: string, moduleId: string, title: string, position: number, status: ContentStatus, minutes: number | null, body: string | null = null): FakeLesson => ({
  id,
  kind: 'Reading',
  passage: null,
  starterCode: null,
  steps: [],
  organizationId: 'org-harbourview',
  moduleId,
  title,
  reading: null,
  minutes,
  objectives: [],
  body,
  prompts: [],
  leaderNotes: null,
  position,
  status,
  deleted: false,
  video: null,
});

const clean = (v: string | null | undefined): string | null => (v && v.trim() ? v.trim() : null);
const invalid = (route: Route, field: string, message: string) => route.fulfill({ status: 422, json: { errors: { [field]: message } } });

function keyFrom(name: string): string {
  return name
    .normalize('NFD')
    .toLowerCase()
    .replace(/[^a-z0-9\s_-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/g, '');
}

function sameSet(sent: string[] | undefined, current: string[]): boolean {
  return !!sent && sent.length === current.length && new Set(sent).size === sent.length && sent.every((id) => current.includes(id));
}

/**
 * Curriculum authoring as the API answers it (L2-066, L2-067, ADR 0050): tracks, their ordered modules and lessons. Every call
 * reaches it only after FakeApi checked the Learning module and AuthorCurriculum, and it sees only the caller's organization.
 */
export class FakeCurriculum {
  private nextId = 1;

  /** The organization's programs come from FakeApi; a program follows at most one track (ADR 0050). */
  constructor(private readonly programs: () => FakeProgram[]) {}

  /** Which track each program follows, as seeded: Tutoring and Sports follow Leadership Foundations. */
  readonly programTracks = new Map<string, string>([
    ['p-tutoring', 't-leadership'],
    ['p-sports', 't-leadership'],
  ]);

  private activePrograms(org: string): FakeProgram[] {
    return this.programs()
      .filter((p) => p.organizationId === org && p.status === 'Active')
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  private following(org: string, trackId: string): FakeProgram[] {
    return this.activePrograms(org).filter((p) => this.programTracks.get(p.id) === trackId);
  }
  tracks: FakeTrack[] = [
    {
      id: 't-leadership',
      organizationId: 'org-harbourview',
      name: 'Leadership Foundations',
      key: 'leadership',
      description: 'Growing as a leader at home, at school and in the cohort.',
      status: 'Published',
    },
    {
      id: 't-digital',
      organizationId: 'org-harbourview',
      name: 'Digital Skills',
      key: 'digital',
      description: 'Using technology safely and creatively.',
      status: 'Draft',
    },
  ];
  modules: FakeModule[] = [
    {
      id: 'cm-knowing',
      organizationId: 'org-harbourview',
      trackId: 't-leadership',
      title: 'Knowing Yourself',
      description: 'Strengths, values and the people around you.',
      prerequisiteModuleId: null,
      anchor: null,
      position: 1,
      status: 'Published',
    },
    {
      id: 'cm-serving',
      organizationId: 'org-harbourview',
      trackId: 't-leadership',
      title: 'Leading by Serving',
      description: 'Putting others first and using influence to build people up.',
      prerequisiteModuleId: 'cm-knowing',
      anchor: '“The best leaders are the ones who carry the bags.”',
      position: 2,
      status: 'InReview',
    },
    {
      id: 'cm-speaking',
      organizationId: 'org-harbourview',
      trackId: 't-leadership',
      title: 'Speaking Up',
      description: null,
      prerequisiteModuleId: null,
      anchor: null,
      position: 3,
      status: 'Draft',
    },
    {
      id: 'cm-online',
      organizationId: 'org-harbourview',
      trackId: 't-digital',
      title: 'Staying Safe Online',
      description: null,
      prerequisiteModuleId: null,
      anchor: null,
      position: 1,
      status: 'Draft',
    },
  ];

  lessons: FakeLesson[] = [
    lesson('l-strengths', 'cm-knowing', 'Your Strengths', 1, 'Published', 10, 'Everyone is good at something.'),
    lesson('l-values', 'cm-knowing', 'What Matters to You', 2, 'Published', 12, 'Values are the things you would stand up for.'),
    lesson('l-circle', 'cm-knowing', 'Your Circle', 3, 'Draft', 15),
    {
      ...lesson(
        'l-towel',
        'cm-serving',
        'Pick Up the Towel',
        1,
        'Published',
        12,
        'Leading isn’t a title. It’s noticing what needs doing and doing it, especially when nobody is watching.',
      ),
      reading: 'The captain and the kit bags',
      objectives: ['Notice what needs doing', 'Serve without being asked'],
      prompts: ['Who picked up the towel for you this week?'],
      leaderNotes: 'Watch for youth who find it hard to accept help.',
      video: { fileName: 'pick-up-the-towel.mp4', bytes: 192_937_984, uploadedAt: '2026-11-05T15:20:00Z', uploadedBy: 'Marisol Delgado' },
    },
    lesson('l-line', 'cm-serving', 'Last in Line', 2, 'Draft', 15),
    lesson('l-coach', 'cm-serving', 'Leading Like a Coach', 3, 'Draft', 18),
    lesson('l-voice', 'cm-speaking', 'Finding Your Voice', 1, 'Draft', 10),
    lesson('l-listen', 'cm-speaking', 'Listening First', 2, 'Draft', 10),
  ];

  /**
   * The curriculum Sofía works through in the complete-lessons mocks (prompt 57): Leading by Serving and Speaking Up published in
   * order, Last in Line a scripture lesson, and Digital Skills published with Web Basics (a coding lesson and a project), followed by
   * Saturday Sports, which Sofía joins.
   */
  youthJourney(): void {
    const set = <T>(list: T[], pick: (x: T) => boolean, patch: Partial<T>) => Object.assign(list.find(pick)!, patch);
    set(this.modules, (m) => m.id === 'cm-serving', { status: 'Published' });
    set(this.modules, (m) => m.id === 'cm-speaking', { status: 'Published', prerequisiteModuleId: 'cm-serving', description: 'Saying what you think, kindly and clearly.' });
    set(this.lessons, (l) => l.id === 'l-line', {
      status: 'Published',
      kind: 'Scripture',
      reading: 'Mark 10:35–45',
      passage: '“For even the Son of Man did not come to be served, but to serve, and to give his life as a ransom for many.”',
      body: 'James and John wanted the best seats. Here greatness flips: whoever wants to be great must serve.\n\nThis week, watch for one person you can quietly serve without being asked.',
      objectives: ['What real greatness looks like'],
      prompts: ['Where are you being asked to serve when you’d rather be served?'],
    });
    set(this.lessons, (l) => l.id === 'l-coach', { status: 'Published', body: 'A coach makes everyone around them better.' });
    set(this.lessons, (l) => l.id === 'l-voice', { status: 'Published', body: 'Say what you think, kindly and clearly.' });
    set(this.tracks, (t) => t.id === 't-digital', { status: 'Published' });
    this.modules.push({
      id: 'cm-web',
      organizationId: 'org-harbourview',
      trackId: 't-digital',
      title: 'Web Basics',
      description: 'Every website is just text with tags.',
      prerequisiteModuleId: null,
      anchor: null,
      position: 2,
      status: 'Published',
    });
    this.lessons.push(
      {
        ...lesson('l-webpage', 'cm-web', 'Your First Webpage', 1, 'Published', 20, 'Every website is just text with tags. Let’s build one from scratch.'),
        kind: 'Coding',
        starterCode: '<h1>Change me</h1>\n<p>Write your own line here.</p>',
        steps: [
          {
            id: 's-skeleton',
            title: 'Every page has a skeleton',
            instructions: 'HTML uses tags in angle brackets. A tag that opens must also close.',
            sample: '<!doctype html>\n<html>\n  <body>\n    <h1>Hello!</h1>\n  </body>\n</html>',
            checkLabel: 'I know what an HTML tag is',
          },
          {
            id: 's-heading',
            title: 'Add a heading and a paragraph',
            instructions: 'Use <h1> for a title and <p> for a paragraph.',
            sample: '<h1>Harbourview Youth Night</h1>\n<p>Come build, belong and grow.</p>',
            checkLabel: 'I added a heading and a paragraph',
          },
          { id: 's-run', title: 'Make it yours', instructions: 'Edit the page below and run it.', sample: null, checkLabel: 'I edited the page and ran it' },
        ],
      },
      {
        ...lesson('l-event', 'cm-web', 'Build Your Event Page', 2, 'Published', 40, 'Make a one-page invite for a Harbourview youth night: a big heading, the date and place, and a “Come through” link.'),
        kind: 'Project',
        starterCode: '<h1>Our event</h1>',
      },
    );
    this.programTracks.set('p-sports', 't-digital');
    const sports = this.programs().find((p) => p.id === 'p-sports')!;
    if (!sports.roster.includes('c-sofia')) sports.roster.push('c-sofia');
  }

  /** Removes every track of an organization, for the empty state. */
  clear(organizationId: string): void {
    const ids = new Set(this.tracks.filter((t) => t.organizationId === organizationId).map((t) => t.id));
    this.tracks = this.tracks.filter((t) => !ids.has(t.id));
    this.modules = this.modules.filter((m) => !ids.has(m.trackId));
  }

  private liveLessons(moduleId: string): FakeLesson[] {
    return this.lessons.filter((l) => l.moduleId === moduleId && !l.deleted).sort((a, b) => a.position - b.position);
  }

  private orderedModules(trackId: string): FakeModule[] {
    return this.modules.filter((m) => m.trackId === trackId).sort((a, b) => a.position - b.position);
  }

  /** GET /curriculum. */
  list(route: Route, org: string): Promise<void> {
    const tracks = this.tracks
      .filter((t) => t.organizationId === org)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((t) => ({
        id: t.id,
        name: t.name,
        key: t.key,
        description: t.description,
        status: t.status,
        modules: this.orderedModules(t.id).map((m) => ({
          id: m.id,
          title: m.title,
          status: m.status,
          lessonCount: this.liveLessons(m.id).length,
        })),
        followedBy: this.following(org, t.id).map((p) => ({ id: p.id, name: p.name })),
      }));
    const programs = this.activePrograms(org).map((p) => ({ id: p.id, name: p.name, term: p.term, schedule: p.schedule, trackId: this.programTracks.get(p.id) ?? null }));
    return route.fulfill({ json: { tracks, programs } });
  }

  /** POST /curriculum/tracks. */
  createTrack(route: Route, org: string): Promise<void> {
    const b = route.request().postDataJSON() as {
      name?: string;
      key?: string;
      description?: string;
      publish?: boolean;
    };
    const name = clean(b.name);
    if (!name) return invalid(route, 'name', 'Give the track a name.');
    if (name.length > 80) return invalid(route, 'name', 'Keep the name under 80 characters.');
    const key = clean(b.key) ?? keyFrom(name);
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(key) || key.length > 40) return invalid(route, 'key', 'Use lowercase letters, numbers and hyphens.');
    if (this.tracks.some((t) => t.organizationId === org && t.key === key)) return invalid(route, 'key', 'Another track already uses this key.');
    const id = `t-${this.nextId++}`;
    this.tracks.push({
      id,
      organizationId: org,
      name,
      key,
      description: clean(b.description),
      status: b.publish ? 'Published' : 'Draft',
    });
    return route.fulfill({ status: 201, json: { id } });
  }

  /** PUT /curriculum/tracks/{id}/module-order. */
  reorderModules(route: Route, org: string, trackId: string): Promise<void> {
    if (!this.tracks.some((t) => t.id === trackId && t.organizationId === org)) return route.fulfill({ status: 404 });
    const { moduleIds } = route.request().postDataJSON() as {
      moduleIds?: string[];
    };
    const modules = this.orderedModules(trackId);
    if (
      !sameSet(
        moduleIds,
        modules.map((m) => m.id),
      )
    )
      return invalid(route, 'moduleIds', 'Send every module of the track once.');
    moduleIds!.forEach((id, i) => (modules.find((m) => m.id === id)!.position = i + 1));
    return route.fulfill({ status: 204 });
  }

  /** POST /curriculum/modules. */
  createModule(route: Route, org: string): Promise<void> {
    const b = route.request().postDataJSON() as {
      trackId: string;
      title?: string;
      description?: string;
    };
    if (!this.tracks.some((t) => t.id === b.trackId && t.organizationId === org)) return route.fulfill({ status: 404 });
    const title = clean(b.title);
    if (!title) return invalid(route, 'title', 'Give the module a name.');
    const id = `cm-${this.nextId++}`;
    this.modules.push({
      id,
      organizationId: org,
      trackId: b.trackId,
      title,
      description: clean(b.description),
      prerequisiteModuleId: null,
      anchor: null,
      position: this.orderedModules(b.trackId).length + 1,
      status: 'Draft',
    });
    return route.fulfill({ status: 201, json: { id } });
  }

  private module(org: string, id: string): FakeModule | undefined {
    return this.modules.find((m) => m.id === id && m.organizationId === org);
  }

  /** GET /curriculum/modules/{id}. */
  getModule(route: Route, org: string, id: string): Promise<void> {
    const m = this.module(org, id);
    if (!m) return route.fulfill({ status: 404 });
    const track = this.tracks.find((t) => t.id === m.trackId)!;
    const siblings = this.orderedModules(m.trackId);
    return route.fulfill({
      json: {
        id: m.id,
        trackId: track.id,
        trackName: track.name,
        title: m.title,
        description: m.description,
        prerequisiteModuleId: m.prerequisiteModuleId,
        anchor: m.anchor,
        status: m.status,
        position: m.position,
        moduleCount: siblings.length,
        earlierModules: siblings.filter((s) => s.position < m.position).map((s) => ({ id: s.id, title: s.title })),
        lessons: this.liveLessons(m.id).map((l) => ({ id: l.id, title: l.title, minutes: l.minutes, status: l.status })),
        programs: this.following(org, track.id).map((p) => p.name),
      },
    });
  }

  /** PUT /curriculum/modules/{id}. */
  updateModule(route: Route, org: string, id: string): Promise<void> {
    const m = this.module(org, id);
    if (!m) return route.fulfill({ status: 404 });
    const b = route.request().postDataJSON() as {
      title?: string;
      description?: string;
      prerequisiteModuleId?: string | null;
      anchor?: string;
    };
    const title = clean(b.title);
    if (!title) return invalid(route, 'title', 'Give the module a name.');
    const prerequisite = b.prerequisiteModuleId ?? null;
    if (prerequisite && !this.modules.some((x) => x.id === prerequisite && x.trackId === m.trackId && x.position < m.position)) {
      return invalid(route, 'prerequisiteModuleId', 'Choose a module that comes before this one.');
    }
    Object.assign(m, {
      title,
      description: clean(b.description),
      prerequisiteModuleId: prerequisite,
      anchor: clean(b.anchor),
    });
    return route.fulfill({ status: 204 });
  }

  /** PUT /curriculum/tracks/{id}/status. */
  setTrackStatus(route: Route, org: string, id: string): Promise<void> {
    const t = this.tracks.find((x) => x.id === id && x.organizationId === org);
    if (!t) return route.fulfill({ status: 404 });
    const { status } = route.request().postDataJSON() as { status: ContentStatus };
    if (status !== 'Draft' && status !== 'Published') return invalid(route, 'status', 'Choose Draft or Published.');
    t.status = status;
    return route.fulfill({ status: 204 });
  }

  /** PUT /curriculum/modules/{id}/status. */
  setModuleStatus(route: Route, org: string, id: string): Promise<void> {
    const m = this.module(org, id);
    if (!m) return route.fulfill({ status: 404 });
    const { status } = route.request().postDataJSON() as { status: ContentStatus };
    if (!['Draft', 'InReview', 'Published'].includes(status)) return invalid(route, 'status', 'Choose Draft, In review or Published.');
    if (status === 'Published' && this.liveLessons(id).length === 0) return invalid(route, 'status', 'Add a lesson before publishing the module.');
    m.status = status;
    return route.fulfill({ status: 204 });
  }

  /** PUT /curriculum/modules/{id}/lesson-order. */
  reorderLessons(route: Route, org: string, id: string): Promise<void> {
    if (!this.module(org, id)) return route.fulfill({ status: 404 });
    const { lessonIds } = route.request().postDataJSON() as { lessonIds?: string[] };
    const lessons = this.liveLessons(id);
    if (
      !sameSet(
        lessonIds,
        lessons.map((l) => l.id),
      )
    )
      return invalid(route, 'lessonIds', 'Send every lesson of the module once.');
    lessonIds!.forEach((lid, i) => (lessons.find((l) => l.id === lid)!.position = i + 1));
    return route.fulfill({ status: 204 });
  }

  /** POST /curriculum/lessons. */
  createLesson(route: Route, org: string): Promise<void> {
    const b = route.request().postDataJSON() as { moduleId: string; title?: string };
    if (!this.module(org, b.moduleId)) return route.fulfill({ status: 404 });
    const title = clean(b.title);
    if (!title) return invalid(route, 'title', 'Give the lesson a title.');
    const id = `l-${this.nextId++}`;
    this.lessons.push({ ...lesson(id, b.moduleId, title, this.liveLessons(b.moduleId).length + 1, 'Draft', null), organizationId: org });
    return route.fulfill({ status: 201, json: { id } });
  }

  private lesson(org: string, id: string): FakeLesson | undefined {
    return this.lessons.find((l) => l.id === id && l.organizationId === org && !l.deleted);
  }

  /** GET /curriculum/lessons/{id}. */
  getLesson(route: Route, org: string, id: string): Promise<void> {
    const l = this.lesson(org, id);
    if (!l) return route.fulfill({ status: 404 });
    const m = this.modules.find((x) => x.id === l.moduleId)!;
    const t = this.tracks.find((x) => x.id === m.trackId)!;
    return route.fulfill({
      json: {
        id: l.id,
        moduleId: m.id,
        moduleTitle: m.title,
        trackId: t.id,
        trackName: t.name,
        title: l.title,
        reading: l.reading,
        minutes: l.minutes,
        objectives: l.objectives,
        body: l.body,
        prompts: l.prompts,
        leaderNotes: l.leaderNotes,
        status: l.status,
        position: l.position,
        lessonCount: this.liveLessons(m.id).length,
        video: l.video,
        programs: this.following(org, t.id).map((p) => p.name),
      },
    });
  }

  /** PUT /curriculum/lessons/{id}. */
  updateLesson(route: Route, org: string, id: string): Promise<void> {
    const l = this.lesson(org, id);
    if (!l) return route.fulfill({ status: 404 });
    const b = route.request().postDataJSON() as {
      title?: string;
      reading?: string;
      minutes?: number | null;
      objectives?: string[];
      body?: string;
      prompts?: string[];
      leaderNotes?: string;
    };
    const errors: Record<string, string> = {};
    const title = clean(b.title);
    if (!title) errors['title'] = 'Give the lesson a title.';
    if (b.minutes !== null && b.minutes !== undefined && (b.minutes < 1 || b.minutes > 600)) errors['minutes'] = 'Estimate between 1 and 600 minutes.';
    const lines = (v: string[] | undefined) => (v ?? []).map((x) => x.trim()).filter(Boolean);
    if (lines(b.objectives).length > 10) errors['objectives'] = 'Keep it to 10 lines.';
    if (lines(b.prompts).length > 10) errors['prompts'] = 'Keep it to 10 lines.';
    if (Object.keys(errors).length) return route.fulfill({ status: 422, json: { errors } });
    Object.assign(l, {
      title,
      reading: clean(b.reading),
      minutes: b.minutes ?? null,
      objectives: lines(b.objectives),
      body: clean(b.body),
      prompts: lines(b.prompts),
      leaderNotes: clean(b.leaderNotes),
    });
    return route.fulfill({ status: 204 });
  }

  /** PUT /curriculum/lessons/{id}/status. */
  setLessonStatus(route: Route, org: string, id: string): Promise<void> {
    const l = this.lesson(org, id);
    if (!l) return route.fulfill({ status: 404 });
    const { status } = route.request().postDataJSON() as { status: ContentStatus };
    if (status !== 'Draft' && status !== 'Published') return invalid(route, 'status', 'Choose Draft or Published.');
    if (status === 'Published' && !l.body) return invalid(route, 'status', 'Add teaching content before publishing.');
    l.status = status;
    return route.fulfill({ status: 204 });
  }

  /** DELETE /curriculum/lessons/{id}: soft delete; the rest close up. */
  deleteLesson(route: Route, org: string, id: string): Promise<void> {
    const l = this.lesson(org, id);
    if (!l) return route.fulfill({ status: 404 });
    l.deleted = true;
    this.liveLessons(l.moduleId).forEach((x, i) => (x.position = i + 1));
    return route.fulfill({ status: 204 });
  }

  private held: Promise<void> | null = null;

  /** Holds every video upload until the returned function is called, to show the uploading state. */
  holdUploads(): () => void {
    let release!: () => void;
    this.held = new Promise<void>((resolve) => (release = resolve));
    return () => {
      this.held = null;
      release();
    };
  }

  /** POST /curriculum/lessons/{id}/video: one multipart file, checked by extension, content type and first bytes (L2-067 criteria 7 and 8). */
  async uploadVideo(route: Route, org: string, id: string, by: string): Promise<void> {
    const l = this.lesson(org, id);
    if (!l) return route.fulfill({ status: 404 });
    if (this.held) await this.held;
    const body = route.request().postDataBuffer() ?? Buffer.alloc(0);
    const text = body.toString('latin1');
    const fileName = /filename="([^"]*)"/.exec(text)?.[1] ?? '';
    const contentType = /Content-Type: ([^\r\n]+)/i.exec(text.slice(text.indexOf('filename=')))?.[1]?.trim() ?? '';
    const start = text.indexOf('\r\n\r\n', text.indexOf('filename=')) + 4;
    const end = text.indexOf('\r\n--', start);
    const bytes = body.subarray(start, end);
    const ext = fileName.slice(fileName.lastIndexOf('.')).toLowerCase();
    const types: Record<string, string[]> = { '.mp4': ['video/mp4'], '.mov': ['video/quicktime', 'video/mp4'], '.webm': ['video/webm'] };
    const signed = ext === '.webm' ? bytes.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3])) : bytes.subarray(4, 8).toString('latin1') === 'ftyp';
    if (!types[ext]?.includes(contentType) || bytes.length < 1 || !signed) return invalid(route, 'file', 'Choose an MP4, MOV or WebM video of up to 1 GB.');
    l.video = { fileName, bytes: bytes.length, uploadedAt: '2026-11-05T21:12:00Z', uploadedBy: by };
    return route.fulfill({ status: 201, json: l.video });
  }

  /** DELETE /curriculum/lessons/{id}/video. */
  removeVideo(route: Route, org: string, id: string): Promise<void> {
    const l = this.lesson(org, id);
    if (!l?.video) return route.fulfill({ status: 404 });
    l.video = null;
    return route.fulfill({ status: 204 });
  }

  /** PUT /curriculum/tracks/{id}/cohorts: chosen active programs follow the track, the rest that did follow none. */
  setCohorts(route: Route, org: string, id: string): Promise<void> {
    if (!this.tracks.some((t) => t.id === id && t.organizationId === org)) return route.fulfill({ status: 404 });
    const { programIds } = route.request().postDataJSON() as { programIds: string[] };
    const active = this.activePrograms(org).map((p) => p.id);
    if (new Set(programIds).size !== programIds.length || !programIds.every((p) => active.includes(p))) {
      return invalid(route, 'programIds', 'Choose active programs of your organization.');
    }
    active.forEach((p) => {
      if (programIds.includes(p)) this.programTracks.set(p, id);
      else if (this.programTracks.get(p) === id) this.programTracks.delete(p);
    });
    return route.fulfill({ status: 204 });
  }
}
