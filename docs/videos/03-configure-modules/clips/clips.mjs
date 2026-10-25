// Screen recordings for video 03, made with tools/video-record/record-clips.mjs against the
// running frontend. The backend is faked like the e2e suite: /me and Settings › Modules.
const catalog = [
  { id: 'Roster', name: 'Roster', needs: [] },
  { id: 'Slips', name: 'Permission slips', needs: ['Roster'] },
  { id: 'RollCall', name: 'Roll Call', needs: ['Roster'] },
  { id: 'QuickCards', name: 'Quick Cards', needs: ['Roster'] },
  { id: 'Pickup', name: 'Pickup', needs: ['Roster', 'RollCall'] },
  { id: 'Messages', name: 'Messages', needs: ['Roster'] },
  { id: 'Incidents', name: 'Incident log', needs: ['Roster'] },
  { id: 'Reports', name: 'Reports', needs: ['Roster'] },
];

async function fakeApi(demo, person) {
  let on = [...person.modules];
  await demo.page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/me') {
      return route.fulfill({ json: { ...person, modules: on } });
    }
    if (path === '/api/settings/modules' && route.request().method() === 'GET') {
      return route.fulfill({ json: { modules: catalog.map((m) => ({ ...m, on: on.includes(m.id) })) } });
    }
    if (path === '/api/settings/modules') {
      const next = route.request().postDataJSON().on;
      const errors = catalog
        .filter((m) => next.includes(m.id) && m.needs.some((n) => n !== 'Roster' && !next.includes(n)))
        .map((m) => ({ module: m.id, message: `${m.name} needs Roll Call.` }));
      if (errors.length) return route.fulfill({ status: 422, json: { errors } });
      on = catalog.map((m) => m.id).filter((id) => next.includes(id));
      return route.fulfill({ json: { on: on.length } });
    }
    return route.fulfill({ status: 599 });
  });
}

const tom = {
  personName: 'Tom Nguyen',
  role: 'Admin',
  organizationId: 'org-harbourview',
  organizationName: 'Harbourview Youth Collective',
  plan: 'Standard',
  modules: catalog.map((m) => m.id),
};
const priya = {
  personName: 'Priya Raman',
  role: 'VolunteerCoordinator',
  organizationId: 'org-northgate',
  organizationName: 'Northgate Community Church Kids',
  plan: 'Free',
  modules: ['Roster', 'RollCall', 'QuickCards'],
};

async function open(demo, path) {
  await demo.go(path, { ready: false });
  await demo.app().getByRole('heading', { level: 1 }).waitFor();
  await demo.pause(600);
}

export default [
  {
    name: 'modules-desktop',
    run: async (demo) => {
      await fakeApi(demo, tom);
      await open(demo, '/settings/modules');
      demo.mark();
      await demo.pause(1500);
      const app = demo.app();
      await demo.click(app.getByRole('switch', { name: 'Roll Call on' }));
      await demo.click(app.getByRole('button', { name: 'Save changes' }));
      await demo.pause(2500);
      await demo.click(app.getByRole('group', { name: 'Presets' }).getByRole('button', { name: 'Just check-in' }));
      await demo.pause(1200);
      await demo.click(app.getByRole('button', { name: 'Save changes' }));
      await demo.pause(2500);
      await demo.go('/', { ready: false });
      await app.getByRole('heading', { level: 1 }).waitFor();
      await demo.pause(2000);
    },
  },
  {
    name: 'check-in-only-phone',
    phone: true,
    run: async (demo) => {
      await fakeApi(demo, priya);
      await open(demo, '/');
      demo.mark();
      await demo.pause(1500);
      await demo.click(demo.app().getByRole('navigation', { name: 'Primary, phone' }).getByRole('button', { name: 'More' }));
      await demo.pause(2500);
      await demo.press('Escape');
      await demo.go('/slips', { ready: false });
      await demo.app().getByRole('heading', { level: 1 }).waitFor();
      await demo.pause(1500);
    },
  },
];
