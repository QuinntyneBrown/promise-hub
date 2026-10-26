// Screen recordings for video 42, made with tools/video-record/record-clips.mjs against the
// running frontend. The backend is faked like the e2e suite: Tom shortens consent retention to three years.
const modules = ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports'];
const tom = { personName: 'Tom Nguyen', role: 'Admin', organizationId: 'org-harbourview', organizationName: 'Harbourview Youth Collective', plan: 'Standard', modules };

function privacyApi() {
  let years = 7;
  return async (demo) => {
    await demo.page.route('**/api/**', async (route) => {
      const path = new URL(route.request().url()).pathname;
      if (path === '/api/me') return route.fulfill({ json: tom });
      if (path === '/api/notifications') return route.fulfill({ json: { unread: 0, items: [] } });
      if (path === '/api/me/organizations') return route.fulfill({ json: { organizations: [] } });
      if (path === '/api/settings/privacy' && route.request().method() === 'GET') return route.fulfill({ json: { region: 'Canada (Toronto region)', consentRetentionYears: years } });
      if (path === '/api/settings/privacy') {
        years = route.request().postDataJSON().consentRetentionYears;
        return route.fulfill({ status: 204 });
      }
      return route.fulfill({ status: 599 });
    });
  };
}

export default [
  {
    name: 'privacy-desktop',
    run: async (demo) => {
      await privacyApi()(demo);
      await demo.go('/settings/privacy', { ready: false });
      await demo.app().getByRole('radio', { name: '3 years after the event' }).waitFor();
      demo.mark();
      await demo.pause(3500);
      await demo.click(demo.app().getByRole('radio', { name: '3 years after the event' }));
      await demo.pause(1000);
      await demo.click(demo.app().getByRole('button', { name: 'Save retention' }));
      await demo.app().getByText('Retention saved').waitFor();
      await demo.pause(3500);
    },
  },
];
