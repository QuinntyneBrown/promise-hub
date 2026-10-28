// Screen recordings and screenshots for video 71, made with tools/video-record/record-clips.mjs against the running
// frontend. The backend is faked like the e2e suite: Daniel Osei (Mentor, on After-School Tutoring's mentor team) takes
// attendance for Tutoring night with late, excused and Mark the rest present, online and offline; Marisol Delgado
// (Program director) reviews the cohort's history and rates and corrects a mark; Jaylen Okafor (Site lead) on a phone
// (L2-095 to L2-099, ADR 0065). "Now" is Thu 5 Nov 2026, 4:30 pm in Hamilton.
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const shots = join(dirname(fileURLToPath(import.meta.url)), '..', 'shots');
const ON = ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports', 'Learning', 'Mentoring'];
const NOW = new Date('2026-11-05T21:30:00Z');
const REASON = 'Nour Haddad emailed on Wednesday morning that Yusuf had a dentist appointment.';

const PROGRAMS = [
  { id: 'p-tutoring', name: 'After-School Tutoring', schedule: 'Mon–Thu, 4–6 pm', roster: ['c-jordan', 'c-mateo', 'c-sofia', 'c-yusuf'] },
  { id: 'p-sports', name: 'Saturday Sports', schedule: 'Sat, 10 am–12 pm', roster: ['c-emily', 'c-kevin'] },
  { id: 'p-winter', name: 'Winter Camp 2026', schedule: '21–23 Dec, 8 am–5 pm', roster: [] },
];
const CHILDREN = {
  'c-jordan': { name: 'Jordan Thompson', school: 'Hess Street School, Grade 6', household: 'h-thompson', flag: null },
  'c-mateo': { name: 'Mateo Rivera', school: 'Bennetto Elementary, Grade 4', household: 'h-rivera', flag: 'Allergy' },
  'c-sofia': { name: 'Sofía Rivera', school: 'Bennetto Elementary, Grade 7', household: 'h-rivera', flag: 'Medication' },
  'c-yusuf': { name: 'Yusuf Haddad', school: 'École Pavillon de la jeunesse, Grade 8', household: 'h-haddad', flag: 'Medication' },
  'c-emily': { name: 'Emily Tran', school: 'Queen Victoria School, Grade 5', household: 'h-tran', flag: null },
  'c-kevin': { name: 'Kevin Tran', school: 'Queen Victoria School, Grade 3', household: 'h-tran', flag: null },
};
const EVENTS = [
  { id: 'e-tutoring-today', programId: 'p-tutoring', name: 'Tutoring night', startsAt: '2026-11-05T21:00:00Z', endsAt: '2026-11-05T23:00:00Z', place: 'Harbourview Community Centre, Room 2', status: 'Scheduled' },
  { id: 'e-tutoring-wed', programId: 'p-tutoring', name: 'Tutoring night', startsAt: '2026-11-04T21:00:00Z', endsAt: '2026-11-04T23:00:00Z', place: 'Harbourview Community Centre, Room 2', status: 'Ended' },
  { id: 'e-tutoring-tue', programId: 'p-tutoring', name: 'Tutoring night', startsAt: '2026-11-03T21:00:00Z', endsAt: '2026-11-03T23:00:00Z', place: 'Harbourview Community Centre, Room 2', status: 'Ended' },
  { id: 'e-tutoring-mon', programId: 'p-tutoring', name: 'Tutoring night', startsAt: '2026-11-02T21:00:00Z', endsAt: '2026-11-02T23:00:00Z', place: 'Harbourview Community Centre, Room 2', status: 'Ended' },
  { id: 'e-tutoring-thu', programId: 'p-tutoring', name: 'Tutoring night', startsAt: '2026-10-29T20:00:00Z', endsAt: '2026-10-29T22:00:00Z', place: 'Harbourview Community Centre, Room 2', status: 'Scheduled' },
  { id: 'e-sports', programId: 'p-sports', name: 'Saturday Sports', startsAt: '2026-11-07T15:00:00Z', endsAt: '2026-11-07T17:00:00Z', place: 'Bennetto School gym', status: 'Scheduled' },
];

