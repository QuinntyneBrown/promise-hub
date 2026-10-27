// Screen recordings and screenshots for video 55, made with tools/video-record/record-clips.mjs against the
// running frontend. The backend is faked like the e2e suite: Daniel mentors Mateo directly, leads Saturday Sports
// and supports After-School Tutoring; Hana has no assignments (L2-063, L2-064, L2-065).
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const shots = join(dirname(fileURLToPath(import.meta.url)), '..', 'shots');
const org = { organizationId: 'org-harbourview', organizationName: 'Harbourview Youth Collective', plan: 'Standard' };
const mentor = (personName, rollCall = true) => ({ personName, role: 'Mentor', ...org, modules: rollCall ? ['Roster', 'RollCall', 'Mentoring'] : ['Roster', 'Mentoring'] });

const youth = [
  { id: 'c-emily', name: 'Emily Tran', age: 10, programs: ['Saturday Sports'] },
  { id: 'c-jordan', name: 'Jordan Thompson', age: 11, programs: ['After-School Tutoring'] },
  { id: 'c-kevin', name: 'Kevin Tran', age: 8, programs: ['Saturday Sports'] },
  { id: 'c-mateo', name: 'Mateo Rivera', age: 9, programs: ['After-School Tutoring'] },
  { id: 'c-sofia', name: 'Sofía Rivera', age: 12, programs: ['After-School Tutoring'] },
  { id: 'c-yusuf', name: 'Yusuf Haddad', age: 13, programs: ['After-School Tutoring'] },
];
const cohorts = [
  { programId: 'p-tutoring', name: 'After-School Tutoring', term: '2026–27', role: 'Supporting', youthCount: 4 },
  { programId: 'p-sports', name: 'Saturday Sports', term: '2026–27', role: 'Lead', youthCount: 2 },
];
const activity = [
  { childId: 'c-jordan', youthName: 'Jordan Thompson', kind: 'CheckedIn', session: 'Tutoring night', at: '2026-11-05T21:05:00Z' },
  { childId: 'c-mateo', youthName: 'Mateo Rivera', kind: 'CheckedIn', session: 'Tutoring night', at: '2026-11-05T21:02:00Z' },
  { childId: 'c-sofia', youthName: 'Sofía Rivera', kind: 'SignedOut', session: 'Tutoring night', at: '2026-11-04T23:01:00Z' },
  { childId: 'c-yusuf', youthName: 'Yusuf Haddad', kind: 'Absent', session: 'Tutoring night', at: '2026-11-04T21:00:00Z' },
];
const records = {
  'c-mateo': {
    id: 'c-mateo', name: 'Mateo Rivera', preferredName: null, pronouns: null, age: 9, school: 'Bennetto Elementary, Grade 4',
    programs: ['After-School Tutoring'], mentor: 'Daniel Osei',
    guardians: [
      { name: 'Carmen Rivera', relationship: 'Mother', mobile: '905-555-0142', email: 'carmen.rivera@example.com', isPrimary: true },
      { name: 'Luis Rivera', relationship: 'Uncle or aunt', mobile: '905-555-0199', email: null, isPrimary: false },
    ],
    recentAttendance: [
      { session: 'Tutoring night', at: '2026-11-05T21:02:00Z', status: 'CheckedIn' },
      { session: 'Tutoring night', at: '2026-11-04T23:00:00Z', status: 'SignedOut' },
      { session: 'Tutoring night', at: '2026-11-03T21:00:00Z', status: 'Absent' },
    ],
  },
  'c-jordan': {
    id: 'c-jordan', name: 'Jordan Thompson', preferredName: null, pronouns: null, age: 11, school: 'Hess Street School, Grade 6',
    programs: ['After-School Tutoring'], mentor: null,
    guardians: [{ name: 'Dana Thompson', relationship: 'Mother', mobile: '905-555-0117', email: 'dana.thompson@example.com', isPrimary: true }],
    recentAttendance: [{ session: 'Tutoring night', at: '2026-11-05T21:05:00Z', status: 'CheckedIn' }],
  },
};
const tutoring = {
  programId: 'p-tutoring', name: 'After-School Tutoring', term: '2026–27', schedule: 'Mon–Thu, 4–6 pm', role: 'Supporting', lead: 'Hana Kim', supporting: ['Daniel Osei'],
  members: [
    { id: 'c-jordan', name: 'Jordan Thompson', age: 11, mentor: null },
    { id: 'c-mateo', name: 'Mateo Rivera', age: 9, mentor: 'Daniel Osei' },
    { id: 'c-sofia', name: 'Sofía Rivera', age: 12, mentor: 'Hana Kim' },
    { id: 'c-yusuf', name: 'Yusuf Haddad', age: 13, mentor: null },
  ],
};

