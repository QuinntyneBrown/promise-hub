// Screen recordings for video 21, made with tools/video-record/record-clips.mjs against the
// running frontend. The backend is faked like the e2e suite: Marisol reviews Jaylen's report of Mateo's fall.
const modules = ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports'];
const marisol = { personName: 'Marisol Delgado', role: 'ProgramDirector', organizationId: 'org-harbourview', organizationName: 'Harbourview Youth Collective', plan: 'Standard', modules };

function reviewApi() {
  const incident = {
    id: 'inc-1',
    category: 'Injury',
    childId: 'c-mateo',
    child: 'Mateo Rivera',
    occurredAt: '2026-10-21T18:40:00Z',
    place: 'Stairwell',
    whatHappened: 'Mateo slipped on the stairs and hit his knee. No head contact.',
    actionTaken: 'Ice pack for ten minutes; he went back to tutoring. Called Carmen at 6:50 pm.',
    guardianContact: 'CalledAndReached',
    severity: 'Minor',
    status: 'NeedsReview',
    reportedBy: 'Jaylen Okafor',
    reportedAt: '2026-10-21T18:52:00Z',
    canReview: true,
    review: null,
    followUps: [],
    trail: [
      { text: 'Jaylen Okafor submitted the report', at: '2026-10-21T18:52:00Z' },
      { text: 'Marisol Delgado opened the report', at: '2026-10-21T19:30:00Z' },
    ],
  };
  return async (demo) => {
    await demo.page.route('**/api/**', async (route) => {
      const path = new URL(route.request().url()).pathname;
      if (path === '/api/me') return route.fulfill({ json: marisol });
      if (path === '/api/incidents/inc-1') return route.fulfill({ json: incident });
      if (path === '/api/incidents/inc-1/review') {
        const b = route.request().postDataJSON();
        Object.assign(incident, { status: 'Closed', review: { note: b.note, outcome: b.outcome, by: 'Marisol Delgado', at: '2026-10-22T09:00:00Z' } });
        incident.trail.push({ text: 'Marisol Delgado reviewed and closed the report', at: '2026-10-22T09:00:00Z' });
        return route.fulfill({ status: 204 });
      }
      if (path === '/api/incidents/inc-1/notes') {
        incident.followUps.push({ text: route.request().postDataJSON().text, by: 'Marisol Delgado', at: '2026-10-22T09:05:00Z' });
        return route.fulfill({ status: 204 });
      }
      return route.fulfill({ status: 599 });
    });
  };
}

export default [
  {
    name: 'review-desktop',
    run: async (demo) => {
      await reviewApi()(demo);
      await demo.go('/incidents/inc-1', { ready: false });
      await demo.app().getByRole('heading', { name: 'Injury · Mateo Rivera' }).waitFor();
      demo.mark();
      await demo.pause(2000);
      await demo.click(demo.app().getByRole('button', { name: 'Mark reviewed' }));
      await demo.pause(800);
      await demo.type(demo.app().getByRole('dialog').getByRole('textbox'), 'Followed first-aid procedure correctly. Stairwell lighting reported.');
      await demo.click(demo.app().getByRole('dialog').getByRole('button', { name: 'Mark reviewed' }));
      await demo.pause(1800);
      await demo.click(demo.app().getByRole('button', { name: 'Add follow-up' }));
      await demo.pause(600);
      await demo.type(demo.app().getByRole('dialog').getByRole('textbox'), 'Building manager replaced the stairwell bulbs.');
      await demo.click(demo.app().getByRole('dialog').getByRole('button', { name: 'Add follow-up' }));
      await demo.pause(3000);
    },
  },
];
