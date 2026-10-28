// Screen recordings and screenshots for video 68, made with tools/video-record/record-clips.mjs against the
// running frontend. The backend is faked like the e2e suite: Daniel Osei (Mentor, Harbourview) mentors Mateo Rivera
// directly and supports After-School Tutoring (Jordan, Sofía, Yusuf); he raises at-risk flags, Marisol Delgado
// (Program director) is told, reads every flag and resolves them (L2-091, ADR 0062).
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const shots = join(dirname(fileURLToPath(import.meta.url)), '..', 'shots');
const ON = ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports', 'Learning', 'Mentoring'];
const SEVERITIES = ['Low', 'Medium', 'High'];
const OUTCOMES = ['Reconnected', 'HandedToDirector', 'LeftProgram', 'FlaggedInError'];

const YOUTH = [
  { id: 'c-jordan', name: 'Jordan Thompson', age: 11, programs: ['After-School Tutoring'] },
  { id: 'c-mateo', name: 'Mateo Rivera', age: 9, programs: ['After-School Tutoring'] },
  { id: 'c-sofia', name: 'Sofía Rivera', age: 12, programs: ['After-School Tutoring'] },
  { id: 'c-yusuf', name: 'Yusuf Haddad', age: 13, programs: ['After-School Tutoring'] },
];

let next = 1;
const flag = (x) => ({
  id: `flag-${next++}`,
  status: 'Open',
  outcome: null,
  resolutionNote: null,
  resolvedBy: null,
  resolvedAt: null,
  ...x,
});

const seeded = () => [
  flag({ childId: 'c-yusuf', youthName: 'Yusuf Haddad', severity: 'High', raisedBy: 'Daniel Osei', raisedAt: '2026-11-04T22:10:00Z', reason: 'Missed three Tutoring nights in a row and stopped answering my messages. He said things at home are hard right now.' }),
  flag({ childId: 'c-jordan', youthName: 'Jordan Thompson', severity: 'Medium', raisedBy: 'Hana Kim', raisedAt: '2026-11-02T21:30:00Z', reason: 'Falling behind on homework and withdrawn at Tutoring night. Says he isn’t sleeping much.' }),
  flag({ childId: 'c-emily', youthName: 'Emily Tran', severity: 'Low', raisedBy: 'Daniel Osei', raisedAt: '2026-10-24T15:00:00Z', reason: 'Quiet at Saturday Sports for two weeks and sitting out the drills.', status: 'Resolved', outcome: 'Reconnected', resolvedBy: 'Daniel Osei', resolvedAt: '2026-10-31T15:00:00Z', resolutionNote: 'Her best friend moved away. She’s back in the drills and paired with Kevin.' }),
];

const newState = (x = {}) => ({ who: 'daniel', modules: ON, failSave: false, failLoad: false, flags: seeded(), notices: [], ...x });

const ME = {
  daniel: { personName: 'Daniel Osei', role: 'Mentor', membershipId: 'm-daniel' },
  hana: { personName: 'Hana Kim', role: 'Mentor', membershipId: 'm-hana' },
  marisol: { personName: 'Marisol Delgado', role: 'ProgramDirector', membershipId: 'm-marisol' },
};

const mentor = (state) => state.who !== 'marisol';

const list = (state, status) => {
  const visible = state.who === 'hana' ? [] : state.flags;
  const resolved = status === 'Resolved';
  const items = visible
    .filter((f) => (resolved ? f.status === 'Resolved' : f.status === 'Open'))
    .sort((a, b) => (resolved ? b.resolvedAt.localeCompare(a.resolvedAt) : SEVERITIES.indexOf(b.severity) - SEVERITIES.indexOf(a.severity) || b.raisedAt.localeCompare(a.raisedAt)));
  return {
    items,
    openCount: visible.filter((f) => f.status === 'Open').length,
    resolvedCount: visible.filter((f) => f.status === 'Resolved').length,
    youth: mentor(state) ? YOUTH.map(({ id, name }) => ({ id, name })) : [],
    canRaise: mentor(state),
  };
};

