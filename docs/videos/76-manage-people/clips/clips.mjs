// Screen recordings and screenshots for video 76, made with tools/video-record/record-clips.mjs against the running
// frontend. The backend is faked like the e2e suite: Tom Nguyen (Admin at Harbourview Youth Collective) opens People from
// his menu, filters and searches the directory, opens Sofía Rivera's and Leo Martins's records, makes Leo a youth worker,
// deactivates and reactivates him; then the phone, and the Mentoring off, no results, only you, failed load, deleted child
// record and forbidden states (L2-112 to L2-114, ADR 0070). "Now" is Thu 5 Nov 2026, 4:12 pm in Hamilton.
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const shots = join(dirname(fileURLToPath(import.meta.url)), '..', 'shots');
const ON = ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports', 'Learning', 'Mentoring'];
const NOW = new Date('2026-11-05T21:12:00Z');
const ORG = { organizationId: 'org-harbourview', organizationName: 'Harbourview Youth Collective', plan: 'Standard' };
const ROLES = ['Admin', 'ProgramDirector', 'SiteLead', 'YouthWorker', 'VolunteerCoordinator', 'Youth', 'Mentor', 'Volunteer'];
const PROGRAMS = [
  { id: 'p-tutoring', name: 'After-School Tutoring' },
  { id: 'p-sports', name: 'Saturday Sports' },
  { id: 'p-winter', name: 'Winter Camp 2026' },
];

// Harbourview's accounts as the seed holds them, with the facts PersonDetails reads.
const PEOPLE = () => [
  { id: 'm-aisha', name: 'Aisha Bello', email: 'aisha@harbourview.example', role: 'YouthWorker', signedIn: '2026-11-05T20:40:00Z' },
  { id: 'm-daniel', name: 'Daniel Osei', email: 'daniel@harbourview.example', role: 'Mentor', programs: ['After-School Tutoring'], youth: ['Sofía Rivera'], signedIn: '2026-11-05T21:05:00Z' },
  { id: 'm-hana', name: 'Hana Kim', email: 'hana@harbourview.example', role: 'Mentor', signedIn: '2026-11-02T22:00:00Z' },
  { id: 'm-jaylen', name: 'Jaylen Okafor', email: 'jaylen@harbourview.example', role: 'SiteLead', signedIn: '2026-11-05T20:55:00Z' },
  { id: 'm-leo', name: 'Leo Martins', email: 'leo@harbourview.example', role: 'Volunteer', signedIn: '2026-11-04T23:10:00Z' },
  { id: 'm-marisol', name: 'Marisol Delgado', email: 'marisol@harbourview.example', role: 'ProgramDirector', signedIn: '2026-11-05T14:15:00Z' },
  { id: 'm-nadia', name: 'Nadia Haddad', email: 'nadia@harbourview.example', role: 'Youth', child: { id: 'c-nadia', name: 'Nadia Haddad', age: 18, household: 'Haddad', householdId: 'hh-haddad' }, signedIn: '2026-11-03T22:30:00Z' },
  { id: 'm-priya', name: 'Priya Raman', email: 'priya@harbourview.example', role: 'VolunteerCoordinator', signedIn: '2026-10-28T15:00:00Z' },
  { id: 'm-sofia', name: 'Sofía Rivera', email: 'sofia@harbourview.example', role: 'Youth', programs: ['After-School Tutoring'], mentor: 'Daniel Osei',
    child: { id: 'c-sofia', name: 'Sofía Rivera', age: 12, household: 'Rivera', householdId: 'hh-rivera' }, learning: { lessonsDone: 7, lessonsTotal: 12, badges: ['First Steps', 'Faithful Five'] }, signedIn: '2026-11-05T21:10:00Z' },
  { id: 'm-tom', name: 'Tom Nguyen', email: 'tom@harbourview.example', role: 'Admin', signedIn: '2026-11-05T14:02:00Z' },
];
const ME = { 'm-tom': { personName: 'Tom Nguyen', role: 'Admin' }, 'm-marisol': { personName: 'Marisol Delgado', role: 'ProgramDirector' } };

const newState = (x = {}) => ({ me: 'm-tom', modules: ON, people: PEOPLE(), deactivated: new Map(), deletedChild: new Set(), history: new Map(), failList: false, ...x });

function row(state, p) {
  const mentoring = state.modules.includes('Mentoring');
  return {
    id: p.id, name: p.name, email: p.email, role: p.role, status: state.deactivated.has(p.id) ? 'Deactivated' : 'Active',
    programs: p.programs ?? [], lastSignedInAt: p.signedIn ?? null, isYou: p.id === state.me,
    ...(mentoring ? { mentoring: { mentor: p.mentor ?? null, youth: p.youth ?? [] } } : {}),
  };
}

const record = (state, p) => ({
  ...row(state, p),
  deactivatedAt: state.deactivated.get(p.id)?.at ?? null,
  deactivatedBy: state.deactivated.get(p.id)?.by ?? null,
  child: p.child ? { ...p.child, deleted: state.deletedChild.has(p.id) } : null,
  history: state.history.get(p.id) ?? [],
  ...(state.modules.includes('Learning') && p.learning ? { learning: p.learning } : {}),
});

