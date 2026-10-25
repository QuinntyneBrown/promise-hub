// Screen recordings for video 07, made with tools/video-record/record-clips.mjs against the
// running frontend. The backend is faked like the e2e suite: tonight's roster and Mateo's Quick Card.
const modules = ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports'];
const people = {
  jaylen: { personName: 'Jaylen Okafor', role: 'SiteLead' },
  priya: { personName: 'Priya Raman', role: 'VolunteerCoordinator' },
};

function card(medical) {
  return {
    id: 'c-mateo', householdId: 'hh-rivera', name: 'Mateo Rivera', age: 9, school: 'Bennetto Elementary, Grade 4',
    programs: ['After-School Tutoring'], primaryGuardian: 'Carmen Rivera', language: 'Spanish',
    allergyAlert: medical ? { title: 'Severe allergy: Peanuts (anaphylaxis); tree nuts (hives)', instruction: 'EpiPen in backpack front pocket. Use it, call 911, then Carmen.' } : null,
    medical: medical ? { allergies: 'Peanuts (anaphylaxis); tree nuts (hives)', medication: 'EpiPen 0.3 mg, carried', conditions: null, doctor: 'Dr. Amrita Sethi · 905-555-0100', healthCard: 'Ontario ···· 4471' } : null,
    callOrder: [
      { name: 'Carmen Rivera', relationship: 'Mother', phone: '905-555-0142', language: 'Spanish', isPrimary: true },
      { name: 'Luis Rivera', relationship: 'Uncle or aunt', phone: '905-555-0199', language: 'Spanish', isPrimary: false },
    ],
    approvedPickups: [
      { name: 'Carmen Rivera', relationship: 'Mother', isPrimary: true },
      { name: 'Luis Rivera', relationship: 'Uncle or aunt', isPrimary: false },
    ],
    notes: 'Sits with Jordan.',
    medicalRestricted: !medical,
  };
}

async function fakeApi(demo, who) {
  const person = { ...people[who], organizationId: 'org-harbourview', organizationName: 'Harbourview Youth Collective', plan: 'Standard', modules };
  const medical = who === 'jaylen';
  const roster = [
    { id: 'c-jordan', name: 'Jordan Thompson', medicalFlag: null },
    { id: 'c-mateo', name: 'Mateo Rivera', medicalFlag: 'Allergy' },
    { id: 'c-sofia', name: 'Sofía Rivera', medicalFlag: 'Medication' },
  ].map((c) => ({ ...c, childId: c.id, householdId: 'hh', age: 9, school: 'Bennetto Elementary, Grade 4', status: 'NotYet', checkedInAt: null, walkIn: false, medicalFlag: medical ? c.medicalFlag : null }));
  const session = { id: 'e-tonight', name: 'Tutoring night', programId: 'p', programName: 'After-School Tutoring', startsAt: '2026-11-05T21:00:00Z', endsAt: '2026-11-05T23:00:00Z', place: 'Room 2', expected: 3, checkedIn: 0, absent: 0, notYet: 3, status: 'Scheduled' };
  await demo.page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/me') return route.fulfill({ json: person });
    if (path === '/api/sessions/today') return route.fulfill({ json: { sessions: [session] } });
    if (path.endsWith('/roster')) return route.fulfill({ json: { session, children: roster } });
    if (path.endsWith('/quick-card')) return route.fulfill({ json: card(medical) });
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
    name: 'quick-card-phone',
    phone: true,
    run: async (demo) => {
      await fakeApi(demo, 'jaylen');
      await open(demo, '/check-in');
      demo.mark();
      await demo.pause(1500);
      await demo.click(demo.app().getByRole('link', { name: 'Quick Card for Mateo Rivera' }));
      await demo.app().getByRole('note', { name: 'Allergy alert' }).waitFor();
      await demo.pause(3000);
      await demo.app().getByRole('list', { name: 'Call, in this order' }).scrollIntoViewIfNeeded();
      await demo.pause(3000);
    },
  },
  {
    name: 'restricted-desktop',
    run: async (demo) => {
      await fakeApi(demo, 'priya');
      await open(demo, '/quick-cards/c-mateo');
      demo.mark();
      await demo.pause(4000);
    },
  },
];
