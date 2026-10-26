// Screen recordings for video 40, made with tools/video-record/record-clips.mjs against the
// running frontend. The backend is faked like the e2e suite: Priya switches from Harbourview to Northgate.
const all = ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports'];
const orgs = {
  'm-priya-hyc': { personName: 'Priya Raman', role: 'VolunteerCoordinator', organizationId: 'org-harbourview', organizationName: 'Harbourview Youth Collective', plan: 'Standard', modules: all },
  'm-priya-ngk': { personName: 'Priya Raman', role: 'VolunteerCoordinator', organizationId: 'org-northgate', organizationName: 'Northgate Community Church Kids', plan: 'Free', modules: ['Roster', 'RollCall', 'QuickCards'] },
};

function switchApi() {
  // The active membership lives in the page's storage, so it survives the full reload a switch causes.
  return async (demo) => {
    await demo.page.route('**/api/**', async (route) => {
      const path = new URL(route.request().url()).pathname;
      const active = (await demo.page.evaluate(() => sessionStorage.getItem('demo-active')).catch(() => null)) ?? 'm-priya-hyc';
      if (path === '/api/me') return route.fulfill({ json: orgs[active] });
      if (path === '/api/me/organizations') {
        return route.fulfill({ json: { organizations: [
          { membershipId: 'm-priya-hyc', name: 'Harbourview Youth Collective', role: 'VolunteerCoordinator', active: active === 'm-priya-hyc' },
          { membershipId: 'm-priya-ngk', name: 'Northgate Community Church Kids', role: 'VolunteerCoordinator', active: active === 'm-priya-ngk' },
        ] } });
      }
      if (path === '/api/me/organization') {
        const id = route.request().postDataJSON().membershipId;
        await demo.page.evaluate((v) => sessionStorage.setItem('demo-active', v), id);
        return route.fulfill({ status: 204 });
      }
      if (path === '/api/notifications') return route.fulfill({ json: { unread: 0, items: [] } });
      if (path === '/api/sessions/today') return route.fulfill({ json: { sessions: [] } });
      if (path === '/api/today') {
        return route.fulfill({ json: active === 'm-priya-hyc'
          ? { activeChildren: 6, households: 5, slipsDue: [], comingUp: [{ id: 'e1', name: 'Saturday Sports', startsAt: '2026-11-07T15:00:00Z', place: 'Bennetto School gym', requiresSlip: false }], tasks: [] }
          : { activeChildren: 1, households: 1, slipsDue: null, comingUp: [{ id: 'e2', name: 'Kids Club night', startsAt: '2026-11-11T23:00:00Z', place: 'Northgate fellowship hall', requiresSlip: false }], tasks: [] } });
      }
      return route.fulfill({ status: 599 });
    });
  };
}

export default [
  {
    name: 'switch-desktop',
    run: async (demo) => {
      await switchApi()(demo);
      await demo.go('/', { ready: false });
      await demo.app().getByRole('button', { name: /^Organization: Harbourview/ }).waitFor();
      demo.mark();
      await demo.pause(2500);
      await demo.click(demo.app().getByRole('button', { name: /^Organization: Harbourview/ }));
      await demo.pause(1800);
      await demo.click(demo.app().getByRole('menuitemradio', { name: /Northgate/ }));
      await demo.app().getByRole('button', { name: /^Organization: Northgate/ }).waitFor({ timeout: 20000 });
      await demo.pause(3500);
    },
  },
];
