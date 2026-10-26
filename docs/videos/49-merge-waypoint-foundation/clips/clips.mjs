// Screen recordings for video 49, made with tools/video-record/record-clips.mjs against the
// running frontend. The backend is faked like the e2e suite: the session, Settings › Modules and
// the first endpoint of each Waypoint module (ADR 0043).
const catalog = [
  { id: 'Roster', name: 'Roster', needs: [] },
  { id: 'Slips', name: 'Permission slips', needs: ['Roster'] },
  { id: 'RollCall', name: 'Roll Call', needs: ['Roster'] },
  { id: 'QuickCards', name: 'Quick Cards', needs: ['Roster'] },
  { id: 'Pickup', name: 'Pickup', needs: ['Roster', 'RollCall'] },
  { id: 'Messages', name: 'Messages', needs: ['Roster'] },
  { id: 'Incidents', name: 'Incident log', needs: ['Roster'] },
  { id: 'Reports', name: 'Reports', needs: ['Roster'] },
  { id: 'Learning', name: 'Learning', needs: ['Roster'] },
  { id: 'Mentoring', name: 'Mentoring', needs: ['Roster'] },
  { id: 'PublicWebsite', name: 'Public website', needs: ['Roster'] },
];
const suite = catalog.slice(0, 8).map((m) => m.id);
const org = { organizationId: 'org-harbourview', organizationName: 'Harbourview Youth Collective', plan: 'Standard' };
const people = {
  tom: { personName: 'Tom Nguyen', role: 'Admin', ...org },
  sofia: { personName: 'Sofía Rivera', role: 'Youth', ...org },
  daniel: { personName: 'Daniel Osei', role: 'Mentor', ...org },
};

/** One organization's modules, shared by everyone signed in during a clip; `who` says whose session /me returns. */
async function fakeApi(demo, state) {
  await demo.page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    const method = route.request().method();
    const on = state.on;
    if (path === '/api/me') return route.fulfill({ json: { ...people[state.who], modules: on } });
    if (path === '/api/notifications') return route.fulfill({ json: { unread: 0, items: [] } });
    if (path === '/api/me/organizations') return route.fulfill({ json: { organizations: [] } });
    if (path === '/api/today') return route.fulfill({ json: { activeChildren: 8, households: 5, slipsDue: [], comingUp: [], tasks: [] } });
    if (path === '/api/sessions/today') return route.fulfill({ json: { sessions: [] } });
    if (path === '/api/settings/modules' && method === 'GET') {
      return route.fulfill({ json: { modules: catalog.map((m) => ({ ...m, on: on.includes(m.id) })) } });
    }
    if (path === '/api/settings/modules') {
      const next = route.request().postDataJSON().on;
      if (!next.includes('Roster')) {
        const names = catalog.filter((m) => next.includes(m.id)).map((m) => m.name);
        return route.fulfill({ status: 422, json: { errors: [{ module: 'Roster', message: `${names.join(' and ')} need the roster.` }] } });
      }
      state.on = catalog.map((m) => m.id).filter((id) => next.includes(id));
      return route.fulfill({ json: { on: state.on.length } });
    }
    const gate = (module, body) => route.fulfill(on.includes(module) ? { json: body } : { status: 404 });
    if (path === '/api/learning/me') return gate('Learning', { personName: 'Sofía Rivera', child: { id: 'c-sofia', firstName: 'Sofía', lastName: 'Rivera', age: 12 } });
    if (path === '/api/curriculum') return gate('Learning', { tracks: [] });
    if (path === '/api/mentoring/youth') return gate('Mentoring', { youth: [] });
    return route.fulfill({ status: 599 });
  });
}

async function open(demo, path) {
  await demo.go(path, { ready: false });
  await demo.app().getByRole('heading', { level: 1 }).waitFor();
  await demo.pause(600);
}

export default [
  {
    // Tom turns Learning and Mentoring off: Curriculum leaves his More menu; on again, it returns.
    name: 'modules-desktop',
    run: async (demo) => {
      const state = { who: 'tom', on: [...suite, 'Learning', 'Mentoring'] };
      await fakeApi(demo, state);
      await open(demo, '/settings/modules');
      demo.mark();
      await demo.pause(1500);
      await demo.click(demo.app().getByRole('switch', { name: 'Learning on' }));
      await demo.click(demo.app().getByRole('switch', { name: 'Mentoring on' }));
      await demo.pause(800);
      await demo.click(demo.app().getByRole('button', { name: 'Save changes' }));
      await demo.pause(2200);
      const more = () => demo.app().getByRole('navigation', { name: 'Primary', exact: true }).getByRole('button', { name: 'More' });
      await open(demo, '/');
      await demo.click(more());
      await demo.pause(2500);
      await demo.press('Escape');
      await open(demo, '/settings/modules');
      await demo.click(demo.app().getByRole('switch', { name: 'Learning on' }));
      await demo.click(demo.app().getByRole('switch', { name: 'Mentoring on' }));
      await demo.pause(800);
      await demo.click(demo.app().getByRole('button', { name: 'Save changes' }));
      await demo.pause(2000);
      await open(demo, '/');
      await demo.click(more());
      await demo.pause(2500);
      await demo.click(demo.app().getByRole('link', { name: 'Curriculum' }));
      await demo.app().getByRole('heading', { level: 1, name: 'Curriculum' }).waitFor();
      await demo.pause(2500);
    },
  },
  {
    // Sofía, a youth, on her phone: Learning on, then off.
    name: 'youth-phone',
    phone: true,
    run: async (demo) => {
      const state = { who: 'sofia', on: [...suite, 'Learning', 'Mentoring'] };
      await fakeApi(demo, state);
      await open(demo, '/');
      demo.mark();
      await demo.pause(2000);
      await demo.click(demo.app().getByRole('navigation', { name: 'Primary, phone' }).getByRole('link', { name: 'Learning' }));
      await demo.app().getByRole('heading', { level: 1, name: 'Learning' }).waitFor();
      await demo.pause(2500);
      state.on = [...suite, 'Mentoring'];
      demo.note('Tom turns Learning off');
      await open(demo, '/learning');
      await demo.pause(3000);
      await demo.click(demo.app().getByRole('navigation', { name: 'Primary, phone' }).getByRole('button', { name: 'More' }));
      await demo.pause(2500);
    },
  },
  {
    // Daniel, a mentor: Today and Mentoring, and nobody assigned yet.
    name: 'mentor-desktop',
    run: async (demo) => {
      const state = { who: 'daniel', on: [...suite, 'Learning', 'Mentoring'] };
      await fakeApi(demo, state);
      await open(demo, '/');
      demo.mark();
      await demo.pause(2000);
      await demo.click(demo.app().getByRole('navigation', { name: 'Primary', exact: true }).getByRole('link', { name: 'Mentoring' }));
      await demo.app().getByRole('heading', { level: 1, name: 'Mentoring' }).waitFor();
      await demo.pause(3000);
    },
  },
];
