// Screen recordings for video 31, made with tools/video-record/record-clips.mjs against the
// running frontend. The backend is faked like the e2e suite: Priya fills the field trip's gap.
const modules = ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports'];
const priya = { personName: 'Priya Raman', role: 'VolunteerCoordinator', organizationId: 'org-harbourview', organizationName: 'Harbourview Youth Collective', plan: 'Standard', modules };

function coverageApi() {
  const people = [
    { id: 'm-aisha', name: 'Aisha Bello', role: 'YouthWorker' },
    { id: 'm-jaylen', name: 'Jaylen Okafor', role: 'SiteLead' },
    { id: 'm-priya', name: 'Priya Raman', role: 'VolunteerCoordinator' },
  ];
  const sessions = [
    { id: 'e-tonight', name: 'Tutoring night', startsAt: '2026-11-05T21:00:00Z', endsAt: '2026-11-05T23:00:00Z', place: 'Room 2', staff: [people[0], people[1]], gap: false },
    { id: 'e-rbg', name: 'Fall field trip: Royal Botanical Gardens', startsAt: '2026-11-14T14:00:00Z', endsAt: '2026-11-14T20:00:00Z', place: 'Royal Botanical Gardens', staff: [], gap: true },
  ];
  return async (demo) => {
    await demo.page.route('**/api/**', async (route) => {
      const path = new URL(route.request().url()).pathname;
      if (path === '/api/me') return route.fulfill({ json: priya });
      if (path === '/api/coverage') return route.fulfill({ json: { sessions, people } });
      if (path.endsWith('/staff')) {
        const ids = route.request().postDataJSON().membershipIds;
        const s = sessions.find((x) => x.id === path.split('/')[3]);
        s.staff = people.filter((p) => ids.includes(p.id));
        s.gap = s.staff.length === 0;
        return route.fulfill({ status: 204 });
      }
      return route.fulfill({ status: 599 });
    });
  };
}

export default [
  {
    name: 'coverage-desktop',
    run: async (demo) => {
      await coverageApi()(demo);
      await demo.go('/settings/coverage', { ready: false });
      await demo.app().getByRole('heading', { name: 'Staff coverage' }).waitFor();
      demo.mark();
      await demo.pause(2000);
      await demo.click(demo.app().getByRole('button', { name: 'Assign staff to Fall field trip: Royal Botanical Gardens' }));
      await demo.pause(1000);
      await demo.click(demo.app().getByRole('dialog').getByRole('checkbox', { name: 'Aisha Bello' }));
      await demo.click(demo.app().getByRole('dialog').getByRole('checkbox', { name: 'Jaylen Okafor' }));
      await demo.click(demo.app().getByRole('dialog').getByRole('button', { name: 'Save' }));
      await demo.pause(3500);
    },
  },
];