const ME = {
  daniel: { personName: 'Daniel Osei', role: 'Mentor', membershipId: 'm-daniel' },
  marisol: { personName: 'Marisol Delgado', role: 'ProgramDirector', membershipId: 'm-marisol' },
  jaylen: { personName: 'Jaylen Okafor', role: 'SiteLead', membershipId: 'm-jaylen' },
  aisha: { personName: 'Aisha Bello', role: 'YouthWorker', membershipId: 'm-aisha' },
};
const at = (h, m) => new Date(Date.UTC(2026, 10, 5, h + 5, m)).toISOString();
const rec = (status, checkedInAt = null, flags = {}) => ({ status, checkedInAt, late: false, excused: false, ...flags });

/** Last week's Tutoring nights as recorded; Thu 29 Oct was never recorded. */
function history() {
  return {
    'e-tutoring-wed': { 'c-jordan': rec('SignedOut', '2026-11-04T21:01:00Z'), 'c-mateo': rec('SignedOut', '2026-11-04T21:02:00Z'), 'c-sofia': rec('SignedOut', '2026-11-04T21:04:00Z'), 'c-yusuf': rec('Absent') },
    'e-tutoring-tue': { 'c-jordan': rec('SignedOut', '2026-11-03T21:20:00Z', { late: true }), 'c-mateo': rec('SignedOut', '2026-11-03T21:02:00Z'), 'c-sofia': rec('Absent', null, { excused: true }), 'c-yusuf': rec('SignedOut', '2026-11-03T21:05:00Z') },
    'e-tutoring-mon': { 'c-jordan': rec('SignedOut', '2026-11-02T21:01:00Z'), 'c-mateo': rec('SignedOut', '2026-11-02T21:02:00Z'), 'c-sofia': rec('SignedOut', '2026-11-02T21:03:00Z'), 'c-yusuf': rec('SignedOut', '2026-11-02T21:25:00Z', { late: true }) },
  };
}

const newState = (x = {}) => ({ who: 'daniel', modules: ON, records: { 'e-tutoring-today': {}, ...history() }, offline: false, failHistory: false, failCorrect: false, ...x });
const program = (id) => PROGRAMS.find((p) => p.id === id);

function summary(state, e) {
  const p = program(e.programId);
  const r = state.records[e.id] ?? {};
  const list = p.roster.map((c) => r[c]).filter(Boolean);
  const checkedIn = list.filter((x) => x.status === 'Present' || x.status === 'SignedOut').length;
  const absent = list.filter((x) => x.status === 'Absent').length;
  return {
    id: e.id, name: e.name, programId: p.id, programName: p.name, startsAt: e.startsAt, endsAt: e.endsAt, place: e.place, expected: p.roster.length,
    checkedIn, absent, notYet: p.roster.length - checkedIn - absent, status: e.status, notes: null,
    late: list.filter((x) => x.status !== 'Absent' && x.late).length, excused: list.filter((x) => x.status === 'Absent' && x.excused).length,
  };
}

function roster(state, e, medical) {
  const r = state.records[e.id] ?? {};
  return {
    session: summary(state, e),
    children: program(e.programId).roster.map((id) => {
      const c = CHILDREN[id];
      const x = r[id];
      return { id, childId: id, householdId: c.household, name: c.name, age: null, school: c.school, medicalFlag: medical ? c.flag : null, status: x?.status ?? 'NotYet',
        checkedInAt: x?.checkedInAt ?? null, walkIn: false, signedOutAt: null, collectedBy: null, noShow: null, noShowAt: null, conflict: false, late: !!x?.late, excused: !!x?.excused };
    }),
  };
}

const markOf = (x) => (!x ? null : x.status === 'Absent' ? (x.excused ? 'Excused' : 'Absent') : x.status === 'NotYet' ? null : x.late ? 'Late' : 'Present');
const rate = (a, m) => (m ? Math.round((100 * a) / m) : null);

