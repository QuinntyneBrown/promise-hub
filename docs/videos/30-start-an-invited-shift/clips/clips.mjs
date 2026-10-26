// Screen recordings for video 30, made with tools/video-record/record-clips.mjs against the
// running frontend. The backend is faked like the e2e suite: Sam accepts the invitation and reaches tonight's session.
const modules = ['Roster', 'RollCall', 'QuickCards', 'Pickup'];

function inviteApi() {
  let signedIn = false;
  const session = { id: 'e-tonight', name: 'Tutoring night', programId: 'p-tutoring', programName: 'After-School Tutoring', startsAt: '2026-11-05T21:00:00Z', endsAt: '2026-11-05T23:00:00Z', place: 'Room 2', expected: 4, checkedIn: 0, absent: 0, notYet: 4, status: 'Scheduled' };
  return async (demo) => {
    await demo.page.route('**/api/**', async (route) => {
      const path = new URL(route.request().url()).pathname;
      if (path === '/api/invitations/inv-sam') return route.fulfill({ json: { email: 'sam@harbourview.example', organization: 'Harbourview Youth Collective', role: 'YouthWorker', invitedBy: 'Tom Nguyen' } });
      if (path === '/api/invitations/inv-sam/accept') {
        signedIn = true;
        return route.fulfill({ json: { status: 'signed-in' } });
      }
      if (path === '/api/me') {
        if (!signedIn) return route.fulfill({ status: 401 });
        return route.fulfill({ json: { personName: 'Sam Ortiz', role: 'YouthWorker', organizationId: 'org-harbourview', organizationName: 'Harbourview Youth Collective', plan: 'Standard', modules } });
      }
      if (path === '/api/me/phone') return route.fulfill({ status: 204 });
      if (path === '/api/sessions/today') return route.fulfill({ json: { sessions: [session] } });
      return route.fulfill({ status: 599 });
    });
  };
}

export default [
  {
    name: 'invited-phone',
    phone: true,
    run: async (demo) => {
      await inviteApi()(demo);
      await demo.go('/invite/inv-sam', { ready: false });
      await demo.app().getByRole('heading', { name: 'Join Harbourview Youth Collective' }).waitFor();
      demo.mark();
      await demo.pause(1500);
      await demo.type(demo.app().getByLabel('Your name'), 'Sam Ortiz');
      await demo.type(demo.app().getByLabel('Choose a password'), 'a long passphrase 42');
      await demo.click(demo.app().getByRole('button', { name: 'Accept and continue' }));
      await demo.app().getByRole('heading', { name: 'Your mobile for alerts' }).waitFor();
      await demo.pause(800);
      await demo.type(demo.app().getByLabel('Your mobile'), '905-555-0101');
      await demo.click(demo.app().getByRole('button', { name: 'Continue' }));
      await demo.app().getByRole('heading', { name: 'You’re ready, Sam' }).waitFor();
      await demo.pause(3500);
    },
  },
];
