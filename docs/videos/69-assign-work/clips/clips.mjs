// Screen recordings and screenshots for video 69, made with tools/video-record/record-clips.mjs against the
// running frontend. The backend is faked like the e2e suite: Daniel Osei (Mentor, Harbourview) mentors Mateo Rivera
// directly and supports After-School Tutoring (Jordan, Sofía, Yusuf), which follows Leadership Foundations; Kevin Tran
// (Saturday Sports) follows no track. Daniel assigns work; Sofía Rivera (Youth) sees it on her Learning home (L2-092, ADR 0063).
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const shots = join(dirname(fileURLToPath(import.meta.url)), '..', 'shots');
const ON = ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports', 'Learning', 'Mentoring'];
const MESSAGE = 'Read this before Tutoring night next week. Come ready to share one way you served someone.';
const LEADERSHIP = 't-leadership';

const YOUTH = [
  { id: 'c-jordan', name: 'Jordan Thompson', age: 11, programs: ['After-School Tutoring'], cohorts: 'After-School Tutoring', trackIds: [LEADERSHIP], atRisk: false },
  { id: 'c-kevin', name: 'Kevin Tran', age: 8, programs: ['Saturday Sports'], cohorts: 'Saturday Sports', trackIds: [], atRisk: false },
  { id: 'c-mateo', name: 'Mateo Rivera', age: 9, programs: ['After-School Tutoring'], cohorts: 'After-School Tutoring', trackIds: [LEADERSHIP], atRisk: false },
  { id: 'c-sofia', name: 'Sofía Rivera', age: 12, programs: ['After-School Tutoring'], cohorts: 'After-School Tutoring', trackIds: [LEADERSHIP], atRisk: false },
  { id: 'c-yusuf', name: 'Yusuf Haddad', age: 13, programs: ['After-School Tutoring'], cohorts: 'After-School Tutoring', trackIds: [LEADERSHIP], atRisk: true },
];

const item = (id, kind, title, moduleTitle) => ({ id, kind, title, moduleTitle, trackId: LEADERSHIP, trackName: 'Leadership Foundations' });
const ITEMS = [
  item('l-strengths', 'Lesson', 'Your Strengths', 'Knowing Yourself'),
  item('l-values', 'Lesson', 'What Matters to You', 'Knowing Yourself'),
  item('l-towel', 'Lesson', 'Pick Up the Towel', 'Leading by Serving'),
  item('l-line', 'Lesson', 'Last in Line', 'Leading by Serving'),
  item('l-coach', 'Lesson', 'Leading Like a Coach', 'Leading by Serving'),
  item('qz-serving', 'Quiz', 'Leading by Serving quiz', 'Leading by Serving'),
  item('as-serve', 'Assignment', 'Serve someone this week', 'Leading by Serving'),
];
const COHORT = { id: 'p-tutoring', name: 'After-School Tutoring', youthCount: 4, trackId: LEADERSHIP };
const ROSTER = ['c-jordan', 'c-mateo', 'c-sofia', 'c-yusuf'];

const LINE = {
  id: 'l-line', kind: 'Scripture', title: 'Last in Line', reading: 'Mark 10:35–45', minutes: 15,
  passage: '“For even the Son of Man did not come to be served, but to serve, and to give his life as a ransom for many.”',
  objectives: ['Notice who you can serve'], prompts: ['Who could you serve this week without being asked?'],
  body: 'James and John wanted the best seats. In the world, greatness flows downhill. Here it flips.\n\nThis week, watch for one person you can quietly serve without being asked.',
  moduleId: 'cm-serving', moduleTitle: 'Leading by Serving', trackId: LEADERSHIP, trackName: 'Leadership Foundations',
  position: 2, lessonCount: 3, hasVideo: false, done: false, next: { id: 'l-coach', title: 'Leading Like a Coach', kind: 'Reading' },
};

const ME = {
  daniel: { personName: 'Daniel Osei', role: 'Mentor', membershipId: 'm-daniel' },
  sofia: { personName: 'Sofía Rivera', role: 'Youth', membershipId: 'm-sofia' },
};

const newState = (x = {}) => ({ who: 'daniel', modules: ON, failSave: false, failLoad: false, items: ITEMS, rows: [], ...x });

