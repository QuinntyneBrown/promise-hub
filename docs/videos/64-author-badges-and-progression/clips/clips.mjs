// Screen recordings and screenshots for video 64, made with tools/video-record/record-clips.mjs against the
// running frontend. The backend is faked like the e2e suite: Marisol Delgado (Program director, Harbourview) defines
// badges, awards one by hand and edits the progression framework (L2-084 to L2-086).
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const shots = join(dirname(fileURLToPath(import.meta.url)), '..', 'shots');
const ON = ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports', 'Learning'];
const org = { organizationId: 'org-harbourview', organizationName: 'Harbourview Youth Collective', plan: 'Standard' };
const NOW = '2026-11-05T21:30:00Z';

const tracks = [
  { id: 't-leadership', name: 'Leadership Foundations', key: 'leadership', description: 'Growing as a leader at home, at school and in the cohort.', status: 'Published', followedBy: [{ id: 'p-tutoring', name: 'After-School Tutoring' }],
    modules: [{ id: 'cm-knowing', title: 'Knowing Yourself', status: 'Published', lessonCount: 3 }, { id: 'cm-serving', title: 'Leading by Serving', status: 'InReview', lessonCount: 3 }, { id: 'cm-speaking', title: 'Speaking Up', status: 'Draft', lessonCount: 2 }] },
];
const targets = {
  lessons: [{ id: 'l-strengths', title: 'Knowing Yourself · Your Strengths' }, { id: 'l-towel', title: 'Leading by Serving · Pick Up the Towel' }, { id: 'l-line', title: 'Leading by Serving · Last in Line' }],
  modules: [{ id: 'cm-knowing', title: 'Leadership Foundations · Knowing Yourself' }, { id: 'cm-serving', title: 'Leadership Foundations · Leading by Serving' }, { id: 'cm-speaking', title: 'Leadership Foundations · Speaking Up' }],
  quizzes: [{ id: 'qz-serving', title: 'Leading by Serving · Leading by Serving quiz' }],
  assignments: [{ id: 'as-serve', title: 'Leading by Serving · Serve someone this week' }],
};
const titleOf = (id) => [...targets.lessons, ...targets.modules, ...targets.quizzes, ...targets.assignments].find((t) => t.id === id)?.title.split(' · ').at(-1) ?? null;
const YOUTH = [{ membershipId: 'm-nadia', name: 'Nadia Haddad' }, { membershipId: 'm-sofia', name: 'Sofía Rivera' }];
const badge = (id, name, icon, description, kind, rule, targetId, competencyId) => ({ id, name, icon, description, kind, rule, targetId, competencyId, deleted: false });

const newState = (x = {}) => ({
  who: { personName: 'Marisol Delgado', role: 'ProgramDirector' },
  modules: ON,
  failNext: null,
  next: 1,
  badges: [
    badge('b-first', 'First Steps', 'star', 'Finished a first lesson.', 'Automatic', 'LessonCompleted', 'l-towel', null),
    badge('b-servant', 'Servant Heart', 'heart', 'Finished Leading by Serving.', 'Automatic', 'ModuleCompleted', 'cm-serving', 'cp-serves'),
    badge('b-quiz', 'Quiz Champion', 'award', 'Passed the Leading by Serving quiz.', 'Automatic', 'QuizPassed', 'qz-serving', null),
    badge('b-served', 'Served Someone', 'check', 'Had Serve someone this week accepted.', 'Automatic', 'AssignmentAccepted', 'as-serve', 'cp-serves'),
    badge('b-speaks', 'Speaks Up', 'flag', 'Shared an idea with the whole group.', 'Manual', null, null, 'cp-speaks'),
    badge('b-encourager', 'Encourager', 'sparkle', 'Lifted someone up in the group.', 'Manual', null, null, null),
  ],
  awards: [
    { id: 'ba-1', badgeId: 'b-first', membershipId: 'm-sofia', awardedAt: '2026-11-02T16:00:00Z', awardedBy: null },
    { id: 'ba-2', badgeId: 'b-first', membershipId: 'm-nadia', awardedAt: '2026-11-03T16:00:00Z', awardedBy: null },
    { id: 'ba-3', badgeId: 'b-servant', membershipId: 'm-sofia', awardedAt: '2026-11-05T15:00:00Z', awardedBy: null },
    { id: 'ba-4', badgeId: 'b-served', membershipId: 'm-sofia', awardedAt: '2026-11-04T20:00:00Z', awardedBy: null },
    { id: 'ba-5', badgeId: 'b-speaks', membershipId: 'm-sofia', awardedAt: '2026-11-04T18:00:00Z', awardedBy: 'Marisol Delgado' },
  ],
  stages: [
    { id: 'st-explorer', position: 1, name: 'Explorer', description: 'Finding their place in the group' },
    { id: 'st-contributor', position: 2, name: 'Contributor', description: 'Takes part and helps others take part' },
    { id: 'st-leader', position: 3, name: 'Leader', description: 'Leads others in the cohort' },
  ],
  competencies: [
    { id: 'cp-serves', stageId: 'st-explorer', name: 'Serves others', description: 'Notices what needs doing and helps without being asked.' },
    { id: 'cp-speaks', stageId: 'st-contributor', name: 'Speaks up', description: 'Shares ideas in the group and says when something is wrong.' },
    { id: 'cp-leads', stageId: 'st-leader', name: 'Leads a small group', description: 'Guides a discussion and keeps a small group on track.' },
    { id: 'cp-follows', stageId: 'st-contributor', name: 'Follows through', description: 'Finishes what they start and keeps their promises.' },
    { id: 'cp-works', stageId: 'st-explorer', name: 'Works with others', description: 'Listens, takes turns and helps the group decide.' },
  ],
  ...x,
});