function historyOf(state, programId) {
  const cohorts = (state.who === 'daniel' ? PROGRAMS.filter((p) => p.id === 'p-tutoring') : PROGRAMS).map((p) => ({ id: p.id, name: p.name }));
  const p = program(programId ?? cohorts[0].id);
  const now = NOW.toISOString();
  const events = EVENTS.filter((e) => e.programId === p.id && e.startsAt <= now).sort((a, b) => b.startsAt.localeCompare(a.startsAt));
  const all = [];
  const sessions = events.map((e) => {
    const marks = Object.entries(state.records[e.id] ?? {}).map(([c, x]) => ({ c, m: markOf(x) })).filter((x) => x.m);
    all.push(...marks);
    const n = (k) => marks.filter((x) => x.m === k).length;
    const attended = n('Present') + n('Late');
    const status = e.status !== 'Ended' && now < e.endsAt ? 'InProgress' : !marks.length ? 'NotRecorded' : e.status === 'Ended' || marks.length >= p.roster.length ? 'Recorded' : 'NeedsReview';
    return { eventId: e.id, name: e.name, startsAt: e.startsAt, present: n('Present'), late: n('Late'), excused: n('Excused'), absent: n('Absent'), rate: rate(attended, marks.length), status };
  });
  const youth = p.roster.map((id) => {
    const marks = all.filter((x) => x.c === id).map((x) => x.m);
    const a = marks.filter((m) => m === 'Present' || m === 'Late').length;
    return { childId: id, name: CHILDREN[id].name, attended: a, marked: marks.length, late: marks.filter((m) => m === 'Late').length, excused: marks.filter((m) => m === 'Excused').length,
      absent: marks.filter((m) => m === 'Absent').length, rate: rate(a, marks.length), belowThreshold: marks.length > 0 && a < 0.7 * marks.length };
  }).sort((a, b) => a.name.localeCompare(b.name));
  const attended = all.filter((x) => x.m === 'Present' || x.m === 'Late').length;
  return { cohorts, programId: p.id, programName: p.name, schedule: p.schedule, rate: rate(attended, all.length), sessionsRecorded: sessions.filter((s) => s.present + s.late + s.excused + s.absent).length,
    sessionsHeld: sessions.length, belowThreshold: youth.filter((y) => y.belowThreshold).length, canCorrect: state.who === 'marisol', sessions, youth };
}

/** Roll Call as the real API answers Daniel, Marisol, Jaylen or Aisha. */
async function fakeApi(demo, state) {
  await demo.page.clock.setFixedTime(NOW);
  await demo.page.route('**/api/**', async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const path = url.pathname;
    const me = ME[state.who];
    if (state.offline && path !== '/api/me') return route.abort('internetdisconnected');
    if (path === '/api/me')
      return route.fulfill({ json: { ...me, organizationId: 'org-harbourview', organizationName: 'Harbourview Youth Collective', plan: 'Standard', modules: state.modules } });
    if (path === '/api/notifications') return route.fulfill({ json: { unread: 0, items: [] } });
    if (path === '/api/me/organizations') return route.fulfill({ json: { organizations: [] } });
    if (path === '/api/today') return route.fulfill({ json: { activeChildren: 184, households: 112, slipsDue: null, events: [], tasks: [] } });
    const rollCall = state.modules.includes('RollCall');
    if ((path.startsWith('/api/sessions') || path === '/api/attendance') && !rollCall) return route.fulfill({ status: 404 });
    if (path === '/api/sessions/today') {
      const sessions = EVENTS.filter((e) => e.id === 'e-tutoring-today').map((e) => summary(state, e));
      return route.fulfill({ json: { sessions } });
    }
    const r = /^\/api\/sessions\/([^/]+)\/roster$/.exec(path);
    if (r) return route.fulfill({ json: roster(state, EVENTS.find((e) => e.id === r[1]), ['marisol', 'jaylen'].includes(state.who)) });
    const mark = /^\/api\/sessions\/([^/]+)\/(check-ins|absences)$/.exec(path);
    if (mark) {
      const b = req.postDataJSON();
      state.records[mark[1]][b.childId] = mark[2] === 'check-ins' ? rec('Present', b.arrivedAt ?? NOW.toISOString(), { late: !!b.late }) : rec('Absent', null, { excused: !!b.excused });
      return route.fulfill({ json: { status: 'saved' } });
    }
    const fix = /^\/api\/sessions\/([^/]+)\/attendance\/([^/]+)$/.exec(path);
    if (fix) {
      if (state.failCorrect) return route.fulfill({ status: 500 });
      const b = req.postDataJSON();
      if (!b.reason?.trim()) return route.fulfill({ status: 422, json: { errors: { reason: 'Say why you’re correcting it.' } } });
      const old = state.records[fix[1]][fix[2]];
      state.records[fix[1]][fix[2]] = b.status === 'Present' || b.status === 'Late' ? rec('Present', old?.checkedInAt ?? NOW.toISOString(), { late: b.status === 'Late' }) : rec('Absent', null, { excused: b.status === 'Excused' });
      return route.fulfill({ status: 204 });
    }
    if (path === '/api/attendance') {
      if (state.who === 'aisha') return route.fulfill({ status: 403, json: { code: 'forbidden' } });
      if (state.failHistory) return route.fulfill({ status: 500 });
      return route.fulfill({ json: historyOf(state, url.searchParams.get('programId')) });
    }
    return route.fulfill({ status: 404 });
  });
}