/** The Mentoring API as the real one answers Daniel, Hana or Marisol. */
async function fakeApi(demo, state) {
  await demo.page.route('**/api/**', async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const path = url.pathname;
    const me = ME[state.who];
    if (path === '/api/me')
      return route.fulfill({ json: { ...me, organizationId: 'org-harbourview', organizationName: 'Harbourview Youth Collective', plan: 'Standard', modules: state.modules } });
    if (path === '/api/notifications')
      return route.fulfill({ json: { unread: state.notices.filter((n) => !n.readAt).length, items: state.modules.includes('Mentoring') ? state.notices : [] } });
    if (path.startsWith('/api/notifications/')) return route.fulfill({ status: 204 });
    if (path === '/api/me/organizations') return route.fulfill({ json: { organizations: [] } });
    if (path === '/api/today') return route.fulfill({ json: { tasks: [], events: [], counts: {} } });
    if (path.startsWith('/api/mentoring') && !state.modules.includes('Mentoring')) return route.fulfill({ status: 404 });
    if (path === '/api/mentoring/dashboard')
      return route.fulfill({
        json: {
          youth: YOUTH,
          cohorts: [{ programId: 'p-tutoring', name: 'After-School Tutoring', term: '2026–27', role: 'Supporting', youthCount: 4 }],
          checkedInThisWeek: 2,
          recentActivity: [{ childId: 'c-mateo', youthName: 'Mateo Rivera', kind: 'CheckedIn', session: 'Tutoring night', at: '2026-11-05T21:02:00Z' }],
          followUps: [],
        },
      });
    if (path === '/api/mentoring/reviews') return route.fulfill({ json: { items: [] } });
    if (path === '/api/mentoring/flags' && req.method() === 'GET') {
      if (state.failLoad) return route.fulfill({ status: 500 });
      return route.fulfill({ json: list(state, url.searchParams.get('status')) });
    }
    if (path === '/api/mentoring/flags' && req.method() === 'POST') {
      if (state.failSave) return route.fulfill({ status: 500 });
      const b = req.postDataJSON();
      const errors = {};
      const child = YOUTH.find((y) => y.id === b.childId);
      if (!child) errors.childId = 'Choose a youth.';
      if (!SEVERITIES.includes(b.severity)) errors.severity = 'Choose how serious it is.';
      if (!b.reason?.trim()) errors.reason = 'Say why you’re worried.';
      if (Object.keys(errors).length) return route.fulfill({ status: 422, json: { errors } });
      if (state.flags.some((f) => f.childId === child.id && f.status === 'Open')) return route.fulfill({ status: 409, json: { code: 'already-flagged' } });
      const saved = flag({ childId: child.id, youthName: child.name, severity: b.severity, reason: b.reason, raisedBy: me.personName, raisedAt: '2026-11-05T21:20:00Z' });
      state.flags.push(saved);
      return route.fulfill({ status: 201, json: saved });
    }
    const resolve = path.match(/^\/api\/mentoring\/flags\/([^/]+)\/resolve$/);
    if (resolve) {
      const b = req.postDataJSON();
      if (!OUTCOMES.includes(b.outcome)) return route.fulfill({ status: 422, json: { errors: { outcome: 'Choose how it was resolved.' } } });
      const f = state.flags.find((x) => x.id === resolve[1]);
      if (f.status === 'Resolved') return route.fulfill({ status: 409, json: { code: 'already-resolved' } });
      Object.assign(f, { status: 'Resolved', outcome: b.outcome, resolutionNote: b.note, resolvedBy: me.personName, resolvedAt: '2026-11-05T21:40:00Z' });
      return route.fulfill({ json: f });
    }
    return route.fulfill({ status: 404 });
  });
}

const app = (demo) => demo.app();
const heading = (demo, name) => app(demo).getByRole('heading', { level: 1, name }).first().waitFor();
const shot = (demo, name) => demo.page.locator('iframe').screenshot({ path: join(shots, `${name}.png`) });
const button = (demo, name) => app(demo).getByRole('button', { name });
const raiseDialog = (demo) => app(demo).getByRole('dialog', { name: 'Raise an at-risk flag' });
const resolveDialog = (demo) => app(demo).getByRole('dialog', { name: 'Resolve this flag?' });
const row = (demo, youth) => app(demo).getByRole('listitem').filter({ hasText: youth });
const notice = { id: 'n-1', kind: 'mentoring', text: 'Daniel Osei flagged Mateo Rivera as at risk (Medium).', link: '/mentoring/flags', createdAt: '2026-11-05T21:20:00Z', readAt: null };

