// Screen recordings and screenshots for video 57, made with tools/video-record/record-clips.mjs against the
// running frontend. The backend is faked like the e2e suite: Sofía Rivera (Youth, Harbourview, consent given, in
// After-School Tutoring and Saturday Sports) works through Leadership Foundations and Digital Skills (L2-068 to L2-070).
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const shots = join(here, '..', 'shots');
const VIDEO = readFileSync(join(here, '..', '..', '..', '..', 'e2e', 'fixtures', 'media', 'lesson.webm'));
const ON = ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports', 'Learning'];

function seed() {
  const lesson = (id, moduleId, title, position, kind, minutes, body, extra = {}) => ({
    id, moduleId, title, position, kind, minutes, body, reading: null, passage: null, objectives: [], prompts: [], video: false, starterCode: null, steps: [], ...extra,
  });
  return {
    tracks: [
      { id: 't-leadership', name: 'Leadership Foundations', description: 'Growing as a leader at home, at school and in the cohort.', program: 'After-School Tutoring' },
      { id: 't-digital', name: 'Digital Skills', description: 'Using technology safely and creatively.', program: 'Saturday Sports' },
    ],
    modules: [
      { id: 'cm-knowing', trackId: 't-leadership', title: 'Knowing Yourself', description: 'Strengths, values and the people around you.', prerequisite: null, anchor: null },
      { id: 'cm-serving', trackId: 't-leadership', title: 'Leading by Serving', description: 'Putting others first and using influence to build people up.', prerequisite: 'cm-knowing', anchor: '“The best leaders are the ones who carry the bags.”' },
      { id: 'cm-speaking', trackId: 't-leadership', title: 'Speaking Up', description: 'Saying what you think, kindly and clearly.', prerequisite: 'cm-serving', anchor: null },
      { id: 'cm-web', trackId: 't-digital', title: 'Web Basics', description: 'Every website is just text with tags.', prerequisite: null, anchor: null },
    ],
    lessons: [
      lesson('l-strengths', 'cm-knowing', 'Your Strengths', 1, 'Reading', 10, 'Everyone is good at something.'),
      lesson('l-values', 'cm-knowing', 'What Matters to You', 2, 'Reading', 12, 'Values are the things you would stand up for.'),
      lesson('l-towel', 'cm-serving', 'Pick Up the Towel', 1, 'Reading', 12,
        'The night before the big game, the team captain stayed behind to pack the kit bags while everyone else went home. Nobody asked her to.\n\nLeading isn’t a title. It’s noticing what needs doing and doing it, especially when nobody is watching.',
        { reading: 'The captain and the kit bags', objectives: ['Notice what needs doing', 'Serve without being asked'], prompts: ['Who picked up the towel for you this week?'], video: true }),
      lesson('l-line', 'cm-serving', 'Last in Line', 2, 'Scripture', 15,
        'James and John wanted the best seats. Here greatness flips: whoever wants to be great must serve.\n\nThis week, watch for one person you can quietly serve without being asked.',
        { reading: 'Mark 10:35–45', passage: '“For even the Son of Man did not come to be served, but to serve, and to give his life as a ransom for many.”', prompts: ['Where are you being asked to serve when you’d rather be served?'] }),
      lesson('l-coach', 'cm-serving', 'Leading Like a Coach', 3, 'Reading', 18, 'A coach makes everyone around them better.'),
      lesson('l-voice', 'cm-speaking', 'Finding Your Voice', 1, 'Reading', 10, 'Say what you think, kindly and clearly.'),
      lesson('l-webpage', 'cm-web', 'Your First Webpage', 1, 'Coding', 20, 'Every website is just text with tags. Let’s build one from scratch.', {
        starterCode: '<h1>Change me</h1>\n<p>Write your own line here.</p>',
        steps: [
          { id: 's-skeleton', title: 'Every page has a skeleton', instructions: 'HTML uses tags in angle brackets. A tag that opens must also close.', sample: '<!doctype html>\n<html>\n  <body>\n    <h1>Hello!</h1>\n  </body>\n</html>', checkLabel: 'I know what an HTML tag is' },
          { id: 's-heading', title: 'Add a heading and a paragraph', instructions: 'Use <h1> for a title and <p> for a paragraph.', sample: '<h1>Harbourview Youth Night</h1>\n<p>Come build, belong and grow.</p>', checkLabel: 'I added a heading and a paragraph' },
          { id: 's-run', title: 'Make it yours', instructions: 'Edit the page below and run it.', sample: null, checkLabel: 'I edited the page and ran it' },
        ],
      }),
      lesson('l-event', 'cm-web', 'Build Your Event Page', 2, 'Project', 40, 'Make a one-page invite for a Harbourview youth night: a big heading, the date and place, and a “Come through” link.', { starterCode: '<h1>Our event</h1>' }),
    ],
  };
}

