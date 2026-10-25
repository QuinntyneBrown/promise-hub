// Screen recordings for video 19, made with tools/video-record/record-clips.mjs against the
// running frontend. The backend is faked like the e2e suite: Jaylen reports Mateo's fall on the stairs.
const modules = ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports'];
const jaylen = { personName: 'Jaylen Okafor', role: 'SiteLead', organizationId: 'org-harbourview', organizationName: 'Harbourview Youth Collective', plan: 'Standard', modules };

function incidentApi() {
  let saved = null;
  return async (demo) => {
    await demo.page.route('**/api/**', async (route) => {
      const path = new URL(route.request().url()).pathname;
      const method = route.request().method();
      if (path === '/api/me') return route.fulfill({ json: jaylen });
      if (path === '/api/incidents/form') return route.fulfill({ json: { supervisor: 'Marisol Delgado', children: [{ id: 'c-jordan', name: 'Jordan Thompson' }, { id: 'c-mateo', name: 'Mateo Rivera' }, { id: 'c-sofia', name: 'Sofía Rivera' }] } });
      if (path === '/api/incidents' && method === 'POST') {
        const b = route.request().postDataJSON();
        if (!b.whatHappened?.trim()) return route.fulfill({ status: 422, json: { errors: { childId: 'Choose the child involved.', whatHappened: 'Describe what happened.', actionTaken: 'Describe what you did.' } } });
        saved = { id: 'inc-1', ...b, child: 'Mateo Rivera', status: 'NeedsReview', reportedBy: 'Jaylen Okafor', reportedAt: '2026-10-21T18:50:00Z' };
        return route.fulfill({ status: 201, json: { id: 'inc-1' } });
      }
      if (path === '/api/incidents/inc-1') return route.fulfill({ json: saved });
      return route.fulfill({ status: 599 });
    });
  };
}

export default [
  {
    name: 'report-phone',
    phone: true,
    run: async (demo) => {
      await incidentApi()(demo);
      await demo.go('/incidents/new', { ready: false });
      await demo.app().getByRole('heading', { name: 'Report an incident' }).waitFor();
      demo.mark();
      await demo.pause(1200);
      await demo.click(demo.app().getByRole('group', { name: 'Type' }).getByRole('radio', { name: 'Injury' }));
      await demo.app().getByLabel('Child involved').selectOption({ label: 'Mateo Rivera' });
      await demo.app().getByLabel('When').fill('2026-10-21T18:40');
      await demo.app().getByLabel('Where').selectOption({ label: 'Stairwell' });
      await demo.type(demo.app().getByLabel('What happened'), 'Mateo slipped on the stairs and hit his knee.');
      await demo.type(demo.app().getByLabel('What you did'), 'Ice pack for ten minutes; he went back to tutoring.');
      await demo.click(demo.app().getByRole('group', { name: 'Guardian' }).getByRole('radio', { name: 'Called and reached' }));
      await demo.click(demo.app().getByRole('group', { name: 'Severity' }).getByRole('radio', { name: /^Minor/ }));
      await demo.click(demo.app().getByRole('button', { name: 'Submit report' }));
      await demo.app().getByTestId('incident-status').waitFor();
      await demo.pause(3500);
    },
  },
];