export default [
  {
    // Daniel's dashboard, At-risk flags most serious first, and a flag raised on Mateo.
    name: 'raise-desktop',
    run: async (demo) => {
      await fakeApi(demo, newState());
      await demo.go('/mentoring', { ready: false });
      await heading(demo, 'Mentoring');
      demo.mark();
      await demo.pause(1600);
      await demo.click(app(demo).getByRole('link', { name: 'At-risk flags' }));
      await heading(demo, 'At-risk flags');
      await demo.pause(2600);
      await shot(demo, 'desktop-flags');
      await demo.click(button(demo, 'Raise a flag').first());
      await raiseDialog(demo).waitFor();
      await demo.pause(1000);
      await raiseDialog(demo).getByLabel('Youth', { exact: true }).selectOption({ label: 'Mateo Rivera' });
      await demo.pause(600);
      await demo.click(raiseDialog(demo).getByRole('radio', { name: /^Medium/ }));
      await demo.type(raiseDialog(demo).getByRole('textbox', { name: /^Why are you worried/ }), 'Asked me twice whether he could stay late because nobody is home after school.');
      await demo.pause(1200);
      await shot(demo, 'desktop-dialog');
      await demo.click(button(demo, 'Raise flag'));
      await app(demo).getByText('Flag raised').first().waitFor();
      await demo.pause(2600);
      await shot(demo, 'desktop-raised');
    },
  },
  {
    // Marisol's notification, every flag with Report an incident, a flag resolved and the Resolved tab.
    name: 'director-desktop',
    run: async (demo) => {
      const state = newState({ who: 'marisol', notices: [notice] });
      state.flags.push(flag({ childId: 'c-mateo', youthName: 'Mateo Rivera', severity: 'Medium', raisedBy: 'Daniel Osei', raisedAt: '2026-11-05T21:20:00Z', reason: 'Asked me twice whether he could stay late because nobody is home after school.' }));
      await fakeApi(demo, state);
      await demo.go('/notifications', { ready: false });
      await heading(demo, 'Notifications');
      demo.mark();
      await demo.pause(2200);
      await shot(demo, 'desktop-notification');
      await demo.click(app(demo).getByRole('link', { name: notice.text }));
      await heading(demo, 'At-risk flags');
      await demo.pause(2800);
      await shot(demo, 'desktop-director');
      await demo.click(row(demo, 'Jordan Thompson').getByRole('button', { name: 'Resolve' }));
      await resolveDialog(demo).waitFor();
      await demo.pause(1000);
      await demo.click(resolveDialog(demo).getByRole('radio', { name: 'Reconnected, back on track' }));
      await demo.type(resolveDialog(demo).getByRole('textbox', { name: /^Note/ }), 'Hana set up homework help on Tuesdays; he is sleeping better.');
      await demo.pause(1200);
      await shot(demo, 'desktop-resolve');
      await demo.click(button(demo, 'Resolve flag'));
      await app(demo).getByText('Flag resolved').first().waitFor();
      await demo.pause(1800);
      await demo.click(app(demo).getByRole('tab', { name: /^Resolved/ }));
      await demo.pause(2600);
      await shot(demo, 'desktop-resolved');
    },
  },
  {
    // On a phone: the flags in one column and the raise dialog as a bottom sheet.
    name: 'phone',
    phone: true,
    run: async (demo) => {
      await fakeApi(demo, newState());
      await demo.go('/mentoring/flags', { ready: false });
      await heading(demo, 'At-risk flags');
      demo.mark();
      await demo.pause(2400);
      await shot(demo, 'phone-flags');
      await demo.click(button(demo, 'Raise a flag').first());
      await raiseDialog(demo).waitFor();
      await demo.pause(2200);
      await shot(demo, 'phone-dialog');
    },
  },
  {
    // Invalid, already flagged, a failed save, an empty list, a failed load, the Incident log off and Mentoring off.
    name: 'states-desktop',
    run: async (demo) => {
      const state = newState();
      await fakeApi(demo, state);
      await demo.go('/mentoring/flags', { ready: false });
      await heading(demo, 'At-risk flags');
      demo.mark();
      await demo.click(button(demo, 'Raise a flag').first());
      await raiseDialog(demo).waitFor();
      await demo.click(button(demo, 'Raise flag'));
      await raiseDialog(demo).getByText('Fix these to continue').waitFor();
      await demo.pause(2400);
      await shot(demo, 'desktop-invalid');
      await raiseDialog(demo).getByLabel('Youth', { exact: true }).selectOption({ label: 'Yusuf Haddad' });
      await demo.click(raiseDialog(demo).getByRole('radio', { name: /^Low/ }));
      await demo.type(raiseDialog(demo).getByRole('textbox', { name: /^Why are you worried/ }), 'Quiet at Tutoring night.');
      await demo.click(button(demo, 'Raise flag'));
      await raiseDialog(demo).getByText('Yusuf Haddad already has an open flag').waitFor();
      await demo.pause(2200);
      await shot(demo, 'desktop-already-flagged');
      state.failSave = true;
      await raiseDialog(demo).getByLabel('Youth', { exact: true }).selectOption({ label: 'Sofía Rivera' });
      await demo.click(button(demo, 'Raise flag'));
      await raiseDialog(demo).getByText('That didn’t go through').waitFor();
      await demo.pause(2000);
      await shot(demo, 'desktop-failed');
      await demo.click(button(demo, 'Cancel'));
      state.who = 'hana';
      await demo.go('/mentoring/flags', { ready: false });
      await app(demo).getByText('No youth flagged').waitFor();
      await demo.pause(2000);
      await shot(demo, 'desktop-empty');
      state.who = 'daniel';
      state.failLoad = true;
      await demo.go('/mentoring/flags', { ready: false });
      await app(demo).getByText('We couldn’t load the at-risk flags').waitFor();
      await demo.pause(1800);
      await shot(demo, 'desktop-error');
      state.failLoad = false;
      state.who = 'marisol';
      state.modules = ON.filter((x) => x !== 'Incidents');
      await demo.go('/mentoring/flags', { ready: false });
      await heading(demo, 'At-risk flags');
      await demo.pause(2200);
      await shot(demo, 'desktop-incidents-off');
      state.who = 'daniel';
      state.modules = ON.filter((x) => x !== 'Mentoring');
      await demo.go('/mentoring/flags', { ready: false });
      await demo.pause(2400);
      await shot(demo, 'desktop-mentoring-off');
    },
  },
];
