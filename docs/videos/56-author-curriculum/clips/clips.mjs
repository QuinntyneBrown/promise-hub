// Screen recordings and screenshots for video 56, made with tools/video-record/record-clips.mjs against the
// running frontend. The backend is faked like the e2e suite: Marisol Delgado (Program director, Harbourview)
// authors Leadership Foundations and the draft Digital Skills (L2-066, L2-067).
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const shots = join(dirname(fileURLToPath(import.meta.url)), '..', 'shots');
const ON = ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports', 'Learning'];
const MP4 = Buffer.concat([Buffer.from([0, 0, 0, 0x18]), Buffer.from('ftypisom'), Buffer.alloc(4096, 7)]);
const PDF = Buffer.from('%PDF-1.7 weekly schedule');

function seed() {
  const lesson = (id, moduleId, title, position, status, minutes, body = null, extra = {}) =>
    ({ id, moduleId, title, reading: null, minutes, objectives: [], body, prompts: [], leaderNotes: null, position, status, deleted: false, video: null, ...extra });
  return {
    tracks: [
      { id: 't-leadership', name: 'Leadership Foundations', key: 'leadership', description: 'Growing as a leader at home, at school and in the cohort.', status: 'Published' },
      { id: 't-digital', name: 'Digital Skills', key: 'digital', description: 'Using technology safely and creatively.', status: 'Draft' },
    ],
    modules: [
      { id: 'cm-knowing', trackId: 't-leadership', title: 'Knowing Yourself', description: 'Strengths, values and the people around you.', prerequisiteModuleId: null, anchor: null, position: 1, status: 'Published' },
      { id: 'cm-serving', trackId: 't-leadership', title: 'Leading by Serving', description: 'Putting others first and using influence to build people up.', prerequisiteModuleId: 'cm-knowing', anchor: '“The best leaders are the ones who carry the bags.”', position: 2, status: 'InReview' },
      { id: 'cm-speaking', trackId: 't-leadership', title: 'Speaking Up', description: null, prerequisiteModuleId: null, anchor: null, position: 3, status: 'Draft' },
      { id: 'cm-online', trackId: 't-digital', title: 'Staying Safe Online', description: null, prerequisiteModuleId: null, anchor: null, position: 1, status: 'Draft' },
    ],
    lessons: [
      lesson('l-strengths', 'cm-knowing', 'Your Strengths', 1, 'Published', 10, 'Everyone is good at something.'),
      lesson('l-values', 'cm-knowing', 'What Matters to You', 2, 'Published', 12, 'Values are the things you would stand up for.'),
      lesson('l-circle', 'cm-knowing', 'Your Circle', 3, 'Draft', 15),
      lesson('l-towel', 'cm-serving', 'Pick Up the Towel', 1, 'Published', 12, 'Leading isn’t a title. It’s noticing what needs doing and doing it, especially when nobody is watching.', {
        reading: 'The captain and the kit bags',
        objectives: ['Notice what needs doing', 'Serve without being asked'],
        prompts: ['Who picked up the towel for you this week?'],
        leaderNotes: 'Open with the story. Watch for youth who find it hard to accept help.',
        video: { fileName: 'pick-up-the-towel.mp4', bytes: 192937984, uploadedAt: '2026-11-05T15:20:00Z', uploadedBy: 'Marisol Delgado' },
      }),
      lesson('l-line', 'cm-serving', 'Last in Line', 2, 'Draft', 15),
      lesson('l-coach', 'cm-serving', 'Leading Like a Coach', 3, 'Draft', 18),
      lesson('l-voice', 'cm-speaking', 'Finding Your Voice', 1, 'Draft', 10),
      lesson('l-listen', 'cm-speaking', 'Listening First', 2, 'Draft', 10),
    ],
    programs: [
      { id: 'p-tutoring', name: 'After-School Tutoring', term: '2026–27', schedule: 'Mon–Thu, 4–6 pm', trackId: 't-leadership' },
      { id: 'p-sports', name: 'Saturday Sports', term: '2026–27', schedule: 'Sat, 10 am–12 pm', trackId: 't-leadership' },
      { id: 'p-winter', name: 'Winter Camp 2026', term: 'Winter 2026', schedule: '21–23 Dec, 8 am–5 pm', trackId: null },
    ],
  };
}