const newState = (done = []) => ({ data: seed(), modules: ON, done: new Set(done), workspaces: new Map(), submissions: new Map(), failNext: null, failVideo: false });

/** Module and lesson statuses for Sofía, as LearnerProgress computes them (ADR 0051). */
function statuses(state, trackId) {
  const d = state.data;
  const lessonsOf = (m) => d.lessons.filter((l) => l.moduleId === m).sort((a, b) => a.position - b.position);
  const complete = (m) => lessonsOf(m).every((l) => state.done.has(l.id));
  return d.modules.filter((m) => m.trackId === trackId).map((m, i) => {
    const prereq = d.modules.find((x) => x.id === m.prerequisite);
    const locked = !!prereq && !complete(prereq.id);
    let first = null;
    const lessons = lessonsOf(m.id).map((l) => {
      const done = state.done.has(l.id);
      const lk = !done && (locked || first !== null);
      const s = { l, done, locked: lk, unlockAfter: lk ? (locked ? prereq.title : first) : null };
      if (!done && first === null) first = l.title;
      return s;
    });
    const n = lessons.filter((x) => x.done).length;
    const status = locked ? 'locked' : lessons.length && n === lessons.length ? 'done' : n ? 'in-progress' : 'not-started';
    return { m, position: i + 1, lessons, locked, unlockAfter: locked ? prereq.title : null, n, status };
  });
}

function find(state, lessonId) {
  for (const t of state.data.tracks) for (const m of statuses(state, t.id)) for (const s of m.lessons) if (s.l.id === lessonId) return { t, m, s };
  return null;
}

