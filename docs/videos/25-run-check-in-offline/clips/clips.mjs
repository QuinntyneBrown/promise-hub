// Screen recordings for video 25, made with tools/video-record/record-clips.mjs against the
// running frontend. The backend is faked like the e2e suite; "offline" makes every API call fail, as with no signal.
const jaylen = {
  personName: 'Jaylen Okafor', role: 'SiteLead', organizationId: 'org-harbourview',
  organizationName: 'Harbourview Youth Collective', plan: 'Standard',
  modules: ['Roster', 'RollCall', 'QuickCards', 'Pickup'],
};

async function fakeApi(demo, state) {
  const roster = [
    { id: 'c-jordan', name: 'Jordan Thompson', status: 'NotYet', medicalFlag: null },
    { id: 'c-mateo', name: 'Mateo Rivera', status: 'Present', medicalFlag: 'Allergy' },
    { id: 'c-sofia', name: 'Sofía Rivera', status: 'NotYet', medicalFlag: 'Medication' },
  ].map((c) => ({ ...c, childId: c.id, householdId: 'hh', age: 9, school: null, checkedInAt: c.status === 'Present' ? '2026-11-05T21:02:00Z' : null, walkIn: false, signedOutAt: null, collectedBy: null, noShow: null, noShowAt: null, conflict: false }));
  const session = () => ({ id: 'e-tonight', name: 'Tutoring night', programId: 'p-tutoring', programName: 'After-School Tutoring', startsAt: '2026-11-05T21:00:00Z', endsAt: '2026-11-05T23:00:00Z', place: 'Room 2', expected: roster.length,
    checkedIn: roster.filter((c) => c.status === 'Present').length, absent: 0, notYet: roster.filter((c) => c.status === 'NotYet').length, status: 'Scheduled' });
  const card = { childId: 'c-mateo', name: 'Mateo Rivera', age: 9, school: 'Bennetto Elementary, Grade 4', programs: ['After-School Tutoring'], allergyAlert: { title: 'Peanuts: anaphylaxis', instruction: 'EpiPen in his backpack. Call 911.' },
    medical: { allergies: 'Peanuts (anaphylaxis)', medication: 'EpiPen 0.3 mg', conditions: null, notes: null }, contacts: [], pickups: [] };
  await demo.page.route('**/api/**', async (route) => {
    if (state.offline) return route.abort('internetdisconnected');
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/me') return route.fulfill({ json: jaylen });
    if (path === '/api/sessions/today') return route.fulfill({ json: { sessions: [session()] } });
    if (path.endsWith('/roster')) return route.fulfill({ json: { session: session(), children: roster } });
    if (path.endsWith('/quick-card')) return route.fulfill({ json: { ...card, childId: path.split('/')[3] } });
    if (path.endsWith('/check-ins')) {
      roster.find((c) => c.id === route.request().postDataJSON().childId).status = 'Present';
      return route.fulfill({ json: { status: 'saved' } });
    }
    return route.fulfill({ status: 599 });
  });
}

export default [
  {
    name: 'offline-phone',
    phone: true,
    run: async (demo) => {
      const state = { offline: false };
      await fakeApi(demo, state);
      await demo.go('/check-in', { ready: false });
      await demo.app().getByRole('heading', { name: 'Tutoring night' }).waitFor();
      await demo.pause(1500);
      demo.mark();
      state.offline = true;
      await demo.pause(800);
      await demo.click(demo.app().getByRole('button', { name: 'Check in Jordan Thompson' }));
      await demo.app().getByText('waiting to sync').waitFor();
      await demo.pause(3000);
      state.offline = false;
      await demo.app().evaluate(() => window.dispatchEvent(new Event('online')));
      await demo.app().getByText('1 check-in synced').waitFor();
      await demo.pause(3500);
    },
  },
];