/** The curriculum API as the real one answers a program director; `state` holds the data, the modules and a pending failure. */
async function fakeApi(demo, state) {
  const d = state.data;
  const live = (moduleId) => d.lessons.filter((l) => l.moduleId === moduleId && !l.deleted).sort((a, b) => a.position - b.position);
  const ordered = (trackId) => d.modules.filter((m) => m.trackId === trackId).sort((a, b) => a.position - b.position);
  const following = (trackId) => d.programs.filter((p) => p.trackId === trackId);
  const invalid = (route, field, message) => route.fulfill({ status: 422, json: { errors: { [field]: message } } });
  await demo.page.route('**/api/**', async (route) => {
    const request = route.request();
    const method = request.method();
    const path = new URL(request.url()).pathname;
    if (state.failNext && path === state.failNext) {
      state.failNext = null;
      return route.fulfill({ status: 500, json: { code: 'server-error', reference: 'ERR-4C8Q' } });
    }
    const body = () => request.postDataJSON();
    if (path === '/api/me') return route.fulfill({ json: { personName: 'Marisol Delgado', role: 'ProgramDirector', organizationId: 'org-harbourview', organizationName: 'Harbourview Youth Collective', plan: 'Standard', modules: state.modules } });
    if (path === '/api/notifications') return route.fulfill({ json: { unread: 0, items: [] } });
    if (path === '/api/me/organizations') return route.fulfill({ json: { organizations: [] } });
    if (path === '/api/today') return route.fulfill({ status: 404 });
    if (path.startsWith('/api/curriculum') && !state.modules.includes('Learning')) return route.fulfill({ status: 404 });
    if (path === '/api/curriculum') {
      const tracks = [...d.tracks].sort((a, b) => a.name.localeCompare(b.name)).map((t) => ({
        ...t,
        modules: ordered(t.id).map((m) => ({ id: m.id, title: m.title, status: m.status, lessonCount: live(m.id).length })),
        followedBy: following(t.id).map((p) => ({ id: p.id, name: p.name })),
      }));
      return route.fulfill({ json: { tracks, programs: d.programs } });
    }
    if (path === '/api/curriculum/tracks' && method === 'POST') {
      const b = body();
      if (!b.name?.trim()) return invalid(route, 'name', 'Give the track a name.');
      const key = b.key?.trim() || b.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      if (d.tracks.some((t) => t.key === key)) return invalid(route, 'key', 'Another track already uses this key.');
      const id = `t-${d.tracks.length + 1}`;
      d.tracks.push({ id, name: b.name.trim(), key, description: b.description?.trim() || null, status: b.publish ? 'Published' : 'Draft' });
      return route.fulfill({ status: 201, json: { id } });
    }
    let m;
    if ((m = /^\/api\/curriculum\/tracks\/([^/]+)\/module-order$/.exec(path))) {
      body().moduleIds.forEach((id, i) => (d.modules.find((x) => x.id === id).position = i + 1));
      return route.fulfill({ status: 204 });
    }
    if ((m = /^\/api\/curriculum\/tracks\/([^/]+)\/status$/.exec(path))) {
      d.tracks.find((t) => t.id === m[1]).status = body().status;
      return route.fulfill({ status: 204 });
    }
    if ((m = /^\/api\/curriculum\/tracks\/([^/]+)\/cohorts$/.exec(path))) {
      const chosen = body().programIds;
      d.programs.forEach((p) => {
        if (chosen.includes(p.id)) p.trackId = m[1];
        else if (p.trackId === m[1]) p.trackId = null;
      });
      return route.fulfill({ status: 204 });
    }
    if (path === '/api/curriculum/modules' && method === 'POST') {
      const b = body();
      if (!b.title?.trim()) return invalid(route, 'title', 'Give the module a name.');
      const id = `cm-${d.modules.length + 1}`;
      d.modules.push({ id, trackId: b.trackId, title: b.title.trim(), description: b.description?.trim() || null, prerequisiteModuleId: null, anchor: null, position: ordered(b.trackId).length + 1, status: 'Draft' });
      return route.fulfill({ status: 201, json: { id } });
    }
    if ((m = /^\/api\/curriculum\/modules\/([^/]+)\/status$/.exec(path))) {
      const status = body().status;
      if (status === 'Published' && live(m[1]).length === 0) return invalid(route, 'status', 'Add a lesson before publishing the module.');
      d.modules.find((x) => x.id === m[1]).status = status;
      return route.fulfill({ status: 204 });
    }
    if ((m = /^\/api\/curriculum\/modules\/([^/]+)\/lesson-order$/.exec(path))) {
      body().lessonIds.forEach((id, i) => (d.lessons.find((x) => x.id === id).position = i + 1));
      return route.fulfill({ status: 204 });
    }
    if ((m = /^\/api\/curriculum\/modules\/([^/]+)$/.exec(path))) {
      const mod = d.modules.find((x) => x.id === m[1]);
      if (!mod) return route.fulfill({ status: 404 });
      if (method === 'PUT') {
        const b = body();
        if (!b.title?.trim()) return invalid(route, 'title', 'Give the module a name.');
        Object.assign(mod, { title: b.title.trim(), description: b.description || null, prerequisiteModuleId: b.prerequisiteModuleId, anchor: b.anchor || null });
        return route.fulfill({ status: 204 });
      }
      const track = d.tracks.find((t) => t.id === mod.trackId);
      const siblings = ordered(mod.trackId);
      return route.fulfill({
        json: {
          ...mod, trackName: track.name, moduleCount: siblings.length,
          earlierModules: siblings.filter((s) => s.position < mod.position).map((s) => ({ id: s.id, title: s.title })),
          lessons: live(mod.id).map((l) => ({ id: l.id, title: l.title, minutes: l.minutes, status: l.status })),
          programs: following(track.id).map((p) => p.name),
        },
      });
    }
    if (path === '/api/curriculum/lessons' && method === 'POST') {
      const b = body();
      if (!b.title?.trim()) return invalid(route, 'title', 'Give the lesson a title.');
      const id = `l-${d.lessons.length + 1}`;
      d.lessons.push({ id, moduleId: b.moduleId, title: b.title.trim(), reading: null, minutes: null, objectives: [], body: null, prompts: [], leaderNotes: null, position: live(b.moduleId).length + 1, status: 'Draft', deleted: false, video: null });
      return route.fulfill({ status: 201, json: { id } });
    }
    if ((m = /^\/api\/curriculum\/lessons\/([^/]+)\/video$/.exec(path))) {
      const l = d.lessons.find((x) => x.id === m[1]);
      if (method === 'DELETE') {
        l.video = null;
        return route.fulfill({ status: 204 });
      }
      const raw = request.postDataBuffer().toString('latin1');
      const fileName = /filename="([^"]*)"/.exec(raw)?.[1] ?? '';
      if (!/\.(mp4|mov|webm)$/i.test(fileName)) return invalid(route, 'file', 'Choose an MP4, MOV or WebM video of up to 1 GB.');
      if (state.holdUpload) await state.holdUpload;
      l.video = { fileName, bytes: 184 * 1024 * 1024, uploadedAt: '2026-11-05T21:12:00Z', uploadedBy: 'Marisol Delgado' };
      return route.fulfill({ status: 201, json: l.video });
    }
    if ((m = /^\/api\/curriculum\/lessons\/([^/]+)\/status$/.exec(path))) {
      const l = d.lessons.find((x) => x.id === m[1]);
      const status = body().status;
      if (status === 'Published' && !l.body) return invalid(route, 'status', 'Add teaching content before publishing.');
      l.status = status;
      return route.fulfill({ status: 204 });
    }
    if ((m = /^\/api\/curriculum\/lessons\/([^/]+)$/.exec(path))) {
      const l = d.lessons.find((x) => x.id === m[1] && !x.deleted);
      if (!l) return route.fulfill({ status: 404 });
      if (method === 'DELETE') {
        l.deleted = true;
        live(l.moduleId).forEach((x, i) => (x.position = i + 1));
        return route.fulfill({ status: 204 });
      }
      if (method === 'PUT') {
        const b = body();
        const errors = {};
        if (!b.title?.trim()) errors.title = 'Give the lesson a title.';
        if (b.minutes !== null && (b.minutes < 1 || b.minutes > 600)) errors.minutes = 'Estimate between 1 and 600 minutes.';
        if (Object.keys(errors).length) return route.fulfill({ status: 422, json: { errors } });
        Object.assign(l, { title: b.title.trim(), reading: b.reading || null, minutes: b.minutes, objectives: b.objectives, body: b.body || null, prompts: b.prompts, leaderNotes: b.leaderNotes || null });
        return route.fulfill({ status: 204 });
      }
      const mod = d.modules.find((x) => x.id === l.moduleId);
      const track = d.tracks.find((t) => t.id === mod.trackId);
      return route.fulfill({
        json: { ...l, moduleTitle: mod.title, trackId: track.id, trackName: track.name, lessonCount: live(mod.id).length, programs: following(track.id).map((p) => p.name) },
      });
    }
    return route.fulfill({ status: 404 });
  });
}

