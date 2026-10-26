// Screen recordings for video 39, made with tools/video-record/record-clips.mjs against the
// running frontend. The backend is faked like the e2e suite: Grace names Northgate and sees the checklist move on.
const grace = { personName: 'Grace Mensah', role: 'Admin', organizationId: 'org-northgate', organizationName: 'Northgate Community Church Kids', plan: 'Free', modules: ['Roster', 'RollCall', 'QuickCards'] };

function setupApi() {
  let confirmed = false;
  let profile = { name: 'Northgate Community Church Kids', city: 'Burlington, Ontario' };
  const steps = () => [
    { key: 'organization', done: confirmed },
    { key: 'modules', done: true },
    { key: 'program', done: true },
    { key: 'children', done: true },
    { key: 'staff', done: false },
  ];
  return async (demo) => {
    await demo.page.route('**/api/**', async (route) => {
      const path = new URL(route.request().url()).pathname;
      if (path === '/api/me') return route.fulfill({ json: { ...grace, organizationName: profile.name } });
      if (path === '/api/notifications') return route.fulfill({ json: { unread: 0, items: [] } });
      if (path === '/api/setup') {
        const s = steps();
        const next = s.find((x) => !x.done)?.key ?? null;
        return route.fulfill({ json: { steps: s, next, complete: next === null } });
      }
      if (path === '/api/settings/organization' && route.request().method() === 'GET') return route.fulfill({ json: { ...profile, plan: 'Free' } });
      if (path === '/api/settings/organization') {
        profile = route.request().postDataJSON();
        confirmed = true;
        return route.fulfill({ status: 204 });
      }
      return route.fulfill({ status: 599 });
    });
  };
}

export default [
  {
    name: 'setup-desktop',
    run: async (demo) => {
      await setupApi()(demo);
      await demo.go('/setup', { ready: false });
      await demo.app().getByRole('list', { name: 'Setup steps' }).waitFor();
      demo.mark();
      await demo.pause(3000);
      await demo.click(demo.app().getByRole('link', { name: /Name your organization/ }));
      await demo.app().getByLabel('Organization name').waitFor();
      await demo.pause(1200);
      await demo.app().getByLabel('Organization name').fill('Northgate Kids');
      await demo.pause(800);
      await demo.click(demo.app().getByRole('button', { name: 'Save and continue' }));
      await demo.app().getByRole('list', { name: 'Setup steps' }).waitFor();
      await demo.pause(3500);
    },
  },
];
