// Screen recordings for video 44, made with tools/video-record/record-clips.mjs against the
// running frontend. The backend is faked like the e2e suite: Tom searches the log for Mateo and narrows to views.
const modules = ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports'];
const tom = { personName: 'Tom Nguyen', role: 'Admin', organizationId: 'org-harbourview', organizationName: 'Harbourview Youth Collective', plan: 'Standard', modules };
const entries = [
  { when: '2026-11-05T20:41:00Z', who: 'Carmen Rivera', action: 'Signed', record: 'PermissionSlip', summary: 'Mateo Rivera · signed by Carmen Rivera · version 1', device: 'Phone' },
  { when: '2026-11-05T18:10:00Z', who: 'Tom Nguyen', action: 'Updated', record: 'Enrollment', summary: 'Kevin Tran · After-School Tutoring · accepted', device: 'Laptop' },
  { when: '2026-11-04T23:05:00Z', who: 'Jaylen Okafor', action: 'Viewed', record: 'ChildMedical', summary: 'Mateo Rivera · medical details', device: 'Phone' },
  { when: '2026-11-02T14:10:00Z', who: 'Tom Nguyen', action: 'Viewed', record: 'ChildMedical', summary: 'Sofía Rivera · medical details', device: 'Laptop' },
];

function auditApi() {
  return async (demo) => {
    await demo.page.route('**/api/**', async (route) => {
      const url = new URL(route.request().url());
      if (url.pathname === '/api/me') return route.fulfill({ json: tom });
      if (url.pathname === '/api/notifications') return route.fulfill({ json: { unread: 0, items: [] } });
      if (url.pathname === '/api/me/organizations') return route.fulfill({ json: { organizations: [] } });
      if (url.pathname === '/api/audit') {
        const q = (url.searchParams.get('q') ?? '').toLowerCase();
        const action = url.searchParams.get('action');
        const list = entries.filter((e) => (!q || `${e.who} ${e.record} ${e.summary}`.toLowerCase().includes(q)) && (!action || e.action === action));
        return route.fulfill({ json: { entries: list, total: list.length, page: 1, pageSize: 50 } });
      }
      return route.fulfill({ status: 599 });
    });
  };
}

export default [
  {
    name: 'audit-desktop',
    run: async (demo) => {
      await auditApi()(demo);
      await demo.go('/settings/audit', { ready: false });
      await demo.app().getByRole('table', { name: 'Audit log' }).waitFor();
      demo.mark();
      await demo.pause(3000);
      await demo.app().getByRole('main').getByRole('searchbox').pressSequentially('Mateo', { delay: 120 });
      await demo.pause(2500);
      await demo.app().getByLabel('Action').selectOption({ label: 'Viewed' });
      await demo.pause(3500);
    },
  },
];