const newState = () => ({ data: seed(), modules: [...ON] });
const heading = (demo, level, name) => demo.app().getByRole('heading', { level, name }).first().waitFor();
const shot = (demo, name) => demo.page.locator('iframe').screenshot({ path: join(shots, `${name}.png`) });
const dialog = (demo) => demo.app().getByRole('dialog');

export default [
  {
    // Marisol opens Curriculum, creates Art Club, and moves Speaking Up up.
    name: 'tracks-desktop',
    run: async (demo) => {
      const state = newState();
      await fakeApi(demo, state);
      await demo.go('/curriculum', { ready: false });
      await demo.app().getByRole('region', { name: 'Leadership Foundations' }).waitFor();
      demo.mark();
      await demo.pause(2400);
      await shot(demo, 'desktop-tracks');
      await demo.click(demo.app().getByRole('button', { name: 'New track' }).first());
      await dialog(demo).waitFor();
      await demo.type(dialog(demo).getByLabel('Track name'), 'Art Club');
      await demo.type(dialog(demo).getByLabel(/Short description/), 'Drawing and painting together.');
      await demo.pause(800);
      await shot(demo, 'desktop-new-track');
      await demo.click(dialog(demo).getByRole('button', { name: 'Create track' }));
      await demo.app().getByRole('region', { name: 'Art Club' }).waitFor();
      await demo.pause(1600);
      await shot(demo, 'desktop-track-created');
      await demo.app().getByRole('region', { name: 'Leadership Foundations' }).scrollIntoViewIfNeeded();
      await demo.click(demo.app().getByRole('button', { name: 'Move Speaking Up up' }));
      await demo.pause(1800);
      await shot(demo, 'desktop-reordered');
    },
  },
  {
    // From Leading by Serving: its details, then Add lesson, write it, save, and publish it.
    name: 'lesson-desktop',
    run: async (demo) => {
      const state = newState();
      await fakeApi(demo, state);
      await demo.go('/curriculum/modules/cm-serving', { ready: false });
      await heading(demo, 1, /^Leading by Serving/);
      demo.mark();
      await demo.pause(2200);
      await shot(demo, 'desktop-module');
      await demo.click(demo.app().getByRole('button', { name: 'Add lesson' }));
      await dialog(demo).waitFor();
      await demo.type(dialog(demo).getByLabel('Lesson title'), 'Serving Without Being Seen');
      await demo.click(dialog(demo).getByRole('button', { name: 'Create and edit' }));
      await heading(demo, 1, /^Serving Without Being Seen/);
      await demo.pause(1000);
      await demo.type(demo.app().getByLabel('Estimated minutes'), '14');
      await demo.type(demo.app().getByLabel('Teaching content'), 'The best help is often the help nobody sees. Stack the chairs, wipe the table, and leave the room better than you found it.');
      await demo.type(demo.app().getByLabel(/^Leader guide notes/), 'Ask who noticed the chairs were stacked last week.');
      await demo.click(demo.app().getByRole('button', { name: 'Save lesson' }));
      await demo.app().getByTestId('toast').waitFor();
      await demo.pause(1400);
      await shot(demo, 'desktop-lesson-saved');
      await demo.click(demo.app().getByRole('button', { name: 'Status', exact: true }));
      await dialog(demo).waitFor();
      await demo.click(dialog(demo).getByRole('radio', { name: /^Published/ }));
      await demo.pause(800);
      await shot(demo, 'desktop-status-dialog');
      await demo.click(dialog(demo).getByRole('button', { name: 'Save status' }));
      await demo.pause(1800);
      await shot(demo, 'desktop-lesson-published');
    },
  },
  {
    // The lesson video: a PDF is refused, an MP4 uploads, and the towel lesson shows its video.
    name: 'video-desktop',
    run: async (demo) => {
      const state = newState();
      await fakeApi(demo, state);
      await demo.go('/curriculum/lessons/l-line', { ready: false });
      await heading(demo, 1, /^Last in Line/);
      demo.mark();
      await demo.app().getByRole('region', { name: 'Video' }).scrollIntoViewIfNeeded();
      await demo.pause(1600);
      await shot(demo, 'desktop-no-video');
      await demo.app().getByLabel('Choose video').setInputFiles({ name: 'weekly-schedule.pdf', mimeType: 'application/pdf', buffer: PDF });
      await demo.app().getByText('That file isn’t a video we can use').waitFor();
      await demo.pause(2000);
      await shot(demo, 'desktop-video-refused');
      let release;
      state.holdUpload = new Promise((r) => (release = r));
      await demo.app().getByLabel('Choose video').setInputFiles({ name: 'last-in-line.mp4', mimeType: 'video/mp4', buffer: MP4 });
      await demo.app().getByText(/^Uploading/).waitFor();
      await demo.pause(1400);
      await shot(demo, 'desktop-video-uploading');
      state.holdUpload = null;
      release();
      await demo.app().getByRole('button', { name: 'Remove the video last-in-line.mp4' }).waitFor();
      await demo.pause(2000);
      await shot(demo, 'desktop-video-attached');
    },
  },
  {
    // On a phone: Curriculum, the cohorts of Digital Skills, then a lesson editor.
    name: 'cohorts-phone',
    phone: true,
    run: async (demo) => {
      const state = newState();
      await fakeApi(demo, state);
      await demo.go('/curriculum', { ready: false });
      await demo.app().getByRole('region', { name: 'Digital Skills' }).waitFor();
      demo.mark();
      await demo.pause(1400);
      await shot(demo, 'phone-tracks');
      await demo.app().getByRole('region', { name: 'Digital Skills' }).scrollIntoViewIfNeeded();
      await demo.click(demo.app().getByRole('button', { name: 'Cohorts following Digital Skills' }));
      await dialog(demo).waitFor();
      await demo.click(dialog(demo).getByRole('checkbox', { name: /^Winter Camp 2026/ }));
      await demo.pause(1000);
      await shot(demo, 'phone-cohorts-dialog');
      await demo.click(dialog(demo).getByRole('button', { name: 'Save cohorts' }));
      await demo.app().getByText('Followed by Winter Camp 2026').waitFor();
      await demo.pause(1600);
      await shot(demo, 'phone-cohorts-saved');
      await demo.go('/curriculum/lessons/l-towel', { ready: false });
      await heading(demo, 1, /^Pick Up the Towel/);
      await demo.pause(1600);
      await shot(demo, 'phone-lesson');
    },
  },
  {
    // A module with no lessons cannot publish; no tracks yet; a failed load; Learning off.
    name: 'states-desktop',
    run: async (demo) => {
      const state = newState();
      await fakeApi(demo, state);
      await demo.go('/curriculum/modules/cm-online', { ready: false });
      await heading(demo, 1, /^Staying Safe Online/);
      demo.mark();
      await demo.pause(1000);
      await demo.click(demo.app().getByRole('button', { name: 'Status', exact: true }));
      await dialog(demo).waitFor();
      await demo.click(dialog(demo).getByRole('radio', { name: /^Published/ }));
      await demo.click(dialog(demo).getByRole('button', { name: 'Save status' }));
      await dialog(demo).getByText('Add a lesson before publishing the module.').waitFor();
      await demo.pause(1800);
      await shot(demo, 'desktop-module-invalid');
      await demo.press('Escape');
      state.data.tracks = [];
      state.data.modules = [];
      await demo.go('/curriculum', { ready: false });
      await heading(demo, 2, 'No tracks yet');
      await demo.pause(1600);
      await shot(demo, 'desktop-empty');
      Object.assign(state.data, seed());
      state.failNext = '/api/curriculum';
      await demo.go('/curriculum', { ready: false });
      await heading(demo, 2, 'We couldn’t load the curriculum');
      await demo.pause(1400);
      await shot(demo, 'desktop-error');
      await demo.click(demo.app().getByRole('button', { name: 'Try again' }));
      await demo.app().getByRole('region', { name: 'Leadership Foundations' }).waitFor();
      await demo.pause(1000);
      state.modules = ON.filter((x) => x !== 'Learning');
      await demo.go('/curriculum/lessons/l-towel', { ready: false });
      await demo.page.waitForTimeout(1500);
      await demo.pause(1400);
      await shot(demo, 'desktop-learning-off');
    },
  },
];
