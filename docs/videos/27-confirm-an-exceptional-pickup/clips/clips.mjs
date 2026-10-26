// Screen recordings for video 27, made with tools/video-record/record-clips.mjs against the
// running frontend. The backend is faked like the e2e suite: Rosa comes for Mateo and Carmen approves from her phone.
const jaylen = {
  personName: 'Jaylen Okafor', role: 'SiteLead', organizationId: 'org-harbourview',
  organizationName: 'Harbourview Youth Collective', plan: 'Standard',
  modules: ['Roster', 'RollCall', 'QuickCards', 'Pickup', 'Incidents'],
};

async function fakeApi(demo) {
  const roster = [
    { id: 'c-mateo', name: 'Mateo Rivera', status: 'Present' },
    { id: 'c-sofia', name: 'Sofía Rivera', status: 'Present' },
  ].map((c) => ({ ...c, childId: c.id, householdId: 'hh-rivera', age: 9, school: null, medicalFlag: null, checkedInAt: '2026-11-05T21:02:00Z', walkIn: false, signedOutAt: null, collectedBy: null, noShow: null, noShowAt: null, conflict: false }));
  const session = () => ({ id: 'e-tonight', name: 'Tutoring night', programId: 'p-tutoring', programName: 'After-School Tutoring', startsAt: '2026-11-05T21:00:00Z', endsAt: '2026-11-05T23:00:00Z', place: 'Room 2',
    expected: 2, checkedIn: 2, absent: 0, notYet: 0, status: 'Scheduled' });
  let request = null;
  let polls = 0;
  await demo.page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/me') return route.fulfill({ json: jaylen });
    if (path === '/api/sessions/today') return route.fulfill({ json: { sessions: [session()] } });
    if (path.endsWith('/roster')) return route.fulfill({ json: { session: session(), children: roster } });
    if (path.endsWith('/quick-card')) return route.fulfill({ status: 404 });
    if (path === '/api/children/c-mateo/pickups') return route.fulfill({ json: { childId: 'c-mateo', childName: 'Mateo Rivera', primaryName: 'Carmen Rivera', primaryPhone: '905-555-0142', approved: [{ guardianId: 'g-carmen', name: 'Carmen Rivera', relationship: 'Mother', isPrimary: true, pickupId: null }] } });
    if (path.endsWith('/pickup-requests')) {
      request = { id: 'pr-1', childId: 'c-mateo', collectorName: 'Rosa Alvarez', status: 'Pending', decidedBy: null, decidedAt: null, incidentId: null };
      return route.fulfill({ status: 201, json: { id: 'pr-1' } });
    }
    if (path === '/api/pickup-requests/pr-1') {
      // Carmen answers from her phone a few seconds after the text.
      if (++polls > 3) Object.assign(request, { status: 'Approved', decidedBy: 'Carmen Rivera' });
      return route.fulfill({ json: request });
    }
    if (path.endsWith('/sign-outs')) {
      roster[0].status = 'SignedOut';
      return route.fulfill({ json: { status: 'saved' } });
    }
    return route.fulfill({ status: 599 });
  });
}

export default [
  {
    name: 'ask-guardian-desktop',
    run: async (demo) => {
      await fakeApi(demo);
      await demo.go('/check-in', { ready: false });
      await demo.app().getByRole('heading', { name: 'Tutoring night' }).waitFor();
      demo.mark();
      await demo.pause(1200);
      await demo.click(demo.app().getByRole('button', { name: 'Sign out Mateo Rivera' }));
      await demo.pause(800);
      await demo.click(demo.app().getByRole('dialog').getByRole('radio', { name: /^Someone else/ }));
      await demo.type(demo.app().getByRole('dialog').getByLabel('Their name'), 'Rosa Alvarez');
      await demo.click(demo.app().getByRole('dialog').getByRole('button', { name: 'Ask Carmen Rivera by text' }));
      await demo.app().getByText('Carmen Rivera approved Rosa Alvarez').waitFor();
      await demo.pause(2000);
      await demo.click(demo.app().getByRole('dialog').getByRole('button', { name: 'Sign out' }));
      await demo.pause(3000);
    },
  },
];
