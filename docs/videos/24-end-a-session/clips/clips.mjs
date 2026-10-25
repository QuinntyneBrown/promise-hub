// Screen recordings for video 24, made with tools/video-record/record-clips.mjs against the
// running frontend. The backend is faked like the e2e suite: Jaylen ends tonight's Tutoring night.
const jaylen = {
  personName: 'Jaylen Okafor', role: 'SiteLead', organizationId: 'org-harbourview',
  organizationName: 'Harbourview Youth Collective', plan: 'Standard',
  modules: ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports'],
};

async function fakeApi(demo) {
  const roster = [
    { id: 'c-jordan', name: 'Jordan Thompson', status: 'Present' },
    { id: 'c-mateo', name: 'Mateo Rivera', status: 'Present' },
    { id: 'c-sofia', name: 'Sofía Rivera', status: 'NotYet' },
    { id: 'c-yusuf', name: 'Yusuf Haddad', status: 'Present' },
  ].map((c) => ({ ...c, childId: c.id, householdId: 'hh', age: 9, school: null, medicalFlag: null, checkedInAt: c.status === 'Present' ? '2026-11-05T21:02:00Z' : null, walkIn: false, signedOutAt: null, collectedBy: null, noShow: null, noShowAt: null }));
  const session = { id: 'e-tonight', name: 'Tutoring night', programId: 'p-tutoring', programName: 'After-School Tutoring', startsAt: '2026-11-05T21:00:00Z', endsAt: '2026-11-05T23:00:00Z', place: 'Room 2', status: 'Scheduled', endedAt: null, endedBy: null, notes: null };
  const summary = () => ({ ...session, expected: roster.length, checkedIn: roster.filter((c) => ['Present', 'SignedOut'].includes(c.status)).length, absent: roster.filter((c) => c.status === 'Absent').length, notYet: roster.filter((c) => c.status === 'NotYet').length });
  await demo.page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/me') return route.fulfill({ json: jaylen });
    if (path === '/api/sessions/today') return route.fulfill({ json: { sessions: [summary()] } });
    if (path.endsWith('/roster')) return route.fulfill({ json: { session: summary(), children: roster } });
    if (path.endsWith('/end')) {
      for (const c of roster) c.status = c.status === 'NotYet' ? 'Absent' : 'SignedOut';
      Object.assign(session, { status: 'Ended', endedAt: '2026-11-05T23:04:00Z', endedBy: 'Jaylen Okafor' });
      return route.fulfill({ json: summary() });
    }
    if (path.endsWith('/notes')) {
      session.notes = route.request().postDataJSON().notes;
      return route.fulfill({ status: 204 });
    }
    return route.fulfill({ status: 599 });
  });
}

export default [
  {
    name: 'end-session-phone',
    phone: true,
    run: async (demo) => {
      await fakeApi(demo);
      await demo.go('/check-in', { ready: false });
      await demo.app().getByRole('heading', { level: 1 }).waitFor();
      demo.mark();
      await demo.pause(1500);
      await demo.click(demo.app().getByRole('button', { name: 'End session' }));
      await demo.pause(2000);
      await demo.click(demo.app().getByRole('dialog').getByRole('button', { name: 'End session' }));
      await demo.app().getByText('Session recorded').waitFor();
      await demo.pause(1500);
      await demo.click(demo.app().getByRole('button', { name: 'Session notes' }));
      await demo.type(demo.app().getByRole('dialog').getByRole('textbox'), 'Room 2 projector is broken again.');
      await demo.click(demo.app().getByRole('dialog').getByRole('button', { name: 'Save notes' }));
      await demo.pause(3500);
    },
  },
];
