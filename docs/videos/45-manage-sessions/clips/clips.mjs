// Screen recordings for video 45, made with tools/video-record/record-clips.mjs against the
// running frontend. The backend is faked like the e2e suite: Jaylen makes recovery codes and signs out other devices.
const modules = ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports'];
const jaylen = { personName: 'Jaylen Okafor', role: 'SiteLead', organizationId: 'org-harbourview', organizationName: 'Harbourview Youth Collective', plan: 'Standard', modules };

function accountApi() {
  let left = 0;
  return async (demo) => {
    await demo.page.route('**/api/**', async (route) => {
      const path = new URL(route.request().url()).pathname;
      if (path === '/api/me') return route.fulfill({ json: jaylen });
      if (path === '/api/notifications') return route.fulfill({ json: { unread: 0, items: [] } });
      if (path === '/api/me/organizations') return route.fulfill({ json: { organizations: [] } });
      if (path === '/api/me/account') {
        return route.fulfill({ json: { name: 'Jaylen Okafor', email: 'jaylen@harbourview.example', role: 'SiteLead', organization: 'Harbourview Youth Collective', mobile: '905-555-0181', twoStepOn: false, recoveryCodesLeft: left } });
      }
      if (path === '/api/me/recovery-codes') {
        left = 10;
        return route.fulfill({ json: { codes: ['k7mq-2xpa', 'r4tn-8vhe', 'w9bc-3fjd', 'h2sx-6ymk', 'p5ga-9nqt', 'c8vr-4wez', 'm3jk-7tbs', 'x6pd-2hna', 'f9ue-5rcq', 't4wy-8gmv'] } });
      }
      if (path === '/api/me/sign-out-others') return route.fulfill({ status: 204 });
      return route.fulfill({ status: 599 });
    });
  };
}

export default [
  {
    name: 'account-desktop',
    run: async (demo) => {
      await accountApi()(demo);
      await demo.go('/account', { ready: false });
      await demo.app().getByRole('heading', { name: 'Your account', level: 1 }).waitFor();
      demo.mark();
      await demo.pause(2500);
      await demo.click(demo.app().getByRole('button', { name: 'Make new recovery codes' }));
      await demo.pause(1200);
      await demo.click(demo.app().getByRole('dialog').getByRole('button', { name: 'Make new codes' }));
      await demo.app().getByRole('list', { name: 'Recovery codes' }).waitFor();
      await demo.pause(3500);
      await demo.click(demo.app().getByRole('dialog').getByRole('button', { name: 'I’ve saved them' }));
      await demo.pause(1500);
      await demo.click(demo.app().getByRole('button', { name: 'Sign out everywhere else' }));
      await demo.pause(1200);
      await demo.click(demo.app().getByRole('dialog').getByRole('button', { name: 'Sign out other devices' }));
      await demo.app().getByText('Other devices are signed out').waitFor();
      await demo.pause(3000);
    },
  },
];
