// Screen recordings and screenshots for video 67, made with tools/video-record/record-clips.mjs against the
// running frontend. The backend is faked like the e2e suite: Daniel Osei (Mentor, Harbourview) mentors Mateo Rivera
// directly and supports After-School Tutoring (Jordan, Sofía, Yusuf); he logs mentor check-ins, reads his history and
// sees follow-ups on his dashboard (L2-090, ADR 0061).
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const shots = join(dirname(fileURLToPath(import.meta.url)), '..', 'shots');
const ON = ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports', 'Learning', 'Mentoring'];
const TODAY = '2026-11-05';
const KINDS = ['OneToOne', 'Call', 'Session'];
const ENGAGEMENTS = ['Struggling', 'Low', 'Steady', 'Engaged', 'Thriving'];

const YOUTH = [
  { id: 'c-jordan', name: 'Jordan Thompson', age: 11, programs: ['After-School Tutoring'] },
  { id: 'c-mateo', name: 'Mateo Rivera', age: 9, programs: ['After-School Tutoring'] },
  { id: 'c-sofia', name: 'Sofía Rivera', age: 12, programs: ['After-School Tutoring'] },
  { id: 'c-yusuf', name: 'Yusuf Haddad', age: 13, programs: ['After-School Tutoring'] },
];

let next = 1;
const row = (x) => ({
  id: `ci-${next++}`,
  topics: null,
  actionItems: null,
  privateNotes: null,
  followUpOn: null,
  shared: false,
  guardianInformed: false,
  createdAt: `2026-11-0${Math.min(5, next)}T20:00:00Z`,
  ...x,
});

const seeded = () => [
  row({ childId: 'c-jordan', youthName: 'Jordan Thompson', date: '2026-10-29', kind: 'OneToOne', engagement: 'Steady', topics: 'Science fair project: a water filter from a plastic bottle. Needs a cardboard tube and sand.', actionItems: 'Bring sand and a tube next week.', followUpOn: '2026-11-03' }),
  row({ childId: 'c-yusuf', youthName: 'Yusuf Haddad', date: '2026-11-04', kind: 'Call', engagement: 'Low', topics: 'Missed Tutoring night: football practice moved to Wednesdays. Open to coming on Tuesdays instead.', actionItems: 'Ask Jaylen about a Tuesday spot.', followUpOn: '2026-11-10' }),
];

const newState = (x = {}) => ({ who: 'daniel', modules: ON, failSave: false, failLoad: false, checkIns: seeded(), ...x });

const ME = {
  daniel: { personName: 'Daniel Osei', role: 'Mentor', membershipId: 'm-daniel' },
  hana: { personName: 'Hana Kim', role: 'Mentor', membershipId: 'm-hana' },
};

const RECORD = {
  id: 'c-mateo', name: 'Mateo Rivera', preferredName: null, pronouns: null, age: 9, school: 'Bennetto Elementary, Grade 4',
  programs: ['After-School Tutoring'], mentor: 'Daniel Osei',
  guardians: [
    { name: 'Carmen Rivera', relationship: 'Parent', mobile: '905-555-0142', email: 'carmen.rivera@example.com', isPrimary: true },
    { name: 'Luis Rivera', relationship: 'Uncle or aunt', mobile: '905-555-0199', email: null, isPrimary: false },
  ],
  recentAttendance: [{ session: 'Tutoring night', at: '2026-11-05T21:02:00Z', status: 'CheckedIn' }],
};

const history = (state, childId, kind) => {
  const items = (state.who === 'daniel' ? state.checkIns : [])
    .filter((r) => (!childId || r.childId === childId) && (!kind || r.kind === kind))
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  return { items, youth: state.who === 'daniel' ? YOUTH.map(({ id, name }) => ({ id, name })) : [] };
};

