// Screen recordings for video 47, made with tools/video-record/record-clips.mjs against the
// running frontend. The backend is faked like the e2e suite: Tom adds an organization, then suspends one.
const modules = ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports'];
const tom = { personName: 'Tom Nguyen', role: 'Admin', organizationId: 'org-harbourview', organizationName: 'Harbourview Youth Collective', plan: 'Standard', modules };

function platformApi() {
  const orgs = [
    { id: 'org-harbourview', name: 'Harbourview Youth Collective', plan: 'Standard', activeChildren: 7, modulesOn: 8, status: 'Active', suspensionReason: null },
    { id: 'org-northgate', name: 'Northgate Community Church Kids', plan: 'Free', activeChildren: 2, modulesOn: 3, status: 'SettingUp', suspensionReason: null },
  ];
  return async (demo) => {
    await demo.page.route('**/api/**', async (route) => {
      const url = new URL(route.request().url());
      const method = route.request().method();
      if (url.pathname === '/api/me') return route.fulfill({ json: tom });
      if (url.pathname === '/api/notifications') return route.fulfill({ json: { unread: 0, items: [] } });
      if (url.pathname === '/api/me/organizations') return route.fulfill({ json: { organizations: [] } });
      if (url.pathname === '/api/platform/organizations' && method === 'GET') {
        return route.fulfill({ json: { organizations: [...orgs].sort((a, b) => a.name.localeCompare(b.name)) } });
      }
      if (url.pathname === '/api/platform/organizations' && method === 'POST') {
        const body = route.request().postDataJSON();
        orgs.push({ id: 'org-kya', name: body.name, plan: body.plan, activeChildren: 0, modulesOn: body.preset === 'Just check-in' ? 3 : 8, status: 'SettingUp', suspensionReason: null });
        return route.fulfill({ status: 201, json: { id: 'org-kya' } });
      }
      const change = /^\/api\/platform\/organizations\/([^/]+)\/(suspend|reinstate)$/.exec(url.pathname);
      if (change) {
        orgs.find((o) => o.id === change[1]).status = change[2] === 'suspend' ? 'Suspended' : 'SettingUp';
        return route.fulfill({ status: 204 });
      }
      return route.fulfill({ status: 599 });
    });
  };
}

export default [
  {
    name: 'add-desktop',
    run: async (demo) => {
      await platformApi()(demo);
      await demo.go('/admin/organizations', { ready: false });
      await demo.app().getByRole('table', { name: 'Organizations' }).waitFor();
      demo.mark();
      await demo.pause(3000);
      await demo.click(demo.app().getByRole('button', { name: 'Add organization' }));
      const dialog = demo.app().getByRole('dialog');
      await dialog.getByLabel('Organization name').pressSequentially('Kitchener Youth Alliance', { delay: 60 });
      await dialog.getByLabel('First admin’s email').pressSequentially('dana@kitcheneryouth.example', { delay: 50 });
      await dialog.getByLabel('Modules').selectOption({ label: 'Just check-in' });
      await demo.pause(1000);
      await demo.click(dialog.getByRole('button', { name: 'Create and invite' }));
      await dialog.getByRole('heading', { name: 'Kitchener Youth Alliance is ready' }).waitFor();
      await demo.pause(2500);
      await demo.click(dialog.getByRole('button', { name: 'Done' }));
      await demo.pause(3000);
    },
  },
  {
    name: 'suspend-desktop',
    run: async (demo) => {
      await platformApi()(demo);
      await demo.go('/admin/organizations', { ready: false });
      await demo.app().getByRole('table', { name: 'Organizations' }).waitFor();
      demo.mark();
      await demo.pause(2000);
      await demo.click(demo.app().getByRole('button', { name: 'Suspend Northgate Community Church Kids' }));
      await demo.pause(1500);
      await demo.click(demo.app().getByRole('dialog').getByRole('button', { name: 'Suspend' }));
      await demo.app().getByRole('button', { name: 'Reinstate Northgate Community Church Kids' }).waitFor();
      await demo.pause(3000);
      await demo.click(demo.app().getByRole('button', { name: 'Reinstate Northgate Community Church Kids' }));
      await demo.pause(3000);
    },
  },
];