/** Sofía's assigned work as GET /learning/home answers it: not done, soonest due first, days left from Thu 5 Nov 2026. */
const assignedFor = (state) => {
  if (!state.modules.includes('Mentoring')) return [];
  const day = (iso) => Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) / 86_400_000;
  return state.rows
    .filter((r) => r.childId === 'c-sofia')
    .map((r) => {
      const i = ITEMS.find((x) => x.id === r.itemId);
      return { kind: i.kind, itemId: i.id, lessonKind: i.id === 'l-line' ? 'Scripture' : i.kind === 'Lesson' ? 'Reading' : null, title: i.title, moduleTitle: i.moduleTitle, dueOn: r.dueOn, daysLeft: day(r.dueOn) - day('2026-11-05'), assignedBy: 'Daniel Osei', message: r.message };
    })
    .sort((a, b) => a.dueOn.localeCompare(b.dueOn));
};

/** The Mentoring and Learning APIs as the real ones answer Daniel or Sofía. */
async function fakeApi(demo, state) {
  await demo.page.route('**/api/**', async (route) => {
    const req = route.request();
    const path = new URL(req.url()).pathname;
    const me = ME[state.who];
    if (path === '/api/me')
      return route.fulfill({ json: { ...me, organizationId: 'org-harbourview', organizationName: 'Harbourview Youth Collective', plan: 'Standard', modules: state.modules } });
    if (path === '/api/notifications') return route.fulfill({ json: { unread: 0, items: [] } });
    if (path === '/api/me/organizations') return route.fulfill({ json: { organizations: [] } });
    if (path === '/api/today') return route.fulfill({ json: { tasks: [], events: [], counts: {} } });
    if (path.startsWith('/api/mentoring') && !state.modules.includes('Mentoring')) return route.fulfill({ status: 404 });
    if (path === '/api/mentoring/dashboard')
      return route.fulfill({
        json: {
          youth: YOUTH,
          cohorts: [{ programId: 'p-tutoring', name: 'After-School Tutoring', term: '2026–27', role: 'Supporting', youthCount: 4 }],
          checkedInThisWeek: 3,
          recentActivity: [{ childId: 'c-mateo', youthName: 'Mateo Rivera', kind: 'CheckedIn', session: 'Tutoring night', at: '2026-11-05T21:02:00Z' }],
          followUps: [],
        },
      });
    if (path === '/api/mentoring/reviews') return route.fulfill({ json: { items: [] } });
    if ((path === '/api/mentoring/assign-work' || path === '/api/mentoring/assigned-work') && !state.modules.includes('Learning')) return route.fulfill({ status: 404 });
    if (path === '/api/mentoring/assign-work') {
      if (state.failLoad) return route.fulfill({ status: 500 });
      return route.fulfill({ json: { items: state.items, youth: YOUTH.map(({ id, name, cohorts, trackIds, atRisk }) => ({ id, name, cohorts, trackIds, atRisk })), cohorts: [COHORT] } });
    }
    if (path === '/api/mentoring/assigned-work') {
      if (state.failSave) return route.fulfill({ status: 500 });
      const b = req.postDataJSON();
      const i = ITEMS.find((x) => x.id === b.itemId);
      const chosen = YOUTH.filter((y) => (b.childIds ?? []).includes(y.id));
      const stray = chosen.find((y) => !y.trackIds.includes(LEADERSHIP));
      if (stray) return route.fulfill({ status: 422, json: { errors: { childIds: `${stray.name} doesn’t follow the track this ${i.kind.toLowerCase()} is in.` } } });
      const recipients = b.programId ? ROSTER : chosen.map((y) => y.id);
      recipients.forEach((childId) => state.rows.push({ childId, itemId: i.id, dueOn: b.dueOn, message: b.message }));
      return route.fulfill({ status: 201, json: { count: recipients.length, title: i.title, dueOn: b.dueOn } });
    }
    if (path.startsWith('/api/learning') && !state.modules.includes('Learning')) return route.fulfill({ status: 404 });
    if (path === '/api/learning/onboarding')
      return route.fulfill({ json: { status: 'completed', step: 3, preferredName: 'Sofía', pronouns: 'she/her', lessonReminders: true, mentorMessages: true, announcements: false, program: { name: 'After-School Tutoring', schedule: 'Mon–Thu, 4–6 pm', startsOn: '2026-09-08', endsOn: '2027-06-24' } } });
    if (path === '/api/learning/home')
      return route.fulfill({
        json: {
          completedLessons: 3,
          totalLessons: 7,
          next: { lessonId: 'l-line', kind: 'Scripture', title: 'Last in Line', moduleId: 'cm-serving', moduleTitle: 'Leading by Serving', reading: 'Mark 10:35–45', minutes: 15, moduleCompleted: 1, moduleTotal: 3 },
          tracks: [{ id: LEADERSHIP, name: 'Leadership Foundations', description: 'Growing as a leader at home, at school and in the cohort.', program: 'After-School Tutoring', completedLessons: 3, totalLessons: 7 }],
          assigned: assignedFor(state),
        },
      });
    if (path === '/api/learning/lessons/l-line') return route.fulfill({ json: LINE });
    return route.fulfill({ status: 404 });
  });
}