const followUps = (state) => {
  const latest = new Map();
  for (const r of state.who === 'daniel' ? state.checkIns : []) {
    const seen = latest.get(r.childId);
    if (!seen || r.date > seen.date || (r.date === seen.date && r.createdAt > seen.createdAt)) latest.set(r.childId, r);
  }
  return [...latest.values()]
    .filter((r) => r.followUpOn)
    .sort((a, b) => a.followUpOn.localeCompare(b.followUpOn))
    .map((r) => ({ childId: r.childId, youthName: r.youthName, followUpOn: r.followUpOn, overdue: r.followUpOn < TODAY }));
};

/** The Mentoring API as the real one answers Daniel. */
async function fakeApi(demo, state) {
  await demo.page.route('**/api/**', async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const path = url.pathname;
    const me = ME[state.who];
    if (path === '/api/me')
      return route.fulfill({ json: { ...me, organizationId: 'org-harbourview', organizationName: 'Harbourview Youth Collective', plan: 'Standard', modules: state.modules } });
    if (path === '/api/notifications') return route.fulfill({ json: { unread: 0, items: [] } });
    if (path === '/api/me/organizations') return route.fulfill({ json: { organizations: [] } });
    if (path.startsWith('/api/mentoring') && !state.modules.includes('Mentoring')) return route.fulfill({ status: 404 });
    const mine = state.who === 'daniel' ? YOUTH : [];
    if (path === '/api/mentoring/dashboard')
      return route.fulfill({
        json: {
          youth: mine,
          cohorts: state.who === 'daniel' ? [{ programId: 'p-tutoring', name: 'After-School Tutoring', term: '2026–27', role: 'Supporting', youthCount: 4 }] : [],
          checkedInThisWeek: state.who === 'daniel' ? 2 : 0,
          recentActivity: state.who === 'daniel' ? [{ childId: 'c-mateo', youthName: 'Mateo Rivera', kind: 'CheckedIn', session: 'Tutoring night', at: '2026-11-05T21:02:00Z' }] : [],
          followUps: followUps(state),
        },
      });
    if (path === '/api/mentoring/reviews') return route.fulfill({ json: { items: [] } });
    if (path === '/api/mentoring/youth/c-mateo') return route.fulfill({ json: RECORD });
    if (path === '/api/mentoring/youth/c-mateo/reflections') return route.fulfill({ json: { childId: 'c-mateo', name: 'Mateo Rivera', reflections: [] } });
    if (path === '/api/mentoring/check-ins' && req.method() === 'GET') {
      if (state.failLoad) return route.fulfill({ status: 500 });
      return route.fulfill({ json: history(state, url.searchParams.get('childId'), url.searchParams.get('kind')) });
    }
    if (path === '/api/mentoring/check-ins' && req.method() === 'POST') {
      if (state.failSave) return route.fulfill({ status: 500 });
      const b = req.postDataJSON();
      const errors = {};
      const child = YOUTH.find((y) => y.id === b.childId);
      if (!child) errors.childId = 'Choose a youth.';
      if (!b.date) errors.date = 'Choose the date.';
      else if (b.date > TODAY) errors.date = 'The date can’t be in the future.';
      if (!KINDS.includes(b.kind)) errors.kind = 'Choose how you met.';
      if (!ENGAGEMENTS.includes(b.engagement)) errors.engagement = 'Choose how it went.';
      if (b.followUpOn && b.date && b.followUpOn < b.date) errors.followUpOn = 'The follow-up can’t be before the check-in.';
      if (Object.keys(errors).length) return route.fulfill({ status: 422, json: { errors } });
      const saved = row({ ...b, youthName: child.name, createdAt: `2026-11-05T21:${String(10 + next).padStart(2, '0')}:00Z` });
      state.checkIns.push(saved);
      return route.fulfill({ status: 201, json: saved });
    }
    return route.fulfill({ status: 404 });
  });
}