const NOUN = { LessonCompleted: 'lesson', ModuleCompleted: 'module', QuizPassed: 'quiz', AssignmentAccepted: 'assignment' };
const trim = (v) => (v ?? '').trim();

/** The curriculum API as the real one answers a program director for badges and the progression framework. */
async function fakeApi(demo, state) {
  await demo.page.route('**/api/**', async (route) => {
    const request = route.request();
    const method = request.method();
    const path = new URL(request.url()).pathname;
    const body = () => request.postDataJSON() ?? {};
    if (state.failNext && path === state.failNext) {
      state.failNext = null;
      return route.fulfill({ status: 500, json: { code: 'server-error' } });
    }
    if (path === '/api/me') return route.fulfill({ json: { ...state.who, ...org, modules: state.modules } });
    if (path === '/api/notifications') return route.fulfill({ json: { unread: 0, items: [] } });
    if (path === '/api/me/organizations') return route.fulfill({ json: { organizations: [] } });
    if (path === '/api/today') return route.fulfill({ status: 404 });
    if (path.startsWith('/api/curriculum') && !state.modules.includes('Learning')) return route.fulfill({ status: 404 });
    if (path.startsWith('/api/curriculum') && !['Admin', 'ProgramDirector'].includes(state.who.role)) return route.fulfill({ status: 403, json: { code: 'forbidden' } });
    const live = state.badges.filter((b) => !b.deleted);
    const comp = (id) => state.competencies.find((c) => c.id === id)?.name ?? null;
    const summary = (b) => ({ ...b, targetTitle: titleOf(b.targetId), competencyName: comp(b.competencyId), earnedCount: state.awards.filter((a) => a.badgeId === b.id).length });
    let m;
    if (path === '/api/curriculum') return route.fulfill({ json: { tracks, programs: [] } });
    if (path === '/api/curriculum/badges' && method === 'GET') {
      const ids = new Set(live.map((b) => b.id));
      const awards = state.awards.filter((a) => ids.has(a.badgeId));
      return route.fulfill({ json: { badges: live.map(summary), awards: awards.length, youth: new Set(awards.map((a) => a.membershipId)).size } });
    }
    if (path === '/api/curriculum/badges/options')
      return route.fulfill({ json: { ...targets, competencies: state.competencies.filter((c) => !c.removed).map((c) => ({ id: c.id, name: c.name })) } });
    const check = (b) => {
      const errors = {};
      if (!trim(b.name)) errors.name = 'Give the badge a name.';
      if (b.kind === 'Automatic' && !b.targetId) errors.targetId = `Choose the ${NOUN[b.rule]} that earns it.`;
      return errors;
    };
    if (path === '/api/curriculum/badges' && method === 'POST') {
      const b = body();
      const errors = check(b);
      if (Object.keys(errors).length) return route.fulfill({ status: 422, json: { errors } });
      const id = `b-new-${state.next++}`;
      state.badges.push({ id, name: trim(b.name), icon: b.icon, description: trim(b.description) || null, kind: b.kind, rule: b.kind === 'Automatic' ? b.rule : null, targetId: b.kind === 'Automatic' ? b.targetId : null, competencyId: b.competencyId, deleted: false });
      return route.fulfill({ status: 201, json: { id } });
    }
    if ((m = /^\/api\/curriculum\/badges\/([^/]+)\/awards$/.exec(path))) {
      const b = live.find((x) => x.id === m[1]);
      const who = body().membershipId;
      if (!who) return route.fulfill({ status: 422, json: { errors: { membershipId: 'Choose a youth of your organization.' } } });
      if (state.awards.some((a) => a.badgeId === b.id && a.membershipId === who)) return route.fulfill({ status: 409, json: { code: 'already-awarded' } });
      state.awards.push({ id: `ba-new-${state.next++}`, badgeId: b.id, membershipId: who, awardedAt: NOW, awardedBy: 'Marisol Delgado' });
      return route.fulfill({ status: 201, json: { id: 'ba' } });
    }
    if ((m = /^\/api\/curriculum\/badges\/([^/]+)$/.exec(path))) {
      const b = live.find((x) => x.id === m[1]);
      if (!b) return route.fulfill({ status: 404 });
      if (method === 'PUT') {
        const f = body();
        const errors = check(f);
        if (Object.keys(errors).length) return route.fulfill({ status: 422, json: { errors } });
        Object.assign(b, { name: trim(f.name), icon: f.icon, description: trim(f.description) || null, kind: f.kind, rule: f.rule, targetId: f.targetId, competencyId: f.competencyId });
        return route.fulfill({ status: 204 });
      }
      if (method === 'DELETE') {
        b.deleted = true;
        return route.fulfill({ status: 204 });
      }
      const awards = state.awards.filter((a) => a.badgeId === b.id).sort((x, y) => y.awardedAt.localeCompare(x.awardedAt))
        .map((a) => ({ ...a, youthName: YOUTH.find((y) => y.membershipId === a.membershipId).name }));
      const { earnedCount: _, ...rest } = summary(b);
      return route.fulfill({ json: { ...rest, awards, youth: YOUTH.filter((y) => !awards.some((a) => a.membershipId === y.membershipId)) } });
    }
    if (path === '/api/curriculum/progression')
      return route.fulfill({ json: { stages: [...state.stages].sort((a, b) => a.position - b.position).map((s) => ({ ...s, competencies: state.competencies.filter((c) => c.stageId === s.id && !c.removed) })) } });
    if (path === '/api/curriculum/progression/stages' && method === 'POST') {
      const s = body();
      if (!trim(s.name)) return route.fulfill({ status: 422, json: { errors: { name: 'Give the stage a name.' } } });
      state.stages.push({ id: `st-new-${state.next++}`, position: state.stages.length + 1, name: trim(s.name), description: trim(s.description) });
      return route.fulfill({ status: 201, json: { id: 'st' } });
    }
    if ((m = /^\/api\/curriculum\/progression\/stages\/([^/]+)$/.exec(path))) {
      Object.assign(state.stages.find((s) => s.id === m[1]), { name: trim(body().name), description: trim(body().description) });
      return route.fulfill({ status: 204 });
    }
    if (path === '/api/curriculum/progression/stage-order') {
      body().stageIds.forEach((id, i) => (state.stages.find((s) => s.id === id).position = i + 1));
      return route.fulfill({ status: 204 });
    }
    if ((m = /^\/api\/curriculum\/progression\/stages\/([^/]+)\/competencies$/.exec(path))) {
      const c = body();
      if (!trim(c.name)) return route.fulfill({ status: 422, json: { errors: { name: 'Name the competency.' } } });
      state.competencies.push({ id: `cp-new-${state.next++}`, stageId: m[1], name: trim(c.name), description: trim(c.description) });
      return route.fulfill({ status: 201, json: { id: 'cp' } });
    }
    if ((m = /^\/api\/curriculum\/progression\/competencies\/([^/]+)$/.exec(path))) {
      state.competencies.find((c) => c.id === m[1]).removed = true;
      return route.fulfill({ status: 204 });
    }
    return route.fulfill({ status: 404 });
  });
}