const app = (demo) => demo.app();
const heading = (demo, name) => app(demo).getByRole('heading', { level: 1, name }).first().waitFor();
const shot = (demo, name) => demo.page.locator('iframe').screenshot({ path: join(shots, `${name}.png`) });
const button = (demo, name) => app(demo).getByRole('button', { name, exact: true });
const dialog = (demo) => app(demo).getByRole('dialog', { name: 'Assign work' });
const radio = (demo, name) => dialog(demo).getByRole('radio', { name: new RegExp(`^${name}`) });
const youth = (demo, name) => dialog(demo).getByRole('checkbox', { name: new RegExp(`^${name}`) });

async function openDialog(demo) {
  await demo.click(button(demo, 'Assign work'));
  await dialog(demo).waitFor();
  await demo.pause(1000);
}

async function chooseLine(demo) {
  await dialog(demo).getByRole('combobox', { name: 'Lesson', exact: true }).selectOption({ label: 'Last in Line · Leading by Serving' });
  await demo.pause(700);
}

async function due(demo, date) {
  await dialog(demo).getByLabel('Due date').fill(date);
  await demo.pause(600);
}

export default [
  {
    // Daniel's dashboard, Assign work to the whole After-School Tutoring cohort, and the toast.
    name: 'assign-desktop',
    run: async (demo) => {
      await fakeApi(demo, newState());
      await demo.go('/mentoring', { ready: false });
      await heading(demo, 'Mentoring');
      demo.mark();
      await demo.pause(1800);
      await shot(demo, 'desktop-dashboard');
      await openDialog(demo);
      await chooseLine(demo);
      await demo.click(radio(demo, 'A whole cohort'));
      await dialog(demo).getByRole('combobox', { name: 'Cohort' }).selectOption({ label: 'After-School Tutoring · 4 youth' });
      await demo.pause(700);
      await due(demo, '2026-11-13');
      await demo.type(dialog(demo).getByRole('textbox', { name: /^Message/ }), MESSAGE);
      await demo.pause(1200);
      await shot(demo, 'desktop-dialog');
      await demo.click(button(demo, 'Assign'));
      await app(demo).getByText('Work assigned').first().waitFor();
      await demo.pause(2600);
      await shot(demo, 'desktop-assigned');
    },
  },
  {
    // Youth I choose: Mateo and Yusuf, who is marked at risk.
    name: 'chosen-desktop',
    run: async (demo) => {
      await fakeApi(demo, newState());
      await demo.go('/mentoring', { ready: false });
      await heading(demo, 'Mentoring');
      demo.mark();
      await openDialog(demo);
      await demo.click(radio(demo, 'Quiz'));
      await dialog(demo).getByRole('combobox', { name: 'Quiz', exact: true }).selectOption({ label: 'Leading by Serving quiz · Leading by Serving' });
      await demo.pause(700);
      await demo.click(radio(demo, 'Youth I choose'));
      await demo.pause(800);
      await demo.click(youth(demo, 'Mateo Rivera'));
      await demo.click(youth(demo, 'Yusuf Haddad'));
      await due(demo, '2026-11-10');
      await demo.pause(1400);
      await shot(demo, 'desktop-chosen');
      await demo.click(button(demo, 'Assign'));
      await app(demo).getByText('Work assigned').first().waitFor();
      await demo.pause(2600);
    },
  },
  {
    // Sofía's Learning home: Assigned to you, soonest due first, and the lesson it opens.
    name: 'youth-desktop',
    run: async (demo) => {
      const state = newState({ who: 'sofia' });
      state.rows.push({ childId: 'c-sofia', itemId: 'l-line', dueOn: '2026-11-13', message: MESSAGE });
      state.rows.push({ childId: 'c-sofia', itemId: 'as-serve', dueOn: '2026-11-03', message: null });
      await fakeApi(demo, state);
      await demo.go('/learning', { ready: false });
      await heading(demo, 'Learning');
      demo.mark();
      await demo.pause(3200);
      await shot(demo, 'desktop-learning');
      await demo.click(app(demo).getByRole('list', { name: 'Work assigned to you, soonest due first' }).getByRole('link', { name: /^Last in Line/ }));
      await heading(demo, 'Last in Line');
      await demo.pause(2400);
      await shot(demo, 'desktop-lesson');
    },
  },
  {
    // On a phone: the dialog as a bottom sheet, then Sofía's Assigned to you in one column.
    name: 'phone',
    phone: true,
    run: async (demo) => {
      const state = newState();
      state.rows.push({ childId: 'c-sofia', itemId: 'l-line', dueOn: '2026-11-13', message: MESSAGE });
      await fakeApi(demo, state);
      await demo.go('/mentoring', { ready: false });
      await heading(demo, 'Mentoring');
      demo.mark();
      await openDialog(demo);
      await chooseLine(demo);
      await demo.click(radio(demo, 'Youth I choose'));
      await demo.pause(1600);
      await shot(demo, 'phone-dialog');
      await demo.click(button(demo, 'Cancel'));
      state.who = 'sofia';
      await demo.go('/learning', { ready: false });
      await heading(demo, 'Learning');
      await demo.pause(2600);
      await shot(demo, 'phone-learning');
    },
  },
  {
    // Invalid, a youth outside the track, a failed save, a failed load, nothing to assign, Learning off, Mentoring off for Sofía.
    name: 'states-desktop',
    run: async (demo) => {
      const state = newState();
      await fakeApi(demo, state);
      await demo.go('/mentoring', { ready: false });
      await heading(demo, 'Mentoring');
      demo.mark();
      await openDialog(demo);
      await demo.click(button(demo, 'Assign'));
      await dialog(demo).getByText('Fix these to continue').waitFor();
      await demo.pause(2400);
      await shot(demo, 'desktop-invalid');
      await chooseLine(demo);
      await demo.click(radio(demo, 'Youth I choose'));
      await demo.click(youth(demo, 'Kevin Tran'));
      await due(demo, '2026-11-13');
      await demo.click(button(demo, 'Assign'));
      await dialog(demo).getByText('Kevin Tran doesn’t follow the track this lesson is in.').first().waitFor();
      await demo.pause(2400);
      await shot(demo, 'desktop-not-followed');
      state.failSave = true;
      await demo.click(youth(demo, 'Kevin Tran'));
      await demo.click(youth(demo, 'Mateo Rivera'));
      await demo.click(button(demo, 'Assign'));
      await dialog(demo).getByText('That didn’t go through').waitFor();
      await demo.pause(2000);
      await shot(demo, 'desktop-failed');
      await demo.click(button(demo, 'Cancel'));
      state.failLoad = true;
      await openDialog(demo);
      await dialog(demo).getByText('We couldn’t load what you can assign').waitFor();
      await demo.pause(1800);
      await shot(demo, 'desktop-error');
      await demo.click(button(demo, 'Cancel'));
      state.failLoad = false;
      state.items = [];
      await openDialog(demo);
      await dialog(demo).getByText('Nothing to assign yet').waitFor();
      await demo.pause(2000);
      await shot(demo, 'desktop-nothing');
      await demo.click(button(demo, 'Close').last());
      state.modules = ON.filter((x) => x !== 'Learning');
      await demo.go('/mentoring', { ready: false });
      await heading(demo, 'Mentoring');
      await demo.pause(2200);
      await shot(demo, 'desktop-learning-off');
      state.who = 'sofia';
      state.modules = ON.filter((x) => x !== 'Mentoring');
      state.rows.push({ childId: 'c-sofia', itemId: 'l-line', dueOn: '2026-11-13', message: MESSAGE });
      await demo.go('/learning', { ready: false });
      await heading(demo, 'Learning');
      await demo.pause(2200);
      await shot(demo, 'desktop-mentoring-off');
    },
  },
];