/** The API as the real one answers a mentor; `state` chooses who is signed in, Roll Call and a pending failure. */
async function fakeApi(demo, state) {
  await demo.page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    const hana = state.who === 'Hana Kim';
    if (state.failNext && path === state.failNext) {
      state.failNext = null;
      return route.fulfill({ status: 500, json: { code: 'server-error', reference: 'ERR-7K2M' } });
    }
    if (path === '/api/me') return route.fulfill({ json: mentor(state.who, state.rollCall) });
    if (path === '/api/notifications') return route.fulfill({ json: { unread: 0, items: [] } });
    if (path === '/api/me/organizations') return route.fulfill({ json: { organizations: [] } });
    if (path === '/api/mentoring/dashboard') {
      if (hana) return route.fulfill({ json: { youth: [], cohorts: [], checkedInThisWeek: 0, recentActivity: [] } });
      return route.fulfill({ json: { youth, cohorts, checkedInThisWeek: state.rollCall ? 4 : null, recentActivity: state.rollCall ? activity : null } });
    }
    if (path === '/api/mentoring/youth') return route.fulfill({ json: { youth: hana ? [] : youth } });
    const record = /^\/api\/mentoring\/youth\/([^/]+)$/.exec(path);
    if (record) {
      const r = records[record[1]];
      if (!r) return route.fulfill({ status: 403, json: { code: 'forbidden' } });
      return route.fulfill({ json: { ...r, recentAttendance: state.rollCall ? r.recentAttendance : null } });
    }
    if (path === '/api/mentoring/cohorts/p-tutoring') return route.fulfill({ json: tutoring });
    if (path.startsWith('/api/mentoring/cohorts/')) return route.fulfill({ status: 403, json: { code: 'forbidden' } });
    return route.fulfill({ status: 404 });
  });
}

const heading = (demo, level, name) => demo.app().getByRole('heading', { level, name }).waitFor();
const shot = (demo, name) => demo.page.locator('iframe').screenshot({ path: join(shots, `${name}.png`) });

