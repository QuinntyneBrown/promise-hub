// Screen recordings for video 22, made with tools/video-record/record-clips.mjs against the
// running frontend. The backend is faked like the e2e suite: tonight's roster as the no-show texts and replies arrive.
const jaylen = {
  personName: 'Jaylen Okafor', role: 'SiteLead', organizationId: 'org-harbourview',
  organizationName: 'Harbourview Youth Collective', plan: 'Standard',
  modules: ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports'],
};

async function fakeApi(demo) {
  const roster = [
    { id: 'c-jordan', name: 'Jordan Thompson', status: 'NotYet', noShow: 'TextSent' },
    { id: 'c-mateo', name: 'Mateo Rivera', status: 'Present', noShow: null },
    { id: 'c-sofia', name: 'Sofía Rivera', status: 'NotYet', noShow: 'TextSent' },
    { id: 'c-yusuf', name: 'Yusuf Haddad', status: 'NotYet', noShow: 'TextSent' },
  ].map((c) => ({ ...c, childId: c.id, householdId: 'hh', age: 9, school: null, medicalFlag: null, checkedInAt: c.status === 'Present' ? '2026-11-05T21:02:00Z' : null, walkIn: false, signedOutAt: null, collectedBy: null, noShowAt: c.noShow ? '2026-11-05T21:15:00Z' : null }));
  let polls = 0;
  const session = () => ({ id: 'e-tonight', name: 'Tutoring night', programId: 'p-tutoring', programName: 'After-School Tutoring', startsAt: '2026-11-05T21:00:00Z', endsAt: '2026-11-05T23:00:00Z',
    place: 'Room 2', expected: roster.length, checkedIn: roster.filter((c) => c.status === 'Present').length, absent: roster.filter((c) => c.status === 'Absent').length,
    notYet: roster.filter((c) => c.status === 'NotYet').length, status: 'Scheduled' });
  await demo.page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/me') return route.fulfill({ json: jaylen });
    if (path === '/api/sessions/today') return route.fulfill({ json: { sessions: [session()] } });
    if (path.endsWith('/roster')) {
      // The replies come in between the first and second load, as they would from the guardians' texts.
      if (++polls > 1) {
        Object.assign(roster[2], { status: 'Absent', noShow: 'Absent' });
        Object.assign(roster[3], { noShow: 'OnTheWay' });
      }
      return route.fulfill({ json: { session: session(), children: roster } });
    }
    return route.fulfill({ status: 599 });
  });
}

export default [
  {
    name: 'no-shows-phone',
    phone: true,
    run: async (demo) => {
      await fakeApi(demo);
      await demo.go('/check-in', { ready: false });
      await demo.app().getByRole('heading', { level: 1 }).waitFor();
      demo.mark();
      await demo.pause(3500);
      await demo.go('/check-in', { ready: false });
      await demo.app().getByText('Absent · guardian replied').waitFor();
      await demo.pause(4500);
    },
  },
];
