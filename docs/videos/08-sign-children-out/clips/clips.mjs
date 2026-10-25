// Screen recordings for video 08, made with tools/video-record/record-clips.mjs against the
// running frontend. The backend is faked like the e2e suite: tonight's roster, Mateo's approved adults and sign-out.
const modules = ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports'];
const person = { personName: 'Jaylen Okafor', role: 'SiteLead', organizationId: 'org-harbourview', organizationName: 'Harbourview Youth Collective', plan: 'Standard', modules };
const session = { id: 'e-tonight', name: 'Tutoring night', programId: 'p', programName: 'After-School Tutoring', startsAt: '2026-11-05T21:00:00Z', endsAt: '2026-11-05T23:00:00Z', place: 'Room 2', expected: 3, checkedIn: 3, absent: 0, notYet: 0, status: 'Scheduled' };
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
    { id: 'c-jordan', name: 'Jordan Thompson', medicalFlag: null },
    { id: 'c-mateo', name: 'Mateo Rivera', medicalFlag: 'Allergy' },
    { id: 'c-sofia', name: 'Sofía Rivera', medicalFlag: 'Medication' },
  ].map((c) => ({ ...c, childId: c.id, householdId: 'hh', age: 9, school: 'Bennetto Elementary, Grade 4', status: 'Present', checkedInAt: '2026-11-05T21:04:00Z', walkIn: false, signedOutAt: null, collectedBy: null }));
  await demo.page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/me') return route.fulfill({ json: person });
    if (path === '/api/sessions/today') return route.fulfill({ json: { sessions: [session] } });
    if (path.endsWith('/roster')) return route.fulfill({ json: { session, children: roster } });
    if (path.endsWith('/pickups')) return route.fulfill({ json: pickups });
    if (path.endsWith('/sign-outs')) {
      const b = route.request().postDataJSON();
      if (!b.guardianId && !b.someoneElse) return route.fulfill({ status: 422, json: { errors: { who: 'Choose who is taking Mateo home.' } } });
      if (b.someoneElse && !b.guardianConfirmed) return route.fulfill({ status: 422, json: { errors: { guardianConfirmed: 'Carmen Rivera needs to okay this by phone first.' } } });
      return route.fulfill({ json: { status: 'saved' } });
    }
    return route.fulfill({ status: 599 });
  });
}

async function openRoster(demo) {
  await fakeApi(demo);
  await demo.go('/check-in', { ready: false });
  await demo.app().getByRole('heading', { level: 1 }).waitFor();
  await demo.pause(600);
}

const dialog = (demo) => demo.app().getByRole('dialog');

export default [
  {
    name: 'sign-out-phone',
    phone: true,
    run: async (demo) => {
      await openRoster(demo);
      demo.mark();
      await demo.pause(1200);
      await demo.click(demo.app().getByRole('button', { name: 'Sign out Mateo Rivera' }));
      await dialog(demo).getByRole('radio', { name: /^Carmen Rivera/ }).waitFor();
      await demo.pause(2500);
      await demo.click(dialog(demo).getByRole('radio', { name: /^Carmen Rivera/ }));
      await demo.pause(1200);
      await demo.click(dialog(demo).getByRole('button', { name: 'Sign out' }));
      await demo.pause(3500);
    },
  },
  {
    name: 'someone-else-desktop',
    run: async (demo) => {
      await openRoster(demo);
      demo.mark();
      await demo.pause(800);
      await demo.click(demo.app().getByRole('button', { name: 'Sign out Mateo Rivera' }));
      await dialog(demo).getByRole('radio', { name: /^Someone else/ }).waitFor();
      await demo.pause(1000);
      await demo.click(dialog(demo).getByRole('radio', { name: /^Someone else/ }));
      await demo.pause(1500);
      await demo.type(dialog(demo).getByLabel('Their name'), 'Daniel Rivera');
      await demo.click(dialog(demo).getByRole('button', { name: 'Sign out' }));
      await demo.pause(2500);
      await demo.click(dialog(demo).getByRole('switch', { name: /confirmed by phone/ }));
      await demo.pause(800);
      await demo.click(dialog(demo).getByRole('button', { name: 'Sign out' }));
      await demo.pause(3000);
    },
  },
];