export default [
  {
    // Daniel opens Mentoring: his numbers, first five youth, cohorts and recent activity; then My youth and a search.
    name: 'dashboard-desktop',
    run: async (demo) => {
      const state = { who: 'Daniel Osei', rollCall: true };
      await fakeApi(demo, state);
      await demo.go('/mentoring', { ready: false });
      await demo.app().getByRole('heading', { name: 'Recent activity' }).waitFor();
      demo.mark();
      await demo.pause(2400);
      await shot(demo, 'desktop-dashboard');
      await demo.click(demo.app().getByRole('link', { name: /^View all/ }));
      await heading(demo, 1, 'My youth');
      await demo.pause(1200);
      await demo.type(demo.app().getByRole('searchbox', { name: 'Search your youth' }), 'tran');
      await demo.pause(1400);
      await shot(demo, 'desktop-my-youth-search');
      await demo.app().getByRole('searchbox', { name: 'Search your youth' }).fill('');
      await demo.type(demo.app().getByRole('searchbox', { name: 'Search your youth' }), 'zed');
      await demo.app().getByRole('heading', { name: /^No youth match/ }).waitFor();
      await demo.pause(1400);
      await shot(demo, 'desktop-no-results');
      await demo.click(demo.app().getByRole('button', { name: 'Clear search' }));
      await demo.pause(1600);
    },
  },
  {
    // On a phone: the dashboard, then Mateo's record from My youth, then a youth who is not his.
    name: 'record-phone',
    phone: true,
    run: async (demo) => {
      const state = { who: 'Daniel Osei', rollCall: true };
      await fakeApi(demo, state);
      await demo.go('/mentoring/youth', { ready: false });
      await heading(demo, 1, 'My youth');
      demo.mark();
      await demo.pause(1200);
      await demo.click(demo.app().getByRole('link', { name: /^Mateo Rivera/ }));
      await heading(demo, 1, 'Mateo Rivera');
      await demo.pause(1600);
      await shot(demo, 'phone-record');
      await demo.app().getByRole('heading', { name: 'Guardian contacts' }).scrollIntoViewIfNeeded();
      await demo.pause(2000);
      await demo.app().getByText('Medical details stay with staff on site').scrollIntoViewIfNeeded();
      await demo.pause(1600);
      await shot(demo, 'phone-record-contacts');
      await demo.go('/mentoring/youth/c-amara', { ready: false });
      await demo.app().getByRole('heading', { name: 'This youth isn’t assigned to you' }).waitFor();
      await demo.pause(1800);
      await shot(demo, 'phone-record-forbidden');
    },
  },
  {
    // From My cohorts, Daniel opens After-School Tutoring and then Jordan from its members.
    name: 'cohort-desktop',
    run: async (demo) => {
      const state = { who: 'Daniel Osei', rollCall: true };
      await fakeApi(demo, state);
      await demo.go('/mentoring', { ready: false });
      await demo.app().getByRole('list', { name: 'Your cohorts' }).waitFor();
      demo.mark();
      await demo.pause(1200);
      await demo.click(demo.app().getByRole('list', { name: 'Your cohorts' }).getByRole('link', { name: /^After-School Tutoring/ }));
      await heading(demo, 1, 'After-School Tutoring');
      await demo.pause(2000);
      await shot(demo, 'desktop-cohort');
      await demo.click(demo.app().getByRole('list', { name: 'Members' }).getByRole('link', { name: /^Jordan Thompson/ }));
      await heading(demo, 1, 'Jordan Thompson');
      await demo.pause(2000);
      await shot(demo, 'desktop-record-jordan');
    },
  },
  {
    // Hana with no assignments, a failed load with Try again, and Roll Call off.
    name: 'states-desktop',
    run: async (demo) => {
      const state = { who: 'Hana Kim', rollCall: true };
      await fakeApi(demo, state);
      await demo.go('/mentoring', { ready: false });
      await demo.app().getByRole('heading', { name: 'No youth assigned yet' }).waitFor();
      demo.mark();
      await demo.pause(1800);
      await shot(demo, 'desktop-empty');
      state.who = 'Daniel Osei';
      state.failNext = '/api/mentoring/dashboard';
      await demo.go('/mentoring', { ready: false });
      await demo.app().getByRole('heading', { name: 'We couldn’t load your dashboard' }).waitFor();
      await demo.pause(1400);
      await shot(demo, 'desktop-error');
      await demo.click(demo.app().getByRole('button', { name: 'Try again' }));
      await demo.app().getByRole('heading', { name: 'Recent activity' }).waitFor();
      await demo.pause(1200);
      state.rollCall = false;
      await demo.go('/mentoring', { ready: false });
      await demo.app().getByRole('heading', { name: 'My cohorts' }).waitFor();
      await demo.pause(1800);
      await shot(demo, 'desktop-rollcall-off');
    },
  },
];
