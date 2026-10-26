// Screen recordings for video 46, made with tools/video-record/record-clips.mjs against the
// running frontend. The backend is faked like the e2e suite: Jaylen asks for a link, then chooses a new password.
const modules = ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports'];
const jaylen = { personName: 'Jaylen Okafor', role: 'SiteLead', organizationId: 'org-harbourview', organizationName: 'Harbourview Youth Collective', plan: 'Standard', modules };

function resetApi() {
  let signedIn = false;
  return async (demo) => {
    await demo.page.route('**/api/**', async (route) => {
      const path = new URL(route.request().url()).pathname;
      if (path === '/api/me') return signedIn ? route.fulfill({ json: jaylen }) : route.fulfill({ status: 401 });
      if (path === '/api/auth/forgot-password') return route.fulfill({ status: 202 });
      if (path === '/api/auth/reset-password/tok-reset-jaylen') return route.fulfill({ json: { email: 'jaylen@harbourview.example' } });
      if (path === '/api/auth/reset-password') {
        signedIn = true;
        return route.fulfill({ json: { status: 'signed-in' } });
      }
      if (path === '/api/notifications') return route.fulfill({ json: { unread: 0, items: [] } });
      if (path === '/api/me/organizations') return route.fulfill({ json: { organizations: [] } });
      if (path === '/api/sessions/today') return route.fulfill({ json: { sessions: [] } });
      if (path === '/api/today') return route.fulfill({ json: { activeChildren: 6, households: 5, slipsDue: [], comingUp: [], tasks: [] } });
      return route.fulfill({ status: 599 });
    });
  };
}

export default [
  {
    name: 'forgot-phone',
    phone: true,
    run: async (demo) => {
      await resetApi()(demo);
      await demo.go('/forgot-password', { ready: false });
      await demo.app().getByLabel('Work email').waitFor();
      demo.mark();
      await demo.pause(2000);
      await demo.app().getByLabel('Work email').pressSequentially('jaylen@harbourview.example', { delay: 60 });
      await demo.click(demo.app().getByRole('button', { name: 'Email me a reset link' }));
      await demo.app().getByRole('heading', { name: 'Check your email' }).waitFor();
      await demo.pause(3000);
    },
  },
  {
    name: 'reset-phone',
    phone: true,
    run: async (demo) => {
      await resetApi()(demo);
      await demo.go('/reset-password?token=tok-reset-jaylen', { ready: false });
      await demo.app().getByLabel('New password').waitFor();
      demo.mark();
      await demo.pause(2000);
      await demo.app().getByLabel('New password').pressSequentially('harbour-lantern-2027', { delay: 50 });
      await demo.app().getByLabel('Repeat it').pressSequentially('harbour-lantern-2027', { delay: 50 });
      await demo.click(demo.app().getByRole('button', { name: 'Set password and sign in' }));
      await demo.app().getByRole('heading', { name: 'Welcome, Jaylen' }).waitFor();
      await demo.pause(3000);
    },
  },
];
