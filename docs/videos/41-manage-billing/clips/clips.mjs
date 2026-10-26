// Screen recordings for video 41, made with tools/video-record/record-clips.mjs against the
// running frontend. The backend is faked like the e2e suite: Tom checks usage and moves Harbourview to Plus.
const modules = ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports'];
const tom = { personName: 'Tom Nguyen', role: 'Admin', organizationId: 'org-harbourview', organizationName: 'Harbourview Youth Collective', plan: 'Standard', modules };

function billingApi() {
  let plan = { plan: 'Standard', monthlyPrice: 89, childLimit: 500, smsCap: 2000 };
  return async (demo) => {
    await demo.page.route('**/api/**', async (route) => {
      const path = new URL(route.request().url()).pathname;
      if (path === '/api/me') return route.fulfill({ json: tom });
      if (path === '/api/notifications') return route.fulfill({ json: { unread: 0, items: [] } });
      if (path === '/api/me/organizations') return route.fulfill({ json: { organizations: [] } });
      if (path === '/api/billing') return route.fulfill({ json: { ...plan, activeChildren: 184, smsUsed: 1212, status: 'Active', graceUntil: null } });
      if (path === '/api/billing/plan') {
        plan = { plan: 'Plus', monthlyPrice: 149, childLimit: 2000, smsCap: 5000 };
        return route.fulfill({ json: { plan: 'Plus', proratedCharge: 52 } });
      }
      return route.fulfill({ status: 599 });
    });
  };
}

export default [
  {
    name: 'billing-desktop',
    run: async (demo) => {
      await billingApi()(demo);
      await demo.go('/settings/billing', { ready: false });
      await demo.app().getByRole('progressbar', { name: /^Active children/ }).waitFor();
      demo.mark();
      await demo.pause(3000);
      await demo.click(demo.app().getByRole('button', { name: 'Change plan' }));
      await demo.pause(1500);
      await demo.click(demo.app().getByRole('dialog').getByRole('radio', { name: /^Plus ·/ }));
      await demo.pause(1000);
      await demo.click(demo.app().getByRole('dialog').getByRole('button', { name: 'Change plan' }));
      await demo.app().getByText('You’re on Plus').waitFor();
      await demo.pause(3500);
    },
  },
];