/** The Learning API as the real one answers Sofía; `state` holds her progress, the modules and a pending failure. */
async function fakeApi(demo, state) {
  await demo.page.route('**/api/**', async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const method = request.method();
    if (state.failNext && path === state.failNext) {
      state.failNext = null;
      return route.fulfill({ status: 500, json: { code: 'server-error', reference: 'ERR-3L9P' } });
    }
    if (path === '/api/me') return route.fulfill({ json: { personName: 'Sofía Rivera', role: 'Youth', organizationId: 'org-harbourview', organizationName: 'Harbourview Youth Collective', plan: 'Standard', modules: state.modules } });
    if (path === '/api/notifications') return route.fulfill({ json: { unread: 0, items: [] } });
    if (path === '/api/me/organizations') return route.fulfill({ json: { organizations: [] } });
    if (path.startsWith('/api/learning') && !state.modules.includes('Learning')) return route.fulfill({ status: 404 });
    if (path === '/api/learning/onboarding') {
      return route.fulfill({ json: { status: 'completed', step: 3, preferredName: 'Sofía', pronouns: 'she/her', lessonReminders: true, mentorMessages: true, announcements: false, program: { name: 'After-School Tutoring', schedule: 'Mon–Thu, 4–6 pm', startsOn: '2026-09-08', endsOn: '2027-06-24' } } });
    }
    const d = state.data;
    const ref = (l) => (l ? { id: l.id, title: l.title, kind: l.kind } : null);
    if (path === '/api/learning/home') {
      let next = null;
      const tracks = d.tracks.map((t) => {
        const ms = statuses(state, t.id);
        for (const m of ms) {
          const s = m.lessons.find((x) => !x.done && !x.locked);
          if (s && !next) next = { lessonId: s.l.id, kind: s.l.kind, title: s.l.title, moduleId: m.m.id, moduleTitle: m.m.title, reading: s.l.reading, minutes: s.l.minutes, moduleCompleted: m.n, moduleTotal: m.lessons.length };
        }
        return { id: t.id, name: t.name, description: t.description, program: t.program, completedLessons: ms.reduce((a, m) => a + m.n, 0), totalLessons: ms.reduce((a, m) => a + m.lessons.length, 0) };
      });
      return route.fulfill({ json: { completedLessons: tracks.reduce((a, t) => a + t.completedLessons, 0), totalLessons: tracks.reduce((a, t) => a + t.totalLessons, 0), next, tracks } });
    }
    let m;
    if ((m = /^\/api\/learning\/tracks\/([^/]+)$/.exec(path))) {
      const t = d.tracks.find((x) => x.id === m[1]);
      if (!t) return route.fulfill({ status: 404 });
      const ms = statuses(state, t.id);
      return route.fulfill({
        json: {
          id: t.id, name: t.name, description: t.description,
          completedLessons: ms.reduce((a, x) => a + x.n, 0), totalLessons: ms.reduce((a, x) => a + x.lessons.length, 0),
          tracks: d.tracks.map((x) => ({ id: x.id, name: x.name })),
          modules: ms.map((x) => ({ id: x.m.id, title: x.m.title, description: x.m.description, lessonCount: x.lessons.length, completedLessons: x.n, status: x.status, unlockAfter: x.unlockAfter })),
        },
      });
    }
    if ((m = /^\/api\/learning\/modules\/([^/]+)$/.exec(path))) {
      const mod = d.modules.find((x) => x.id === m[1]);
      if (!mod) return route.fulfill({ status: 404 });
      const ms = statuses(state, mod.trackId);
      const s = ms.find((x) => x.m.id === mod.id);
      if (s.locked) return route.fulfill({ status: 403, json: { code: 'locked', unlockAfter: s.unlockAfter } });
      const t = d.tracks.find((x) => x.id === mod.trackId);
      return route.fulfill({
        json: {
          id: mod.id, title: mod.title, description: mod.description, anchor: mod.anchor, trackId: t.id, trackName: t.name, position: s.position, moduleCount: ms.length,
          completedLessons: s.n, status: s.status,
          lessons: s.lessons.map((x) => ({ id: x.l.id, title: x.l.title, kind: x.l.kind, reading: x.l.reading, minutes: x.l.minutes, status: x.done ? 'done' : x.locked ? 'locked' : 'next', unlockAfter: x.unlockAfter })),
        },
      });
    }
    if ((m = /^\/api\/learning\/lessons\/([^/]+)\/video$/.exec(path))) {
      const f = find(state, m[1]);
      if (state.failVideo || !f?.s.l.video) return route.fulfill({ status: state.failVideo ? 500 : 404 });
      const range = /bytes=(\d+)-(\d*)/.exec(request.headers()['range'] ?? '');
      if (!range) return route.fulfill({ status: 200, contentType: 'video/webm', body: VIDEO });
      const start = Number(range[1]);
      const end = range[2] ? Math.min(Number(range[2]), VIDEO.length - 1) : VIDEO.length - 1;
      return route.fulfill({ status: 206, contentType: 'video/webm', body: VIDEO.subarray(start, end + 1), headers: { 'accept-ranges': 'bytes', 'content-range': `bytes ${start}-${end}/${VIDEO.length}` } });
    }
    const after = (mod, id) => {
      const i = mod.lessons.findIndex((x) => x.l.id === id);
      const next = mod.lessons.slice(i + 1).find((x) => !x.done)?.l ?? null;
      return { nextLessonId: next?.id ?? null, nextLessonTitle: next?.title ?? null, nextLessonKind: next?.kind ?? null, moduleCompleted: mod.lessons.every((x, j) => j === i || x.done) };
    };
    if ((m = /^\/api\/learning\/lessons\/([^/]+)\/complete$/.exec(path))) {
      const f = find(state, m[1]);
      state.done.add(m[1]);
      return route.fulfill({ json: after(f.m, m[1]) });
    }
    if ((m = /^\/api\/learning\/lessons\/([^/]+)$/.exec(path))) {
      const f = find(state, m[1]);
      if (!f) return route.fulfill({ status: 404 });
      if (f.s.locked) return route.fulfill({ status: 403, json: { code: 'locked', unlockAfter: f.s.unlockAfter } });
      const l = f.s.l;
      const i = f.m.lessons.indexOf(f.s);
      return route.fulfill({
        json: {
          id: l.id, kind: l.kind, title: l.title, reading: l.reading, passage: l.passage, minutes: l.minutes, objectives: l.objectives, body: l.body, prompts: l.prompts,
          moduleId: f.m.m.id, moduleTitle: f.m.m.title, trackId: f.t.id, trackName: f.t.name, position: i + 1, lessonCount: f.m.lessons.length,
          hasVideo: l.video, done: f.s.done, next: ref(f.m.lessons[i + 1]?.l),
        },
      });
    }
    if ((m = /^\/api\/learning\/coding\/([^/]+)\/progress$/.exec(path)) && method === 'PUT') {
      const f = find(state, m[1]);
      const b = request.postDataJSON();
      state.workspaces.set(m[1], { code: b.code, checked: b.checkedStepIds });
      const steps = f.s.l.steps.map((x) => x.id);
      const completes = f.s.l.kind === 'Coding' && steps.length && b.checkedStepIds.length === steps.length;
      if (completes) state.done.add(m[1]);
      const done = completes || f.s.done;
      return route.fulfill({ json: { checked: b.checkedStepIds.length, total: steps.length, done, ...(done ? after(f.m, m[1]) : { nextLessonId: null, nextLessonTitle: null, nextLessonKind: null, moduleCompleted: false }) } });
    }
    if ((m = /^\/api\/learning\/coding\/([^/]+)\/submission$/.exec(path))) {
      const b = request.postDataJSON();
      state.submissions.set(m[1], { code: b.code, note: b.note, submittedAt: '2026-11-05T21:12:00Z' });
      state.done.add(m[1]);
      return route.fulfill({ status: 201, json: { id: 'sub-1' } });
    }
    if ((m = /^\/api\/learning\/coding\/([^/]+)$/.exec(path))) {
      const f = find(state, m[1]);
      if (!f) return route.fulfill({ status: 404 });
      if (f.s.locked) return route.fulfill({ status: 403, json: { code: 'locked', unlockAfter: f.s.unlockAfter } });
      const l = f.s.l;
      const i = f.m.lessons.indexOf(f.s);
      const w = state.workspaces.get(l.id);
      const sub = state.submissions.get(l.id);
      return route.fulfill({
        json: {
          id: l.id, kind: l.kind, title: l.title, body: l.body, minutes: l.minutes, moduleId: f.m.m.id, moduleTitle: f.m.m.title, position: i + 1, lessonCount: f.m.lessons.length,
          steps: l.steps, code: sub?.code ?? w?.code ?? l.starterCode ?? '', checkedStepIds: w?.checked ?? [], done: f.s.done,
          submission: sub ? { status: 'Submitted', submittedAt: sub.submittedAt, note: sub.note } : null, next: ref(f.m.lessons[i + 1]?.l),
        },
      });
    }
    return route.fulfill({ status: 404 });
  });
}

