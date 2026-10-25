// Screen recordings for video 20, made with tools/video-record/record-clips.mjs against the
// running frontend. The backend is faked like the e2e suite: Aisha reports Jordan's allergic reaction.
const modules = ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports'];
const aisha = { personName: 'Aisha Bello', role: 'YouthWorker', organizationId: 'org-harbourview', organizationName: 'Harbourview Youth Collective', plan: 'Standard', modules };

function incidentApi() {
  let saved = null;
  return async (demo) => {
    await demo.page.route('**/api/**', async (route) => {
      const path = new URL(route.request().url()).pathname;
      const method = route.request().method();
      if (path === '/api/me') return route.fulfill({ json: aisha });
      if (path === '/api/incidents/form') return route.fulfill({ json: { supervisor: 'Marisol Delgado', children: [{ id: 'c-jordan', name: 'Jordan Thompson' }, { id: 'c-mateo', name: 'Mateo Rivera' }, { id: 'c-sofia', name: 'Sofía Rivera' }] } });
      if (path === '/api/incidents' && method === 'POST') {
        const b = route.request().postDataJSON();
        if (!b.whatHappened?.trim()) return route.fulfill({ status: 422, json: { errors: { childId: 'Choose the child involved.', whatHappened: 'Describe what happened.', actionTaken: 'Describe what you did.' } } });
        saved = { id: 'inc-1', ...b, child: 'Jordan Thompson', status: 'NeedsReview', reportedBy: 'Aisha Bello', reportedAt: '2026-10-21T18:50:00Z' };
        return route.fulfill({ status: 201, json: { id: 'inc-1' } });
      }
      if (path === '/api/incidents/inc-1') return route.fulfill({ json: saved });
      return route.fulfill({ status: 599 });
    });
  };
}

export default [
  {
    name: 'aisha-report-phone',
    phone: true,
    run: async (demo) => {
      await incidentApi()(demo);
      await demo.go('/incidents/new', { ready: false });
      await demo.app().getByRole('heading', { name: 'Report an incident' }).waitFor();
      demo.mark();
      await demo.pause(1200);
      await demo.click(demo.app().getByRole('group', { name: 'Type' }).getByRole('radio', { name: 'Illness or allergic reaction' }));
      await demo.app().getByLabel('Child involved').selectOption({ label: 'Jordan Thompson' });
      await demo.app().getByLabel('When').fill('2026-10-21T17:15');
      await demo.app().getByLabel('Where').selectOption({ label: 'Room 2' });
      await demo.type(demo.app().getByLabel('What happened'), 'Jordan’s lips swelled after snack.');
      await demo.type(demo.app().getByLabel('What you did'), 'Gave his antihistamine and called Dana.');
      await demo.click(demo.app().getByRole('group', { name: 'Guardian' }).getByRole('radio', { name: 'Called and reached' }));
      await demo.click(demo.app().getByRole('group', { name: 'Severity' }).getByRole('radio', { name: /^Moderate/ }));
      await demo.click(demo.app().getByRole('button', { name: 'Submit report' }));
      await demo.app().getByTestId('incident-status').waitFor();
      await demo.pause(3500);
    },
  },
];
