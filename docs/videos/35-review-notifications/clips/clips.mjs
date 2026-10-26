// Screen recordings for video 35, made with tools/video-record/record-clips.mjs against the
// running frontend. The backend is faked like the e2e suite: Marisol opens the bell, then a notice.
const modules = ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports'];
const marisol = { personName: 'Marisol Delgado', role: 'ProgramDirector', organizationId: 'org-harbourview', organizationName: 'Harbourview Youth Collective', plan: 'Standard', modules };

function notificationsApi() {
  const items = [
    { id: 'n-2', kind: 'incidents', text: 'Incident reported by Aisha Bello: Sofía Rivera, behaviour.', link: '/notifications', createdAt: '2026-11-05T22:52:00Z', readAt: null },
    { id: 'n-1', kind: 'incidents', text: 'Incident reported by Jaylen Okafor: Mateo Rivera, injury.', link: '/notifications', createdAt: '2026-11-05T21:40:00Z', readAt: null },
  ];
  return async (demo) => {
    await demo.page.route('**/api/**', async (route) => {
      const path = new URL(route.request().url()).pathname;
      if (path === '/api/me') return route.fulfill({ json: marisol });
      if (path === '/api/sessions/today') return route.fulfill({ json: { sessions: [] } });
      if (path === '/api/today') return route.fulfill({ json: { activeChildren: 6, households: 5, slipsDue: [], comingUp: [], tasks: [{ kind: 'incidents', count: 2 }] } });
      if (path === '/api/notifications') return route.fulfill({ json: { unread: items.filter((n) => !n.readAt).length, items } });
      if (path === '/api/notifications/read-all') {
        items.forEach((n) => (n.readAt ??= '2026-11-05T23:00:00Z'));
        return route.fulfill({ status: 204 });
      }
      const read = path.match(/^\/api\/notifications\/([^/]+)\/read$/);
      if (read) {
        items.find((n) => n.id === read[1]).readAt ??= '2026-11-05T23:00:00Z';
        return route.fulfill({ status: 204 });
      }
      return route.fulfill({ status: 599 });
    });
  };
}

export default [
  {
    name: 'notifications-desktop',
    run: async (demo) => {
      await notificationsApi()(demo);
      await demo.go('/', { ready: false });
      await demo.app().getByRole('button', { name: 'Notifications, 2 unread' }).waitFor();
      demo.mark();
      await demo.pause(2500);
      await demo.click(demo.app().getByRole('button', { name: 'Notifications, 2 unread' }));
      await demo.app().getByRole('heading', { name: 'Notifications', level: 1 }).waitFor();
      await demo.pause(3500);
      await demo.click(demo.app().getByRole('button', { name: 'Mark all read' }));
      await demo.app().getByText('All read').waitFor();
      await demo.pause(3500);
    },
  },
];
