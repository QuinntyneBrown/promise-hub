// Screen recordings for video 29, made with tools/video-record/record-clips.mjs against the
// running frontend. The backend is faked like the e2e suite: Tom invites Sam and changes Jaylen's role.
const modules = ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports'];
const tom = { personName: 'Tom Nguyen', role: 'Admin', organizationId: 'org-harbourview', organizationName: 'Harbourview Youth Collective', plan: 'Standard', modules };

function staffApi() {
  const members = [
    { id: 'm-aisha', name: 'Aisha Bello', email: 'aisha@harbourview.example', role: 'YouthWorker', isYou: false },
    { id: 'm-jaylen', name: 'Jaylen Okafor', email: 'jaylen@harbourview.example', role: 'SiteLead', isYou: false },
    { id: 'm-marisol', name: 'Marisol Delgado', email: 'marisol@harbourview.example', role: 'ProgramDirector', isYou: false },
    { id: 'm-tom', name: 'Tom Nguyen', email: 'tom@harbourview.example', role: 'Admin', isYou: true },
  ];
  const invitations = [];
  return async (demo) => {
    await demo.page.route('**/api/**', async (route) => {
      const path = new URL(route.request().url()).pathname;
      const method = route.request().method();
      if (path === '/api/me') return route.fulfill({ json: tom });
      if (path === '/api/staff') return route.fulfill({ json: { members, invitations } });
      if (path === '/api/staff/invitations' && method === 'POST') {
        const b = route.request().postDataJSON();
        invitations.push({ id: 'inv-1', email: b.email, role: b.role, invitedBy: 'Tom Nguyen', invitedAt: '2026-11-05T21:00:00Z', expiresAt: '2026-11-19T21:00:00Z' });
        return route.fulfill({ status: 201, json: { id: 'inv-1' } });
      }
      if (path.endsWith('/role')) {
        members.find((m) => m.id === path.split('/')[3]).role = route.request().postDataJSON().role;
        return route.fulfill({ status: 204 });
      }
      return route.fulfill({ status: 599 });
    });
  };
}

export default [
  {
    name: 'staff-desktop',
    run: async (demo) => {
      await staffApi()(demo);
      await demo.go('/settings/staff', { ready: false });
      await demo.app().getByRole('heading', { name: 'Staff and roles' }).waitFor();
      demo.mark();
      await demo.pause(1500);
      await demo.click(demo.app().getByRole('button', { name: 'Invite staff' }));
      await demo.type(demo.app().getByRole('dialog').getByLabel('Work email'), 'sam@harbourview.example');
      await demo.click(demo.app().getByRole('dialog').getByRole('button', { name: 'Send invitation' }));
      await demo.pause(1800);
      await demo.click(demo.app().getByRole('button', { name: 'Change role for Jaylen Okafor' }));
      await demo.click(demo.app().getByRole('dialog').getByRole('radio', { name: /^Program director/ }));
      await demo.click(demo.app().getByRole('dialog').getByRole('button', { name: 'Change role' }));
      await demo.pause(3000);
    },
  },
];