function log(state, id, action, summary) {
  state.history.set(id, [{ at: NOW.toISOString(), action, summary, by: 'Tom Nguyen' }, ...(state.history.get(id) ?? [])]);
}

/** People, records and the lifecycle as the real API answers an admin (and refuses anyone else). */
async function fakeApi(demo, state) {
  // No fixed clock: the directory debounces its filters, and dates on screen come from the data, not from now.
  await demo.page.route('**/api/**', async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const path = url.pathname;
    const admin = ME[state.me].role === 'Admin';
    if (path === '/api/me') return route.fulfill({ json: { ...ME[state.me], membershipId: state.me, ...ORG, modules: state.modules } });
    if (path === '/api/me/organizations') return route.fulfill({ json: { organizations: [] } });
    if (path === '/api/notifications') return route.fulfill({ json: { unread: 0, items: [] } });
    if (path.startsWith('/api/people') || path.startsWith('/api/staff')) {
      if (!admin) return route.fulfill({ status: 403 });
    }
    if (path === '/api/people') {
      if (state.failList) return route.fulfill({ status: 500 });
      const q = (url.searchParams.get('q') ?? '').toLowerCase();
      const role = url.searchParams.get('role') ?? '';
      const status = url.searchParams.get('status') ?? '';
      const program = PROGRAMS.find((p) => p.id === url.searchParams.get('programId'))?.name;
      const page = Number(url.searchParams.get('page') ?? 1);
      const rows = state.people.map((p) => row(state, p))
        .filter((r) => (!q || r.name.toLowerCase().includes(q) || r.email.includes(q)) && (!role || r.role === role) && (!status || r.status === status) && (!program || r.programs.includes(program)));
      return route.fulfill({ json: { items: rows.slice((page - 1) * 25, page * 25), total: rows.length, page, pageSize: 25,
        roles: ROLES.filter((r) => r !== 'Mentor' || state.modules.includes('Mentoring')), programs: PROGRAMS } });
    }
    const one = /^\/api\/people\/([^/]+)(\/(deactivate|reactivate))?$/.exec(path);
    if (one) {
      const p = state.people.find((x) => x.id === one[1]);
      if (!p) return route.fulfill({ status: 404 });
      if (one[3] === 'deactivate') {
        state.deactivated.set(p.id, { at: NOW.toISOString(), by: 'Tom Nguyen' });
        log(state, p.id, 'Deactivated', `${p.name}’s account deactivated by Tom Nguyen`);
        return route.fulfill({ status: 204 });
      }
      if (one[3] === 'reactivate') {
        state.deactivated.delete(p.id);
        log(state, p.id, 'Reactivated', `${p.name}’s account reactivated by Tom Nguyen`);
        return route.fulfill({ status: 204 });
      }
      return route.fulfill({ json: record(state, p) });
    }
    const role = /^\/api\/staff\/([^/]+)\/role$/.exec(path);
    if (role) {
      const p = state.people.find((x) => x.id === role[1]);
      const to = req.postDataJSON().role;
      log(state, p.id, 'RoleChanged', `${p.name} · ${p.role} → ${to} by Tom Nguyen`);
      p.role = to;
      return route.fulfill({ status: 204 });
    }
    return route.fulfill({ status: 404 });
  });
}

const app = (demo) => demo.app();
const heading = (demo, name) => app(demo).getByRole('heading', { name, level: 1 }).first().waitFor();
const shot = (demo, name) => demo.page.locator('iframe').screenshot({ path: join(shots, `${name}.png`) });
const select = (demo, label, option) => app(demo).getByLabel(label, { exact: true }).selectOption({ label: option });