const app = (demo) => demo.app();
const heading = (demo, name) => app(demo).getByRole('heading', { level: 1, name }).first().waitFor();
const shot = (demo, name) => demo.page.locator('iframe').screenshot({ path: join(shots, `${name}.png`) });
const button = (demo, name) => app(demo).getByRole('button', { name, exact: true });
const row = (demo, name) => app(demo).getByRole('listitem').filter({ has: app(demo).getByText(name, { exact: true }) });
const dialog = (demo) => app(demo).getByRole('dialog');

async function mark(demo, name, choice, label) {
  await demo.click(row(demo, name).getByRole('button', { name: `More for ${name}` }));
  await dialog(demo).waitFor();
  await demo.pause(700);
  await demo.click(dialog(demo).getByRole('radio', { name: new RegExp(`^${choice}`) }));
  await demo.pause(600);
  return () => demo.click(dialog(demo).getByRole('button', { name: label }));
}

async function correct(demo, reason) {
  await demo.click(app(demo).getByRole('button', { name: /^Correct attendance for Tutoring night, Wed 4 Nov$/ }));
  await dialog(demo).waitFor();
  await demo.pause(900);
  await dialog(demo).getByLabel('Youth').selectOption({ label: 'Yusuf Haddad · Absent' });
  await demo.click(dialog(demo).getByRole('radio', { name: /^Excused/ }));
  if (reason) await demo.type(dialog(demo).getByLabel('Why are you correcting it?'), reason);
  await demo.pause(800);
}

