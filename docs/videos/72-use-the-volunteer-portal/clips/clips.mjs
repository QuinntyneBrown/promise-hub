// Screen recordings and screenshots for video 72, made with tools/video-record/record-clips.mjs against the running
// frontend. The backend is faked like the e2e suite: Leo Martins (Volunteer at Harbourview Youth Collective) is assigned to
// tonight's Tutoring night and Saturday's Saturday Sports; he sees his session on Today, takes attendance with Present or
// Absent only, reads his schedule, and meets the empty, failed, cancelled, forbidden and Roll Call off states
// (L2-100, L2-101, ADR 0066). "Now" is Thu 5 Nov 2026, 4:12 pm in Hamilton.
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const shots = join(dirname(fileURLToPath(import.meta.url)), '..', 'shots');
const ON = ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports', 'Learning', 'Mentoring'];
const NOW = new Date('2026-11-05T21:12:00Z');

const PROGRAMS = {
  'p-tutoring': { name: 'After-School Tutoring', roster: ['c-jordan', 'c-mateo', 'c-sofia', 'c-yusuf'] },
  'p-sports': { name: 'Saturday Sports', roster: ['c-emily', 'c-kevin'] },
};
const CHILDREN = {
  'c-jordan': { name: 'Jordan Thompson', school: 'Hess Street School, Grade 6', household: 'h-thompson' },
  'c-mateo': { name: 'Mateo Rivera', school: 'Bennetto Elementary, Grade 4', household: 'h-rivera' },
  'c-sofia': { name: 'Sofía Rivera', school: 'Bennetto Elementary, Grade 7', household: 'h-rivera' },
  'c-yusuf': { name: 'Yusuf Haddad', school: 'École Pavillon de la jeunesse, Grade 8', household: 'h-haddad' },
  'c-emily': { name: 'Emily Tran', school: 'Queen Victoria School, Grade 5', household: 'h-tran' },
  'c-kevin': { name: 'Kevin Tran', school: 'Queen Victoria School, Grade 3', household: 'h-tran' },
};
const EVENTS = [
  { id: 'e-tutoring-today', programId: 'p-tutoring', name: 'Tutoring night', startsAt: '2026-11-05T21:00:00Z', endsAt: '2026-11-05T23:00:00Z', place: 'Harbourview Community Centre, Room 2', day: '2026-11-05' },
  { id: 'e-sports', programId: 'p-sports', name: 'Saturday Sports', startsAt: '2026-11-07T15:00:00Z', endsAt: '2026-11-07T17:00:00Z', place: 'Bennetto School gym', day: '2026-11-07' },
  { id: 'e-tutoring-yesterday', programId: 'p-tutoring', name: 'Tutoring night', startsAt: '2026-11-04T21:00:00Z', endsAt: '2026-11-04T23:00:00Z', place: 'Harbourview Community Centre, Room 2', day: '2026-11-04' },
];

const rec = (status, checkedInAt = null) => ({ status, checkedInAt, late: false, excused: false });
const newState = (x = {}) => ({
  modules: ON, assigned: ['e-tutoring-today', 'e-sports'], cancelled: [], records: { 'e-tutoring-today': {} }, failToday: false, failMine: false, ...x,
});

function summary(state, e) {
  const p = PROGRAMS[e.programId];
  const r = state.records[e.id] ?? {};
  const list = p.roster.map((c) => r[c]).filter(Boolean);
  const checkedIn = list.filter((x) => x.status === 'Present').length;
  const absent = list.filter((x) => x.status === 'Absent').length;
  return {
    id: e.id, name: e.name, programId: e.programId, programName: p.name, startsAt: e.startsAt, endsAt: e.endsAt, place: e.place, expected: p.roster.length,
    checkedIn, absent, notYet: p.roster.length - checkedIn - absent, status: state.cancelled.includes(e.id) ? 'Cancelled' : 'Scheduled', notes: null, late: 0, excused: 0,
  };
}