const app = (demo) => demo.app();
const heading = (demo, name) => app(demo).getByRole('heading', { level: 1, name }).first().waitFor();
const shot = (demo, name) => demo.page.locator('iframe').screenshot({ path: join(shots, `${name}.png`) });
const scroll = async (demo, y) => {
  await app(demo).locator('body').evaluate((_, top) => window.scrollTo({ top, behavior: 'smooth' }), y);
  await demo.pause(1200);
};
const button = (demo, name) => app(demo).getByRole('button', { name });
const dialog = (demo) => app(demo).getByRole('dialog', { name: 'Log a mentor check-in' });
const dateField = async (demo, label, value) => {
  const field = dialog(demo).getByLabel(label, { exact: label === 'Date' });
  await demo.moveTo?.(field);
  await field.fill(value);
  await demo.pause(500);
};
const radio = (demo, group, name) => dialog(demo).getByRole('group', { name: group }).getByRole('radio', { name: new RegExp(`^${name}`) });
const box = (demo, label) => dialog(demo).getByRole('textbox', { name: new RegExp(`^${label}`) });

export default [
  {
    // Mateo's record: Log a mentor check-in, everything filled, saved, and the card shows it.
    name: 'log-desktop',
    run: async (demo) => {
      const state = newState();
      await fakeApi(demo, state);
      await demo.go('/mentoring/youth/c-mateo', { ready: false });
      await heading(demo, 'Mateo Rivera');
      demo.mark();
      await demo.pause(1400);
      await demo.click(button(demo, 'Log a mentor check-in').first());
      await dialog(demo).waitFor();
      await demo.pause(1200);
      await dateField(demo, 'Date', '2026-11-05');
      await demo.click(radio(demo, 'How you met', '1:1'));
      await demo.click(radio(demo, 'How it went', 'Engaged'));
      await demo.type(box(demo, 'What you talked about'), 'Fractions homework and the spelling bee on Friday.');
      await demo.type(box(demo, 'Action items'), 'Practise ten spelling words each night.');
      await demo.type(box(demo, 'Private notes'), 'Carmen says money is tight this month.');
      await dateField(demo, 'Next follow-up', '2026-11-12');
      await demo.click(dialog(demo).getByRole('checkbox', { name: 'Guardian was informed' }));
      await demo.pause(800);
      await shot(demo, 'desktop-dialog');
      await demo.click(button(demo, 'Save check-in'));
      await app(demo).getByText('Mentor check-in saved').first().waitFor();
      await app(demo).getByRole('region', { name: 'Mentor check-ins' }).scrollIntoViewIfNeeded();
      await demo.pause(2600);
      await shot(demo, 'desktop-record');
    },
  },
  {
    // The dashboard's Follow-ups, then Mentor check-ins: the history, a filter, and a shared session logged for Sofía.
    name: 'history-desktop',
    run: async (demo) => {
      const state = newState();
      state.checkIns.push(row({ childId: 'c-mateo', youthName: 'Mateo Rivera', date: '2026-11-05', kind: 'OneToOne', engagement: 'Engaged', topics: 'Fractions homework and the spelling bee on Friday.', actionItems: 'Practise ten spelling words each night.', privateNotes: 'Carmen says money is tight this month.', followUpOn: '2026-11-12', guardianInformed: true }));
      await fakeApi(demo, state);
      await demo.go('/mentoring', { ready: false });
      await heading(demo, 'Mentoring');
      demo.mark();
      await demo.pause(2600);
      await shot(demo, 'desktop-dashboard');
      await demo.click(app(demo).getByRole('link', { name: 'Mentor check-ins' }));
      await heading(demo, 'Mentor check-ins');
      await demo.pause(2600);
      await shot(demo, 'desktop-history');
      await demo.click(app(demo).getByLabel('Youth', { exact: true }));
      await app(demo).getByLabel('Youth', { exact: true }).selectOption({ label: 'Mateo Rivera' });
      await demo.pause(2000);
      await shot(demo, 'desktop-filtered');
      await app(demo).getByLabel('Youth', { exact: true }).selectOption({ label: 'All youth' });
      await demo.pause(1000);
      await demo.click(button(demo, 'Log a mentor check-in').first());
      await dialog(demo).waitFor();
      await dialog(demo).getByLabel('Youth', { exact: true }).selectOption({ label: 'Sofía Rivera' });
      await dateField(demo, 'Date', '2026-11-05');
      await demo.click(radio(demo, 'How you met', 'Session'));
      await demo.click(radio(demo, 'How it went', 'Thriving'));
      await demo.type(box(demo, 'What you talked about'), 'Led the group reflection on Pick Up the Towel.');
      await demo.click(dialog(demo).getByRole('switch', { name: 'Share with the youth and guardian' }));
      await demo.pause(1200);
      await shot(demo, 'desktop-shared');
      await demo.click(button(demo, 'Save check-in'));
      await app(demo).getByText('Mentor check-in saved').first().waitFor();
      await demo.pause(2600);
      await shot(demo, 'desktop-saved');
    },
  },
  {
    // On a phone: Follow-ups, the history and the dialog as a bottom sheet.
    name: 'phone',
    phone: true,
    run: async (demo) => {
      await fakeApi(demo, newState());
      await demo.go('/mentoring', { ready: false });
      await heading(demo, 'Mentoring');
      demo.mark();
      await app(demo).getByRole('region', { name: 'Follow-ups' }).scrollIntoViewIfNeeded();
      await demo.pause(2200);
      await shot(demo, 'phone-follow-ups');
      await demo.go('/mentoring/check-ins', { ready: false });
      await heading(demo, 'Mentor check-ins');
      await demo.pause(2000);
      await shot(demo, 'phone-history');
      await demo.click(button(demo, 'Log a mentor check-in').first());
      await dialog(demo).waitFor();
      await demo.pause(2200);
      await shot(demo, 'phone-dialog');
    },
  },
  {
    // Invalid, a failed save, an empty history, a failed load and Mentoring off.
    name: 'states-desktop',
    run: async (demo) => {
      const state = newState();
      await fakeApi(demo, state);
      await demo.go('/mentoring/youth/c-mateo', { ready: false });
      await heading(demo, 'Mateo Rivera');
      demo.mark();
      await demo.click(button(demo, 'Log a mentor check-in').first());
      await dialog(demo).waitFor();
      await dateField(demo, 'Date', '2026-11-09');
      await demo.click(radio(demo, 'How you met', 'Call'));
      await demo.click(radio(demo, 'How it went', 'Low'));
      await dateField(demo, 'Next follow-up', '2026-11-08');
      await demo.click(button(demo, 'Save check-in'));
      await dialog(demo).getByText('Fix these to continue').waitFor();
      await demo.pause(2400);
      await shot(demo, 'desktop-invalid');
      state.failSave = true;
      await dateField(demo, 'Date', '2026-11-05');
      await dateField(demo, 'Next follow-up', '2026-11-12');
      await demo.click(button(demo, 'Save check-in'));
      await dialog(demo).getByText('That didn’t go through').waitFor();
      await demo.pause(2200);
      await shot(demo, 'desktop-failed');
      await demo.click(button(demo, 'Cancel'));
      state.who = 'hana';
      await demo.go('/mentoring/check-ins', { ready: false });
      await app(demo).getByText('No mentor check-ins yet').waitFor();
      await demo.pause(2000);
      await shot(demo, 'desktop-empty');
      state.who = 'daniel';
      state.failLoad = true;
      await demo.go('/mentoring/check-ins', { ready: false });
      await app(demo).getByText('We couldn’t load your mentor check-ins').waitFor();
      await demo.pause(1800);
      await shot(demo, 'desktop-error');
      state.failLoad = false;
      state.modules = ON.filter((x) => x !== 'Mentoring');
      await demo.go('/mentoring/check-ins', { ready: false });
      await demo.pause(2400);
      await shot(demo, 'desktop-mentoring-off');
    },
  },
];
