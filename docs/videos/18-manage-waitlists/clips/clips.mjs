// Screen recordings for video 18, made with tools/video-record/record-clips.mjs against the
// running frontend. The backend is faked like the e2e suite: Winter Camp with two children on the waitlist.
const modules = ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports'];
const marisol = { personName: 'Marisol Delgado', role: 'ProgramDirector', organizationId: 'org-harbourview', organizationName: 'Harbourview Youth Collective', plan: 'Standard', modules };

function waitlistApi() {
  const winter = { id: 'p-winter', name: 'Winter Camp 2026', startsOn: '2026-12-21', endsOn: '2026-12-23', schedule: '21–23 Dec, 8 am–5 pm', capacity: 60, ages: '6–12', enrollmentOpen: true, seasonConsent: true, status: 'Active', roster: [], events: [], archivedAt: null, archivedBy: null, enrollmentUrl: null, pendingReviews: 0, waitlisted: 2 };
  const request = (id, child, guardian, householdId, position) => ({ id, childId: `c-${id}`, householdId, child, age: 9, guardian, phone: null, language: 'English', medical: null, returning: true, submittedAt: '2026-11-02T15:00:00Z', status: 'Waitlisted', position });
  const requests = [request('kevin', 'Kevin Tran', 'Linh Tran', 'h-tran', 1), request('emily', 'Emily Tran', 'Linh Tran', 'h-tran', 2)];
  return async (demo) => {
    await demo.page.route('**/api/**', async (route) => {
      const url = new URL(route.request().url());
      const path = url.pathname;
      if (path === '/api/me') return route.fulfill({ json: marisol });
      if (path === '/api/programs/p-winter') return route.fulfill({ json: { ...winter, enrolled: winter.roster.length } });
      if (path === '/api/programs/p-winter/enrollments') return route.fulfill({ json: { requests: requests.filter((r) => r.status === url.searchParams.get('status')) } });
      if (path.startsWith('/api/enrollments/')) {
        const r = requests.find((x) => x.id === path.split('/')[3]);
        r.status = 'Accepted';
        for (const behind of requests.filter((x) => x.status === 'Waitlisted' && x.position > r.position)) behind.position--;
        winter.roster.push({ id: r.childId, householdId: r.householdId, name: r.child, age: r.age, householdName: 'Tran' });
        return route.fulfill({ status: 204 });
      }
      return route.fulfill({ status: 599 });
    });
  };
}

export default [
  {
    name: 'move-in-desktop',
    run: async (demo) => {
      await waitlistApi()(demo);
      await demo.go('/programs/p-winter/roster', { ready: false });
      await demo.app().getByRole('heading', { name: 'Roster · Winter Camp 2026' }).waitFor();
      demo.mark();
      await demo.pause(1200);
      await demo.click(demo.app().getByRole('tab', { name: /^Waitlist/ }));
      await demo.pause(1800);
      await demo.click(demo.app().getByRole('button', { name: 'Move in Kevin Tran' }));
      await demo.pause(1000);
      await demo.type(demo.app().getByRole('dialog').getByRole('textbox'), 'A place opened. Camp starts at 8 am.');
      await demo.click(demo.app().getByRole('dialog').getByRole('button', { name: /^Move in and text/ }));
      await demo.pause(1500);
      await demo.click(demo.app().getByRole('tab', { name: /^Waitlist/ }));
      await demo.pause(3000);
    },
  },
];
