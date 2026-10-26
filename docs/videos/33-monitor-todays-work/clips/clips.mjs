// Screen recordings for video 33, made with tools/video-record/record-clips.mjs against the
// running frontend. The backend is faked like the e2e suite: Marisol opens Today, then with only Roster on.
const all = ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports'];
const marisol = (modules) => ({ personName: 'Marisol Delgado', role: 'ProgramDirector', organizationId: 'org-harbourview', organizationName: 'Harbourview Youth Collective', plan: 'Standard', modules });

const sessions = [
  { id: 'e-tutoring-today', name: 'Tutoring night', startsAt: '2026-11-05T21:00:00Z', endsAt: '2026-11-05T23:00:00Z', place: 'Harbourview Community Centre, Room 2', checkedIn: 3, expected: 4, absent: 0, notYet: 1 },
];
const summary = (modules) => ({
  activeChildren: 6,
  households: 5,
  slipsDue: modules.includes('Slips') ? [{ eventId: 'e-rbg', title: 'Fall field trip: Royal Botanical Gardens', signBy: '2026-11-12', signed: 1, expected: 4, unsigned: 3 }] : null,
  comingUp: [
    { id: 'e-sports', name: 'Saturday Sports', startsAt: '2026-11-07T15:00:00Z', place: 'Bennetto School gym', requiresSlip: false },
    { id: 'e-rbg', name: 'Fall field trip: Royal Botanical Gardens', startsAt: '2026-11-14T14:00:00Z', place: 'Royal Botanical Gardens', requiresSlip: true },
  ],
  tasks: modules.includes('Incidents') ? [{ kind: 'incidents', count: 1 }, { kind: 'enrollments', count: 3 }] : [{ kind: 'enrollments', count: 3 }],
});

function todayApi(modules) {
  return async (demo) => {
    await demo.page.route('**/api/**', async (route) => {
      const path = new URL(route.request().url()).pathname;
      if (path === '/api/me') return route.fulfill({ json: marisol(modules) });
      if (path === '/api/sessions/today') return route.fulfill({ json: { sessions } });
      if (path === '/api/today') return route.fulfill({ json: summary(modules) });
      return route.fulfill({ status: 599 });
    });
  };
}

export default [
  {
    name: 'today-desktop',
    run: async (demo) => {
      await todayApi(all)(demo);
      await demo.go('/', { ready: false });
      await demo.app().getByRole('heading', { name: 'Waiting for you' }).waitFor();
      demo.mark();
      await demo.pause(4000);
      await demo.app().getByRole('heading', { name: 'Coming up' }).scrollIntoViewIfNeeded();
      await demo.pause(4000);
    },
  },
  {
    name: 'today-roster-only',
    run: async (demo) => {
      await todayApi(['Roster'])(demo);
      await demo.go('/', { ready: false });
      await demo.app().getByRole('heading', { name: 'Coming up' }).waitFor();
      demo.mark();
      await demo.pause(5000);
    },
  },
];