const heading = (demo, level, name) => demo.app().getByRole('heading', { level, name }).first().waitFor();
const shot = (demo, name) => demo.page.locator('iframe').screenshot({ path: join(shots, `${name}.png`) });
const dialog = (demo) => demo.app().getByRole('dialog');

export default [
  {
    // Sofía opens Learning, then her track, then switches to Digital Skills.
    name: 'home-desktop',
    run: async (demo) => {
      const state = newState(['l-strengths', 'l-values']);
      await fakeApi(demo, state);
      await demo.go('/learning', { ready: false });
      await heading(demo, 2, 'Your tracks');
      demo.mark();
      await demo.pause(2600);
      await shot(demo, 'desktop-home');
      await demo.click(demo.app().getByRole('link', { name: /^Leadership Foundations/ }));
      await heading(demo, 1, 'Leadership Foundations');
      await demo.pause(2600);
      await shot(demo, 'desktop-track');
      await demo.click(demo.app().getByRole('button', { name: 'Digital Skills' }));
      await heading(demo, 1, 'Digital Skills');
      await demo.pause(2000);
      await shot(demo, 'desktop-digital');
    },
  },
  {
    // Leading by Serving, Pick Up the Towel with its video, Mark complete, then the scripture lesson Last in Line.
    name: 'lesson-desktop',
    run: async (demo) => {
      const state = newState(['l-strengths', 'l-values']);
      await fakeApi(demo, state);
      await demo.go('/learning/modules/cm-serving', { ready: false });
      await heading(demo, 1, 'Leading by Serving');
      demo.mark();
      await demo.pause(2400);
      await shot(demo, 'desktop-module');
      await demo.click(demo.app().getByRole('link', { name: /^1\. Pick Up the Towel/ }));
      await heading(demo, 1, 'Pick Up the Towel');
      await demo.app().locator('video').evaluate((v) => v.play());
      await demo.pause(3200);
      await shot(demo, 'desktop-lesson-video');
      await demo.click(demo.app().getByRole('button', { name: 'Mark complete' }));
      await demo.app().locator('ph-alert').filter({ hasText: 'Lesson complete' }).waitFor();
      await demo.pause(2200);
      await shot(demo, 'desktop-lesson-complete');
      await demo.click(demo.app().getByRole('link', { name: 'Next: Last in Line' }));
      await heading(demo, 1, 'Last in Line');
      await demo.pause(1600);
      await shot(demo, 'desktop-scripture');
      await demo.click(demo.app().getByRole('button', { name: 'A+ larger text' }));
      await demo.pause(1600);
      await shot(demo, 'desktop-scripture-large');
      await demo.click(demo.app().getByRole('button', { name: 'Mark complete' }));
      await demo.app().locator('ph-alert').filter({ hasText: 'Leading Like a Coach is unlocked' }).waitFor();
      await demo.pause(2000);
    },
  },
  {
    // Your First Webpage: write, run, tick, save; then the project, submitted with a note.
    name: 'coding-desktop',
    run: async (demo) => {
      const state = newState();
      await fakeApi(demo, state);
      await demo.go('/learning/coding/l-webpage', { ready: false });
      await heading(demo, 1, 'Your First Webpage');
      demo.mark();
      await demo.pause(2200);
      await shot(demo, 'desktop-coding');
      const editor = demo.app().getByRole('textbox', { name: 'Try it yourself' });
      await editor.scrollIntoViewIfNeeded();
      await editor.fill('');
      await demo.type(editor, '<h1>Harbourview Youth Night</h1>\n<p>Fridays at 7, at the Community Centre.</p>');
      await demo.click(demo.app().getByRole('button', { name: 'Run' }));
      await demo.pause(2000);
      await shot(demo, 'desktop-coding-ran');
      for (const item of ['I know what an HTML tag is', 'I added a heading and a paragraph', 'I edited the page and ran it']) {
        await demo.click(demo.app().getByRole('checkbox', { name: item }));
      }
      await demo.click(demo.app().getByRole('button', { name: 'Save progress' }));
      await demo.app().locator('ph-alert').filter({ hasText: 'Lesson complete' }).waitFor();
      await demo.pause(2000);
      await shot(demo, 'desktop-coding-complete');
      await demo.click(demo.app().getByRole('link', { name: 'Next: Build Your Event Page' }));
      await heading(demo, 1, 'Build Your Event Page');
      await demo.pause(1200);
      const page = demo.app().getByRole('textbox', { name: 'Your page' });
      await page.fill('');
      await demo.type(page, '<h1>Harbourview Youth Night</h1>\n<p>Friday 13 November, 7 pm</p>\n<a href="#">Come through</a>');
      await demo.click(demo.app().getByRole('button', { name: 'Run' }));
      await demo.pause(1400);
      await demo.click(demo.app().getByRole('button', { name: 'Submit for review' }));
      await dialog(demo).waitFor();
      await demo.type(dialog(demo).getByLabel(/Note to your mentor/), 'My first page with a real link!');
      await demo.pause(800);
      await shot(demo, 'desktop-submit-dialog');
      await demo.click(dialog(demo).getByRole('button', { name: 'Submit for review' }));
      await demo.app().locator('ph-alert').filter({ hasText: 'Sent for review' }).waitFor();
      await demo.pause(2200);
      await shot(demo, 'desktop-project-submitted');
    },
  },
  {
    // On a phone: Learning, a locked module, and the scripture lesson.
    name: 'phone',
    phone: true,
    run: async (demo) => {
      const state = newState(['l-strengths', 'l-values', 'l-towel']);
      await fakeApi(demo, state);
      await demo.go('/learning', { ready: false });
      await heading(demo, 2, 'Your tracks');
      demo.mark();
      await demo.pause(1800);
      await shot(demo, 'phone-home');
      await demo.go('/learning/modules/cm-speaking', { ready: false });
      await heading(demo, 2, 'Finish Leading by Serving first');
      await demo.pause(1800);
      await shot(demo, 'phone-locked');
      await demo.go('/learning/lessons/l-line', { ready: false });
      await heading(demo, 1, 'Last in Line');
      await demo.pause(1800);
      await shot(demo, 'phone-scripture');
    },
  },
  {
    // Nothing published yet, a failed load, a video that fails, and Learning off.
    name: 'states-desktop',
    run: async (demo) => {
      const state = newState(['l-strengths', 'l-values']);
      await fakeApi(demo, state);
      const saved = state.data;
      state.data = { ...saved, tracks: [] };
      await demo.go('/learning', { ready: false });
      await heading(demo, 2, 'No lessons yet');
      demo.mark();
      await demo.pause(1800);
      await shot(demo, 'desktop-empty');
      state.data = saved;
      state.failNext = '/api/learning/home';
      await demo.go('/learning', { ready: false });
      await heading(demo, 2, 'We couldn’t load your lessons');
      await demo.pause(1600);
      await shot(demo, 'desktop-error');
      await demo.click(demo.app().getByRole('button', { name: 'Try again' }));
      await heading(demo, 2, 'Your tracks');
      await demo.pause(1000);
      state.failVideo = true;
      await demo.go('/learning/lessons/l-towel', { ready: false });
      await demo.app().getByText('The video couldn’t load').waitFor();
      await demo.pause(1800);
      await shot(demo, 'desktop-video-failed');
      state.modules = ON.filter((x) => x !== 'Learning');
      await demo.go('/learning/lessons/l-towel', { ready: false });
      await demo.page.waitForTimeout(1500);
      await demo.pause(1400);
      await shot(demo, 'desktop-learning-off');
    },
  },
];