const app = (demo) => demo.app();
const heading = (demo, name) => app(demo).getByRole('heading', { level: 1, name }).first().waitFor();
const shot = (demo, name) => demo.page.locator('iframe').screenshot({ path: join(shots, `${name}.png`) });
const dialog = (demo) => app(demo).getByRole('dialog');
const select = async (demo, label, option) => {
  await app(demo).getByLabel(label, { exact: true }).selectOption({ label: option });
  await demo.pause(500);
};

export default [
  {
    // From Curriculum: Badges, the list and its counts, then a new automatic badge for finishing Knowing Yourself.
    name: 'badges-desktop',
    run: async (demo) => {
      const state = newState();
      await fakeApi(demo, state);
      await demo.go('/curriculum', { ready: false });
      await heading(demo, 'Curriculum');
      demo.mark();
      await demo.pause(1400);
      await demo.click(app(demo).getByRole('link', { name: 'Badges' }));
      await heading(demo, 'Badges');
      await demo.pause(3000);
      await shot(demo, 'desktop-badges');
      await demo.click(app(demo).getByRole('link', { name: 'New badge' }).first());
      await heading(demo, 'New badge');
      await demo.pause(1400);
      await shot(demo, 'desktop-new-badge');
      await demo.type(app(demo).getByLabel('Badge name'), 'Knows Themselves');
      await demo.type(app(demo).getByLabel('What it celebrates'), 'Finished Knowing Yourself.');
      await select(demo, 'Icon', 'Book');
      await select(demo, 'Rule', 'Completes a module');
      await select(demo, 'Which one', 'Leadership Foundations · Knowing Yourself');
      await select(demo, 'Counts toward', 'Speaks up');
      await demo.pause(1200);
      await shot(demo, 'desktop-badge-filled');
      await demo.click(app(demo).getByRole('button', { name: 'Save badge' }));
      await heading(demo, 'Knows Themselves');
      await demo.pause(3000);
      await shot(demo, 'desktop-badge-saved');
    },
  },
  {
    // An automatic award as Marisol sees it, then Speaks Up awarded by hand to Nadia.
    name: 'award-desktop',
    run: async (demo) => {
      const state = newState();
      await fakeApi(demo, state);
      await demo.go('/curriculum/badges/b-servant', { ready: false });
      await heading(demo, 'Servant Heart');
      demo.mark();
      await demo.pause(3000);
      await shot(demo, 'desktop-automatic');
      await demo.go('/curriculum/badges/b-speaks', { ready: false });
      await heading(demo, 'Speaks Up');
      await demo.pause(2000);
      await demo.click(app(demo).getByRole('button', { name: 'Award badge' }));
      await dialog(demo).waitFor();
      await demo.pause(800);
      await dialog(demo).getByLabel('Youth').selectOption({ label: 'Nadia Haddad' });
      await demo.pause(1400);
      await shot(demo, 'desktop-award-dialog');
      await demo.click(dialog(demo).getByRole('button', { name: 'Award badge' }));
      await app(demo).getByRole('heading', { name: 'Earned by (2)' }).waitFor();
      await demo.pause(3000);
      await shot(demo, 'desktop-awarded');
    },
  },
  {
    // The progression framework: stages and competencies, a new stage, a competency added and one removed.
    name: 'progression-desktop',
    run: async (demo) => {
      const state = newState();
      await fakeApi(demo, state);
      await demo.go('/curriculum', { ready: false });
      await heading(demo, 'Curriculum');
      demo.mark();
      await demo.pause(1000);
      await demo.click(app(demo).getByRole('link', { name: 'Progression' }));
      await heading(demo, 'Progression framework');
      await demo.pause(3200);
      await shot(demo, 'desktop-progression');
      await demo.click(app(demo).getByRole('button', { name: 'Add stage' }).first());
      await dialog(demo).waitFor();
      await demo.type(dialog(demo).getByLabel('Stage name'), 'Mentor');
      await demo.type(dialog(demo).getByLabel('Short description'), 'Helps a newer youth find their feet');
      await demo.pause(1000);
      await shot(demo, 'desktop-stage-dialog');
      await demo.click(dialog(demo).getByRole('button', { name: 'Add stage' }));
      await app(demo).getByRole('heading', { name: '4. Mentor' }).waitFor();
      await demo.pause(1600);
      await demo.click(app(demo).getByRole('button', { name: 'Add competency to Mentor' }));
      await dialog(demo).waitFor();
      await demo.type(dialog(demo).getByLabel('Competency', { exact: true }), 'Welcomes someone new');
      await demo.type(dialog(demo).getByLabel('What it looks like'), 'Says hello, learns their name and includes them.');
      await demo.pause(1000);
      await shot(demo, 'desktop-competency-dialog');
      await demo.click(dialog(demo).getByRole('button', { name: 'Add competency' }));
      await app(demo).getByText('Welcomes someone new').first().waitFor();
      await demo.pause(1800);
      await shot(demo, 'desktop-progression-added');
      await demo.click(app(demo).getByRole('button', { name: 'Remove Works with others' }));
      await dialog(demo).waitFor();
      await demo.pause(1600);
      await shot(demo, 'desktop-remove-dialog');
      await demo.click(dialog(demo).getByRole('button', { name: 'Remove competency' }));
      await dialog(demo).waitFor({ state: 'hidden' });
      await demo.pause(2400);
    },
  },
  {
    // On a phone: Badges and a badge.
    name: 'phone',
    phone: true,
    run: async (demo) => {
      const state = newState();
      await fakeApi(demo, state);
      await demo.go('/curriculum/badges', { ready: false });
      await heading(demo, 'Badges');
      demo.mark();
      await demo.pause(2200);
      await shot(demo, 'phone-badges');
      await demo.click(app(demo).getByRole('link', { name: /^Speaks Up/ }));
      await heading(demo, 'Speaks Up');
      await demo.pause(2400);
      await shot(demo, 'phone-badge');
      await demo.go('/curriculum/progression', { ready: false });
      await heading(demo, 'Progression framework');
      await demo.pause(2400);
      await shot(demo, 'phone-progression');
    },
  },
  {
    // Invalid, already awarded, a failed save, no badges, forbidden and Learning off.
    name: 'states-desktop',
    run: async (demo) => {
      const state = newState();
      await fakeApi(demo, state);
      await demo.go('/curriculum/badges/new', { ready: false });
      await heading(demo, 'New badge');
      demo.mark();
      await demo.pause(800);
      await select(demo, 'Rule', 'Completes a module');
      await demo.click(app(demo).getByRole('button', { name: 'Save badge' }));
      await app(demo).getByText('Fix these to continue').waitFor();
      await demo.pause(2400);
      await shot(demo, 'desktop-invalid');
      await demo.go('/curriculum/badges/b-speaks', { ready: false });
      await heading(demo, 'Speaks Up');
      await demo.click(app(demo).getByRole('button', { name: 'Award badge' }));
      await dialog(demo).waitFor();
      await dialog(demo).getByLabel('Youth').selectOption({ label: 'Nadia Haddad' });
      state.awards.push({ id: 'ba-race', badgeId: 'b-speaks', membershipId: 'm-nadia', awardedAt: NOW, awardedBy: 'Tom Nguyen' });
      await demo.click(dialog(demo).getByRole('button', { name: 'Award badge' }));
      await dialog(demo).getByText('Nadia Haddad already has this badge.').waitFor();
      await demo.pause(2200);
      await shot(demo, 'desktop-already');
      await demo.press('Escape');
      state.failNext = '/api/curriculum/badges/b-speaks';
      await demo.type(app(demo).getByLabel('Badge name'), ' Bravely');
      await demo.click(app(demo).getByRole('button', { name: 'Save badge' }));
      await app(demo).getByText('We couldn’t save the badge').waitFor();
      await demo.pause(2000);
      await shot(demo, 'desktop-failed');
      state.badges = [];
      await demo.go('/curriculum/badges', { ready: false });
      await app(demo).getByText('No badges yet').waitFor();
      await demo.pause(1800);
      await shot(demo, 'desktop-empty');
      state.who = { personName: 'Jaylen Okafor', role: 'SiteLead' };
      await demo.go('/curriculum/progression', { ready: false });
      await app(demo).getByText('Program directors write the curriculum').waitFor();
      await demo.pause(1800);
      await shot(demo, 'desktop-forbidden');
      state.who = { personName: 'Marisol Delgado', role: 'ProgramDirector' };
      state.modules = ON.filter((x) => x !== 'Learning');
      await demo.go('/curriculum/badges', { ready: false });
      await demo.pause(2400);
      await shot(demo, 'desktop-learning-off');
    },
  },
];