export default [
  {
    // Tom opens People from his menu, filters to mentors, then searches for someone who is not there.
    name: 'directory-desktop',
    run: async (demo) => {
      const state = newState();
      await fakeApi(demo, state);
      await demo.go('/people', { ready: false });
      await heading(demo, 'People');
      await app(demo).getByRole('link', { name: 'Sofía Rivera' }).waitFor();
      demo.mark();
      await demo.pause(3600);
      await shot(demo, 'desktop-people');
      await select(demo, 'Role', 'Mentor');
      await app(demo).getByText('Showing 1–2 of 2').waitFor();
      await demo.pause(2600);
      await shot(demo, 'desktop-mentors');
      await select(demo, 'Role', 'All roles');
      await demo.type(app(demo).getByLabel('Search people'), 'Petrov');
      await app(demo).getByText('No one matches “Petrov”').waitFor();
      await demo.pause(2600);
      await shot(demo, 'desktop-no-results');
      await demo.click(app(demo).getByRole('button', { name: 'Clear search' }));
      await app(demo).getByRole('link', { name: 'Sofía Rivera' }).waitFor();
      await demo.pause(1200);
    },
  },
  {
    // Sofía's record, then Leo's: Tom makes the volunteer a youth worker and the dialog warns about family records.
    name: 'record-desktop',
    run: async (demo) => {
      const state = newState();
      await fakeApi(demo, state);
      await demo.go('/people', { ready: false });
      await app(demo).getByRole('link', { name: 'Sofía Rivera' }).waitFor();
      demo.mark();
      await demo.pause(1200);
      await demo.click(app(demo).getByRole('link', { name: 'Sofía Rivera' }));
      await heading(demo, 'Sofía Rivera');
      await demo.pause(3600);
      await shot(demo, 'desktop-sofia');
      await demo.go('/people/m-leo', { ready: false });
      await heading(demo, 'Leo Martins');
      await demo.pause(1600);
      await demo.click(app(demo).getByRole('button', { name: 'Change role' }));
      await app(demo).getByRole('dialog').waitFor();
      await demo.pause(1400);
      await demo.click(app(demo).getByRole('radio', { name: /^Youth worker/ }));
      await app(demo).getByText('This gives access to every family’s records').waitFor();
      await demo.pause(2600);
      await shot(demo, 'desktop-change-role');
      await demo.click(app(demo).getByRole('dialog').getByRole('button', { name: 'Change role' }));
      await app(demo).getByText('Leo Martins’s role changed').first().waitFor();
      await demo.pause(2800);
      await shot(demo, 'desktop-role-changed');
    },
  },
  {
    // Tom deactivates Leo, finds him under Deactivated, and reactivates him.
    name: 'lifecycle-desktop',
    run: async (demo) => {
      const state = newState();
      await fakeApi(demo, state);
      await demo.go('/people/m-leo', { ready: false });
      await heading(demo, 'Leo Martins');
      demo.mark();
      await demo.pause(1400);
      await demo.click(app(demo).getByRole('button', { name: 'Deactivate' }));
      await app(demo).getByRole('dialog').waitFor();
      await demo.pause(2600);
      await shot(demo, 'desktop-deactivate');
      await demo.click(app(demo).getByRole('dialog').getByRole('button', { name: 'Deactivate' }));
      await app(demo).getByText('Leo Martins deactivated').first().waitFor();
      await demo.pause(2800);
      await shot(demo, 'desktop-deactivated');
      await demo.go('/people?status=Deactivated', { ready: false });
      await app(demo).getByText('Showing 1–1 of 1').waitFor();
      await demo.pause(2400);
      await shot(demo, 'desktop-deactivated-filter');
      await demo.click(app(demo).getByRole('link', { name: 'Leo Martins' }));
      await heading(demo, 'Leo Martins');
      await demo.pause(1200);
      await demo.click(app(demo).getByRole('button', { name: 'Reactivate' }));
      await app(demo).getByText('Leo Martins reactivated').first().waitFor();
      await demo.pause(2800);
      await shot(demo, 'desktop-reactivated');
    },
  },
  {
    // On a phone: the directory in one column, and Sofía's record.
    name: 'phone',
    phone: true,
    run: async (demo) => {
      const state = newState();
      await fakeApi(demo, state);
      await demo.go('/people', { ready: false });
      await app(demo).getByRole('link', { name: 'Sofía Rivera' }).waitFor();
      demo.mark();
      await demo.pause(2400);
      await shot(demo, 'phone-people');
      await demo.click(app(demo).getByRole('link', { name: 'Sofía Rivera' }));
      await heading(demo, 'Sofía Rivera');
      await demo.pause(2600);
      await shot(demo, 'phone-sofia');
    },
  },
  {
    // The states: Mentoring off, only Tom, a failed load, Nadia's deleted child record, and Marisol refused.
    name: 'states-desktop',
    run: async (demo) => {
      const state = newState({ modules: ON.filter((m) => m !== 'Mentoring') });
      await fakeApi(demo, state);
      await demo.go('/people', { ready: false });
      await app(demo).getByRole('link', { name: 'Daniel Osei' }).waitFor();
      demo.mark();
      await demo.pause(2600);
      await shot(demo, 'desktop-mentoring-off');
      state.modules = ON;
      state.people = state.people.filter((p) => p.id === 'm-tom');
      await demo.go('/people', { ready: false });
      await app(demo).getByText('It’s just you so far').waitFor();
      await demo.pause(2200);
      await shot(demo, 'desktop-empty');
      state.people = PEOPLE();
      state.failList = true;
      await demo.go('/people', { ready: false });
      await app(demo).getByText('We couldn’t load people').waitFor();
      await demo.pause(2200);
      state.failList = false;
      state.deletedChild.add('m-nadia');
      state.deactivated.set('m-nadia', { at: '2026-11-05T19:10:00Z', by: 'Tom Nguyen' });
      log(state, 'm-nadia', 'Deactivated', 'Nadia Haddad’s account deactivated with the child record by Tom Nguyen');
      await demo.go('/people/m-nadia', { ready: false });
      await app(demo).getByText('The child record was deleted').waitFor();
      await demo.pause(2600);
      await shot(demo, 'desktop-child-deleted');
      state.me = 'm-marisol';
      await demo.go('/people', { ready: false });
      await heading(demo, 'Only admins manage people');
      await demo.pause(2200);
      await shot(demo, 'desktop-forbidden');
    },
  },
];