export default [
  {
    // Daniel opens Check-in from his Today, marks Jordan late and Sofía excused, then marks the rest present.
    name: 'mentor-desktop',
    run: async (demo) => {
      await fakeApi(demo, newState());
      await demo.go('/', { ready: false });
      await heading(demo, 'Welcome, Daniel');
      demo.mark();
      await demo.pause(1800);
      await shot(demo, 'desktop-mentor-today');
      await demo.click(app(demo).getByRole('link', { name: /Check-in/ }).last());
      await heading(demo, 'Tutoring night');
      await demo.pause(1800);
      const late = await mark(demo, 'Jordan Thompson', 'Late', 'Check in late');
      await shot(demo, 'desktop-sheet-late');
      await late();
      await demo.pause(1400);
      const excused = await mark(demo, 'Sofía Rivera', 'Excused', 'Mark excused');
      await excused();
      await demo.pause(2000);
      await shot(demo, 'desktop-mentor-roster');
      await demo.click(app(demo).getByRole('button', { name: /^Mark the rest present/ }));
      await app(demo).getByText('2 marked present').first().waitFor();
      await demo.pause(2400);
      await shot(demo, 'desktop-all-marked');
    },
  },
  {
    // On a phone without signal: Daniel marks Yusuf late; it waits on the phone and syncs when signal returns.
    name: 'offline-phone',
    phone: true,
    run: async (demo) => {
      const state = newState();
      state.records['e-tutoring-today'] = { 'c-jordan': rec('Present', at(16, 21), { late: true }), 'c-mateo': rec('Present', at(16, 2)) };
      await fakeApi(demo, state);
      await demo.go('/check-in', { ready: false });
      await heading(demo, 'Tutoring night');
      demo.mark();
      await demo.pause(1600);
      state.offline = true;
      const late = await mark(demo, 'Yusuf Haddad', 'Late', 'Check in late');
      await late();
      await demo.pause(1200);
      const excused = await mark(demo, 'Sofía Rivera', 'Excused', 'Mark excused');
      await excused();
      await app(demo).getByText('2 queued').first().waitFor();
      await demo.pause(2200);
      await shot(demo, 'phone-offline');
      state.offline = false;
      await app(demo).evaluate(() => window.dispatchEvent(new Event('online')));
      await app(demo).getByText('2 check-ins synced').first().waitFor();
      await demo.pause(2400);
      await shot(demo, 'phone-synced');
    },
  },
  {
    // Marisol reviews After-School Tutoring: by session, then by youth.
    name: 'history-desktop',
    run: async (demo) => {
      const state = newState({ who: 'marisol' });
      state.records['e-tutoring-today'] = { 'c-jordan': rec('Present', at(16, 21), { late: true }), 'c-mateo': rec('Present', at(16, 2)), 'c-sofia': rec('Absent', null, { excused: true }), 'c-yusuf': rec('Present', at(16, 30)) };
      await fakeApi(demo, state);
      await demo.go('/check-in', { ready: false });
      await heading(demo, 'Tutoring night');
      demo.mark();
      await demo.pause(1200);
      await demo.click(app(demo).getByRole('link', { name: 'Attendance history' }));
      await heading(demo, 'Attendance history');
      await demo.pause(3200);
      await shot(demo, 'desktop-history');
      await demo.click(app(demo).getByRole('tab', { name: 'By youth' }));
      await demo.pause(3000);
      await shot(demo, 'desktop-by-youth');
    },
  },
  {
    // Marisol corrects Yusuf on Wed 4 Nov from Absent to Excused, with why.
    name: 'correct-desktop',
    run: async (demo) => {
      await fakeApi(demo, newState({ who: 'marisol' }));
      await demo.go('/check-in/history', { ready: false });
      await heading(demo, 'Attendance history');
      demo.mark();
      await demo.pause(1600);
      await correct(demo, REASON);
      await shot(demo, 'desktop-correct');
      await demo.click(button(demo, 'Save correction'));
      await app(demo).getByText('Attendance corrected').first().waitFor();
      await demo.pause(2600);
      await shot(demo, 'desktop-corrected');
    },
  },
  {
    // On a phone: Jaylen's roster with the totals' captions, and the history in one column.
    name: 'phone',
    phone: true,
    run: async (demo) => {
      const state = newState({ who: 'jaylen' });
      state.records['e-tutoring-today'] = { 'c-jordan': rec('Present', at(16, 21), { late: true }), 'c-sofia': rec('Absent', null, { excused: true }) };
      await fakeApi(demo, state);
      await demo.go('/check-in', { ready: false });
      await heading(demo, 'Tutoring night');
      demo.mark();
      await demo.pause(2200);
      await shot(demo, 'phone-check-in');
      await demo.click(app(demo).getByRole('link', { name: 'Attendance history' }));
      await heading(demo, 'Attendance history');
      await demo.pause(2400);
      await shot(demo, 'phone-history');
    },
  },
  {
    // Refused and failed: a correction with no reason, a failed save, a cohort with no session yet, the history failing,
    // a youth worker, and Roll Call off.
    name: 'states-desktop',
    run: async (demo) => {
      const state = newState({ who: 'marisol' });
      await fakeApi(demo, state);
      await demo.go('/check-in/history', { ready: false });
      await heading(demo, 'Attendance history');
      demo.mark();
      await correct(demo, '');
      await demo.click(button(demo, 'Save correction'));
      await dialog(demo).getByText('Say why you’re correcting it.').first().waitFor();
      await demo.pause(2000);
      await shot(demo, 'desktop-correct-invalid');
      state.failCorrect = true;
      await demo.type(dialog(demo).getByLabel('Why are you correcting it?'), 'Dentist.');
      await demo.click(button(demo, 'Save correction'));
      await dialog(demo).getByText('That didn’t go through').waitFor();
      await demo.pause(2000);
      await shot(demo, 'desktop-correct-failed');
      await demo.click(button(demo, 'Cancel'));
      await app(demo).getByLabel('Cohort').selectOption({ label: 'Saturday Sports' });
      await app(demo).getByText('No attendance recorded yet').waitFor();
      await demo.pause(2000);
      await shot(demo, 'desktop-history-empty');
      state.failHistory = true;
      await demo.go('/check-in/history', { ready: false });
      await app(demo).getByText('We couldn’t load attendance').waitFor();
      await demo.pause(1800);
      await shot(demo, 'desktop-history-error');
      state.failHistory = false;
      state.who = 'aisha';
      await demo.go('/check-in/history', { ready: false });
      await heading(demo, 'Attendance history is for site leads, directors and mentors');
      await demo.pause(1800);
      await shot(demo, 'desktop-forbidden');
      state.who = 'daniel';
      state.modules = ON.filter((m) => m !== 'RollCall' && m !== 'Pickup');
      await demo.go('/check-in', { ready: false });
      await heading(demo, 'Welcome, Daniel');
      await demo.pause(2000);
      await shot(demo, 'desktop-rollcall-off');
    },
  },
];
