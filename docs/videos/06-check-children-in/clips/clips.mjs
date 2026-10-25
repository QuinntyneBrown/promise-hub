// Screen recordings for video 06, made with tools/video-record/record-clips.mjs against the
// running frontend. The backend is faked like the e2e suite: Jaylen and tonight's Tutoring night.
const jaylen = {
  personName: 'Jaylen Okafor', role: 'SiteLead', organizationId: 'org-harbourview',
  organizationName: 'Harbourview Youth Collective', plan: 'Standard',
  modules: ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports'],
};

async function fakeApi(demo) {
  const roster = [
    { id: 'c-jordan', name: 'Jordan Thompson', school: 'Hess Street School, Grade 6', medicalFlag: null },
    { id: 'c-mateo', name: 'Mateo Rivera', school: 'Bennetto Elementary, Grade 4', medicalFlag: 'Allergy' },
    { id: 'c-sofia', name: 'Sofía Rivera', school: 'Bennetto Elementary, Grade 7', medicalFlag: 'Medication' },
    { id: 'c-yusuf', name: 'Yusuf Haddad', school: 'École Pavillon de la jeunesse, Grade 8', medicalFlag: 'Medication' },
  ].map((c) => ({ ...c, childId: c.id, householdId: 'hh', age: 9, status: 'NotYet', checkedInAt: null, walkIn: false }));
  const session = () => {
    const checkedIn = roster.filter((c) => c.status === 'Present').length;
    const absent = roster.filter((c) => c.status === 'Absent').length;
    return { id: 'e-tonight', name: 'Tutoring night', programId: 'p-tutoring', programName: 'After-School Tutoring', startsAt: '2026-11-05T21:00:00Z', endsAt: '2026-11-05T23:00:00Z',
      place: 'Room 2', expected: roster.length, checkedIn, absent, notYet: roster.length - checkedIn - absent, status: 'Scheduled' };
  };
  await demo.page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    const body = route.request().method() === 'POST' ? route.request().postDataJSON() : null;
    if (path === '/api/me') return route.fulfill({ json: jaylen });
    if (path === '/api/sessions/today') return route.fulfill({ json: { sessions: [session()] } });
    if (path.endsWith('/roster')) return route.fulfill({ json: { session: session(), children: [...roster].sort((a, b) => a.name.localeCompare(b.name)) } });
    if (path.endsWith('/check-ins') || path.endsWith('/absences')) {
      const child = roster.find((c) => c.id === body.childId);
      Object.assign(child, path.endsWith('/check-ins') ? { status: 'Present', checkedInAt: body.arrivedAt ?? new Date().toISOString() } : { status: 'Absent', checkedInAt: null });
      return route.fulfill({ json: { status: 'saved' } });
    }
    if (path.endsWith('/walk-ins')) {
      roster.push({ id: 'w-1', childId: null, householdId: null, name: body.childName, age: null, school: null, medicalFlag: null, status: 'Present', checkedInAt: new Date().toISOString(), walkIn: true });
      return route.fulfill({ status: 201, json: { id: 'w-1' } });
    }
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
    name: 'check-in-phone',
    phone: true,
    run: async (demo) => {
      await fakeApi(demo);
      await open(demo, '/check-in');
      demo.mark();
      const app = demo.app();
      await demo.pause(1500);
      await demo.click(app.getByRole('button', { name: 'Check in Mateo Rivera' }));
      await demo.pause(1500);
      await demo.click(app.getByRole('button', { name: 'Check in Sofía Rivera' }));
      await demo.pause(1500);
      await demo.click(app.getByRole('button', { name: 'More for Yusuf Haddad' }));
      await demo.click(app.getByRole('radio', { name: /^Mark absent instead/ }));
      await demo.click(app.getByRole('button', { name: 'Mark absent' }));
      await demo.pause(1500);
      await demo.type(app.getByRole('searchbox', { name: 'Find a child' }), 'Nikolai');
      await demo.pause(800);
      await demo.click(app.getByRole('button', { name: 'Add walk-in' }));
      const dialog = app.getByRole('dialog');
      await demo.type(dialog.getByLabel('Child’s name'), 'Nikolai Petrov');
      await demo.type(dialog.getByLabel('Guardian’s name and phone'), 'Elena Petrova · 289-555-0150');
      await demo.click(dialog.getByRole('button', { name: 'Check in for tonight' }));
      await demo.pause(2500);
    },
  },
  {
    name: 'today-desktop',
    run: async (demo) => {
      await fakeApi(demo);
      await open(demo, '/');
      demo.mark();
      await demo.pause(2000);
      await demo.click(demo.app().getByRole('link', { name: 'Open check-in' }));
      await demo.app().getByRole('list', { name: 'Roster for Tutoring night' }).waitFor();
      await demo.pause(1200);
      await demo.click(demo.app().getByRole('button', { name: 'Check in Jordan Thompson' }));
      await demo.pause(2500);
    },
  },
];
