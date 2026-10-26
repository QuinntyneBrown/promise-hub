// Screen recordings for video 48, made with tools/video-record/record-clips.mjs against the
// running frontend. The backend is faked like the e2e suite: Jaylen checks in tonight's roster
// inside the budgets, and a server fault shows the server error page until Try again succeeds.
const jaylen = {
  personName: 'Jaylen Okafor', role: 'SiteLead', organizationId: 'org-harbourview',
  organizationName: 'Harbourview Youth Collective', plan: 'Standard',
  modules: ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports'],
};

async function fakeApi(demo, { failFirst = false } = {}) {
  // The guard and the shell each read the session, so the first two reads fail.
  let failing = failFirst ? 2 : 0;
  const roster = [
    { id: 'c-jordan', name: 'Jordan Thompson', school: 'Hess Street School, Grade 6', medicalFlag: null },
    { id: 'c-mateo', name: 'Mateo Rivera', school: 'Bennetto Elementary, Grade 4', medicalFlag: 'Allergy' },
    { id: 'c-sofia', name: 'Sofía Rivera', school: 'Bennetto Elementary, Grade 7', medicalFlag: 'Medication' },
    { id: 'c-yusuf', name: 'Yusuf Haddad', school: 'École Pavillon de la jeunesse, Grade 8', medicalFlag: 'Medication' },
  ].map((c) => ({ ...c, childId: c.id, householdId: 'hh', age: 9, status: 'NotYet', checkedInAt: null, walkIn: false }));
  const session = () => {
    const checkedIn = roster.filter((c) => c.status === 'Present').length;
    return { id: 'e-tonight', name: 'Tutoring night', programId: 'p-tutoring', programName: 'After-School Tutoring', startsAt: '2026-11-05T21:00:00Z', endsAt: '2026-11-05T23:00:00Z',
      place: 'Room 2', expected: roster.length, checkedIn, absent: 0, notYet: roster.length - checkedIn, status: 'Scheduled' };
  };
  await demo.page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    const body = route.request().method() === 'POST' ? route.request().postDataJSON() : null;
    if (path === '/api/me' && failing > 0) {
      failing -= 1;
      return route.fulfill({ status: 500, json: { title: 'Something went wrong', reference: '7f3c2a19' } });
    }
    if (path === '/api/me') return route.fulfill({ json: jaylen });
    if (path === '/api/notifications') return route.fulfill({ json: { unread: 0, items: [] } });
    if (path === '/api/me/organizations') return route.fulfill({ json: { organizations: [] } });
    if (path === '/api/today') return route.fulfill({ json: { activeChildren: 7, households: 5, slipsDue: [], comingUp: [], tasks: [] } });
    if (path === '/api/sessions/today') return route.fulfill({ json: { sessions: [session()] } });
    if (path.endsWith('/roster')) return route.fulfill({ json: { session: session(), children: [...roster].sort((a, b) => a.name.localeCompare(b.name)) } });
    if (path.endsWith('/check-ins')) {
      Object.assign(roster.find((c) => c.id === body.childId), { status: 'Present', checkedInAt: new Date().toISOString() });
      return route.fulfill({ json: { status: 'saved' } });
    }
    return route.fulfill({ status: 599 });
  });
}

export default [
  {
    name: 'check-in-phone',
    phone: true,
    run: async (demo) => {
      await fakeApi(demo);
      await demo.go('/check-in', { ready: false });
      const app = demo.app();
      await app.getByRole('list', { name: 'Roster for Tutoring night' }).waitFor();
      demo.mark();
      await demo.pause(1500);
      await demo.click(app.getByRole('button', { name: 'Check in Jordan Thompson' }));
      await demo.pause(1200);
      await demo.type(app.getByRole('searchbox', { name: 'Find a child' }), 'Rivera');
      await demo.pause(1000);
      await demo.click(app.getByRole('button', { name: 'Check in Mateo Rivera' }));
      await demo.pause(2500);
    },
  },
  {
    name: 'fault-desktop',
    run: async (demo) => {
      await fakeApi(demo, { failFirst: true });
      await demo.go('/', { ready: false });
      const app = demo.app();
      await app.getByRole('heading', { name: 'Something went wrong on our side' }).waitFor();
      demo.mark();
      await demo.pause(3500);
      await demo.click(app.getByRole('button', { name: 'Try again' }).or(app.getByRole('link', { name: 'Try again' })));
      await app.getByRole('region', { name: 'Tutoring night' }).waitFor();
      await demo.pause(3000);
    },
  },
];