/** Roll Call as the real API answers Leo: only his assigned sessions, names without medical flags, Present or Absent only. */
async function fakeApi(demo, state) {
  await demo.page.clock.setFixedTime(NOW);
  await demo.page.route('**/api/**', async (route) => {
    const req = route.request();
    const path = new URL(req.url()).pathname;
    if (path === '/api/me')
      return route.fulfill({ json: { personName: 'Leo Martins', role: 'Volunteer', membershipId: 'm-leo', organizationId: 'org-harbourview', organizationName: 'Harbourview Youth Collective', plan: 'Standard', modules: state.modules } });
    if (path === '/api/notifications') return route.fulfill({ json: { unread: 0, items: [] } });
    if (path === '/api/me/organizations') return route.fulfill({ json: { organizations: [] } });
    if (path.startsWith('/api/sessions') && !state.modules.includes('RollCall')) return route.fulfill({ status: 404 });
    if (path === '/api/sessions/today') {
      if (state.failToday) return route.fulfill({ status: 500 });
      const sessions = EVENTS.filter((e) => e.day === '2026-11-05' && state.assigned.includes(e.id) && !state.cancelled.includes(e.id)).map((e) => summary(state, e));
      return route.fulfill({ json: { sessions } });
    }
    if (path === '/api/sessions/mine') {
      if (state.failMine) return route.fulfill({ status: 500 });
      const sessions = EVENTS.filter((e) => state.assigned.includes(e.id) && e.endsAt > NOW.toISOString()).map((e) => {
        const s = summary(state, e);
        return { id: e.id, name: e.name, programName: s.programName, day: e.day, startsAt: e.startsAt, endsAt: e.endsAt, place: e.place, expected: s.expected, status: s.status, today: e.day === '2026-11-05' };
      });
      return route.fulfill({ json: { sessions } });
    }
    const r = /^\/api\/sessions\/([^/]+)\/roster$/.exec(path);
    if (r) {
      if (!state.assigned.includes(r[1])) return route.fulfill({ status: 403, json: { code: 'forbidden' } });
      const e = EVENTS.find((x) => x.id === r[1]);
      const records = state.records[e.id] ?? {};
      return route.fulfill({
        json: {
          session: summary(state, e),
          children: PROGRAMS[e.programId].roster.map((id) => {
            const c = CHILDREN[id];
            const x = records[id];
            return { id, childId: id, householdId: c.household, name: c.name, age: null, school: c.school, medicalFlag: null, status: x?.status ?? 'NotYet', checkedInAt: x?.checkedInAt ?? null,
              walkIn: false, signedOutAt: null, collectedBy: null, noShow: null, noShowAt: null, conflict: false, late: false, excused: false };
          }),
        },
      });
    }
    const mark = /^\/api\/sessions\/([^/]+)\/(check-ins|absences)$/.exec(path);
    if (mark) {
      const b = req.postDataJSON();
      if (b.late || b.excused) return route.fulfill({ status: 403, json: { code: 'forbidden' } });
      state.records[mark[1]][b.childId] = mark[2] === 'check-ins' ? rec('Present', b.arrivedAt ?? NOW.toISOString()) : rec('Absent');
      return route.fulfill({ json: { status: 'saved' } });
    }
    return route.fulfill({ status: 404 });
  });
}

const app = (demo) => demo.app();
const heading = (demo, name) => app(demo).getByRole('heading', { name }).first().waitFor();
const shot = (demo, name) => demo.page.locator('iframe').screenshot({ path: join(shots, `${name}.png`) });
const row = (demo, name) => app(demo).getByRole('listitem').filter({ has: app(demo).getByText(name, { exact: true }) });
const dialog = (demo) => app(demo).getByRole('dialog');
const nav = (demo, label) => app(demo).getByRole('navigation', { name: /^Primary/ }).getByRole('link', { name: label }).first();

async function sheet(demo, name, choice, label) {
  await demo.click(row(demo, name).getByRole('button', { name: `More for ${name}` }));
  await dialog(demo).waitFor();
  await demo.pause(900);
  if (choice) await demo.click(dialog(demo).getByRole('radio', { name: new RegExp(`^${choice}`) }));
  await demo.pause(600);
  return () => demo.click(dialog(demo).getByRole('button', { name: label, exact: true }));
}

