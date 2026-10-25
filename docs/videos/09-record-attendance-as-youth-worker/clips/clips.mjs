// Screen recordings for video 09, made with tools/video-record/record-clips.mjs against the
// running frontend. The backend is faked like the e2e suite: Aisha works tonight's Tutoring night only.
const modules = ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports'];
const aisha = { personName: 'Aisha Bello', role: 'YouthWorker', organizationId: 'org-harbourview', organizationName: 'Harbourview Youth Collective', plan: 'Standard', modules };
const tonight = { id: 'e-tonight', name: 'Tutoring night', programId: 'p', programName: 'After-School Tutoring', startsAt: '2026-11-05T21:00:00Z', endsAt: '2026-11-05T23:00:00Z', place: 'Room 2', expected: 3, checkedIn: 0, absent: 0, notYet: 3, status: 'Scheduled' };
const pickups = {
  childId: 'c-mateo',
  childName: 'Mateo Rivera',
  primaryName: 'Carmen Rivera',
  primaryPhone: '905-555-0142',
  approved: [
    { guardianId: 'g-carmen', name: 'Carmen Rivera', relationship: 'Mother', isPrimary: true },
    { guardianId: 'g-luis', name: 'Luis Rivera', relationship: 'Uncle or aunt', isPrimary: false },
  ],
};

async function fakeApi(demo) {
  const roster = [
    { id: 'c-jordan', name: 'Jordan Thompson' },
    { id: 'c-mateo', name: 'Mateo Rivera' },
    { id: 'c-sofia', name: 'Sofía Rivera' },
  ].map((c) => ({ ...c, childId: c.id, householdId: 'hh', age: 9, school: 'Bennetto Elementary, Grade 4', medicalFlag: null, status: 'NotYet', checkedInAt: null, walkIn: false, signedOutAt: null, collectedBy: null }));
  await demo.page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/me') return route.fulfill({ json: aisha });
    if (path === '/api/sessions/today') return route.fulfill({ json: { sessions: [tonight] } });
    // Last night's session: Aisha is not on its staff.
    if (path.startsWith('/api/sessions/e-yesterday')) return route.fulfill({ status: 403, contentType: 'application/problem+json', json: { code: 'forbidden' } });
    if (path.endsWith('/roster')) return route.fulfill({ json: { session: tonight, children: roster } });
    if (path.endsWith('/check-ins')) {
      const body = route.request().postDataJSON();
      Object.assign(roster.find((c) => c.id === body.childId), { status: 'Present', checkedInAt: new Date().toISOString() });
      return route.fulfill({ json: { status: 'saved' } });
    }
    if (path.endsWith('/pickups')) return route.fulfill({ json: pickups });
    if (path.endsWith('/sign-outs')) return route.fulfill({ json: { status: 'saved' } });
    return route.fulfill({ status: 599 });
  });
}

async function open(demo, path) {
  await fakeApi(demo);
  await demo.go(path, { ready: false });
  await demo.app().getByRole('heading', { level: 1 }).waitFor();
  await demo.pause(600);
}

export default [
  {
    name: 'her-session-phone',
    phone: true,
    run: async (demo) => {
      await open(demo, '/');
      demo.mark();
      await demo.pause(2000);
      await demo.click(demo.app().getByRole('link', { name: 'Open check-in' }));
      await demo.app().getByRole('button', { name: 'Check in Mateo Rivera' }).waitFor();
      await demo.pause(1500);
      await demo.click(demo.app().getByRole('button', { name: 'Check in Mateo Rivera' }));
      await demo.pause(1800);
      await demo.click(demo.app().getByRole('button', { name: 'Sign out Mateo Rivera' }));
      const dialog = demo.app().getByRole('dialog');
      await dialog.getByRole('radio', { name: /^Carmen Rivera/ }).waitFor();
      await demo.pause(1200);
      await demo.click(dialog.getByRole('radio', { name: /^Carmen Rivera/ }));
      await demo.click(dialog.getByRole('button', { name: 'Sign out' }));
      await demo.pause(3000);
    },
  },
  {
    name: 'not-her-session-desktop',
    run: async (demo) => {
      await open(demo, '/check-in/e-yesterday');
      demo.mark();
      await demo.pause(3500);
      await demo.click(demo.app().getByRole('link', { name: 'Your sessions today' }));
      await demo.app().getByRole('heading', { name: 'Tutoring night' }).waitFor();
      await demo.pause(2500);
    },
  },
];
