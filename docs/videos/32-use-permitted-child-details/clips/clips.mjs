// Screen recordings for video 32, made with tools/video-record/record-clips.mjs against the
// running frontend. The backend is faked like the e2e suite: Aisha opens Mateo, then a child outside her sessions.
const modules = ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports'];
const aisha = { personName: 'Aisha Bello', role: 'YouthWorker', organizationId: 'org-harbourview', organizationName: 'Harbourview Youth Collective', plan: 'Standard', modules };

const rivera = {
  id: 'hh-rivera',
  name: 'Rivera',
  language: 'Spanish',
  guardians: [
    { id: 'g-carmen', name: 'Carmen Rivera', relationship: 'Mother', mobile: '905-555-0142', email: 'carmen.rivera@example.com', language: 'Spanish', isPrimary: true, canPickUp: true, canSign: true },
    { id: 'g-luis', name: 'Luis Rivera', relationship: 'Uncle or aunt', mobile: '905-555-0199', email: null, language: 'Spanish', isPrimary: false, canPickUp: true, canSign: false },
  ],
  children: [
    { id: 'c-mateo', name: 'Mateo Rivera', age: 9, school: 'Bennetto Elementary, Grade 4', medicalFlag: null },
    { id: 'c-sofia', name: 'Sofía Rivera', age: 12, school: 'Bennetto Elementary, Grade 7', medicalFlag: null },
  ],
  medicalRestricted: true,
};
const mateo = {
  id: 'c-mateo',
  name: 'Mateo Rivera',
  firstName: 'Mateo',
  lastName: 'Rivera',
  dateOfBirth: null,
  age: 9,
  school: 'Bennetto Elementary, Grade 4',
  householdId: 'hh-rivera',
  householdName: 'Rivera',
  medical: null,
  medicalRestricted: true,
};

function permittedApi() {
  return async (demo) => {
    await demo.page.route('**/api/**', async (route) => {
      const path = new URL(route.request().url()).pathname;
      if (path === '/api/me') return route.fulfill({ json: aisha });
      if (path === '/api/households/hh-rivera') return route.fulfill({ json: rivera });
      if (path === '/api/children/c-mateo') return route.fulfill({ json: mateo });
      if (path === '/api/children/c-kevin') return route.fulfill({ status: 403, json: { code: 'forbidden' } });
      return route.fulfill({ status: 599 });
    });
  };
}

export default [
  {
    name: 'permitted-desktop',
    run: async (demo) => {
      await permittedApi()(demo);
      await demo.go('/families/hh-rivera', { ready: false });
      await demo.app().getByRole('heading', { name: 'Rivera household' }).waitFor();
      demo.mark();
      await demo.pause(3000);
      await demo.click(demo.app().getByRole('link', { name: /^Mateo Rivera/ }));
      await demo.app().getByRole('heading', { name: 'Mateo Rivera' }).waitFor();
      await demo.pause(3500);
      await demo.go('/families/hh-tran/children/c-kevin', { ready: false });
      await demo.app().getByRole('heading', { name: 'This child isn’t in your sessions' }).waitFor();
      await demo.pause(3500);
    },
  },
];