export default [
  {
    // Leo signs in to his Today, takes attendance for Tutoring night with Present or Absent only, and marks the rest present.
    name: 'today-desktop',
    run: async (demo) => {
      await fakeApi(demo, newState());
      await demo.go('/', { ready: false });
      await heading(demo, 'Welcome, Leo');
      demo.mark();
      await demo.pause(2600);
      await shot(demo, 'desktop-today');
      await demo.click(app(demo).getByRole('link', { name: 'Take attendance' }));
      await heading(demo, 'Tutoring night');
      await demo.pause(2000);
      await shot(demo, 'desktop-roster');
      const now = await sheet(demo, 'Yusuf Haddad', null, 'Check in');
      await shot(demo, 'desktop-sheet');
      await now();
      await demo.pause(1400);
      const absent = await sheet(demo, 'Sofía Rivera', 'Mark absent instead', 'Mark absent');
      await absent();
      await demo.pause(1600);
      await demo.click(app(demo).getByRole('button', { name: /^Mark the rest present/ }));
      await app(demo).getByText('2 marked present').first().waitFor();
      await demo.pause(2600);
      await shot(demo, 'desktop-all-marked');
    },
  },
  {
    // Schedule from his navigation: tonight marked Today with Take attendance, then Saturday Sports.
    name: 'schedule-desktop',
    run: async (demo) => {
      await fakeApi(demo, newState());
      await demo.go('/', { ready: false });
      await heading(demo, 'Welcome, Leo');
      demo.mark();
      await demo.pause(1400);
      await demo.click(nav(demo, 'Schedule'));
      await heading(demo, 'Your schedule');
      await demo.pause(3200);
      await shot(demo, 'desktop-schedule');
      await demo.click(app(demo).getByRole('link', { name: /^Take attendance for Tutoring night/ }));
      await heading(demo, 'Tutoring night');
      await demo.pause(2200);
    },
  },
  {
    // On a phone: Today, Schedule from the tab bar, and the roster.
    name: 'phone',
    phone: true,
    run: async (demo) => {
      await fakeApi(demo, newState());
      await demo.go('/', { ready: false });
      await heading(demo, 'Welcome, Leo');
      demo.mark();
      await demo.pause(2200);
      await shot(demo, 'phone-today');
      await demo.click(nav(demo, 'Schedule'));
      await heading(demo, 'Your schedule');
      await demo.pause(2400);
      await shot(demo, 'phone-schedule');
      await demo.click(app(demo).getByRole('link', { name: /^Take attendance for Tutoring night/ }));
      await heading(demo, 'Tutoring night');
      await demo.pause(2400);
      await shot(demo, 'phone-check-in');
    },
  },
  {
    // No session today, Today failing, a cancelled Saturday, an empty and a failed schedule, a session he is not assigned to,
    // and Roll Call off.
    name: 'states-desktop',
    run: async (demo) => {
      const state = newState({ assigned: ['e-sports'] });
      await fakeApi(demo, state);
      await demo.go('/', { ready: false });
      await heading(demo, 'No session today');
      demo.mark();
      await demo.pause(2000);
      await shot(demo, 'desktop-today-empty');
      state.failToday = true;
      await demo.go('/', { ready: false });
      await heading(demo, 'Your session didn’t load');
      await demo.pause(1800);
      await shot(demo, 'desktop-today-error');
      state.failToday = false;
      state.assigned = ['e-tutoring-today', 'e-sports'];
      state.cancelled = ['e-sports'];
      await demo.go('/my-schedule', { ready: false });
      await app(demo).getByText('Cancelled').first().waitFor();
      await demo.pause(2000);
      await shot(demo, 'desktop-schedule-cancelled');
      state.assigned = [];
      await demo.go('/my-schedule', { ready: false });
      await heading(demo, 'No sessions scheduled');
      await demo.pause(1800);
      await shot(demo, 'desktop-schedule-empty');
      state.failMine = true;
      await demo.go('/my-schedule', { ready: false });
      await heading(demo, 'We couldn’t load your schedule');
      await demo.pause(1800);
      await shot(demo, 'desktop-schedule-error');
      state.failMine = false;
      state.assigned = ['e-tutoring-today', 'e-sports'];
      await demo.go('/check-in/e-tutoring-yesterday', { ready: false });
      await heading(demo, 'You’re not assigned to this session');
      await demo.pause(2000);
      await shot(demo, 'desktop-forbidden');
      state.modules = ON.filter((m) => m !== 'RollCall' && m !== 'Pickup');
      await demo.go('/my-schedule', { ready: false });
      await heading(demo, 'Welcome, Leo');
      await demo.pause(2000);
      await shot(demo, 'desktop-rollcall-off');
    },
  },
];
