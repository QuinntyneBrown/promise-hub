// Screen recordings for video 16, made with tools/video-record/record-clips.mjs against the
// running frontend. The backend is faked like the e2e suite: three children waiting review for Winter Camp.
const modules = ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports'];
const tom = { personName: 'Tom Nguyen', role: 'Admin', organizationId: 'org-harbourview', organizationName: 'Harbourview Youth Collective', plan: 'Standard', modules };

function reviewApi() {
  const winter = { id: 'p-winter', name: 'Winter Camp 2026', startsOn: '2026-12-21', endsOn: '2026-12-23', schedule: '21–23 Dec, 8 am–5 pm', capacity: 60, ages: '6–12', enrollmentOpen: true, seasonConsent: true, status: 'Active', enrolled: 0, roster: [], events: [], archivedAt: null, archivedBy: null, enrollmentUrl: 'http://localhost:4317/g/enroll/winter-camp-2026', pendingReviews: 3, waitlisted: 0 };
  const request = (id, child, age, guardian, phone, householdId, returning, medical) => ({ id, childId: `c-${id}`, householdId, child, age, guardian, phone, language: 'English', medical, returning, submittedAt: '2026-11-02T15:00:00Z', status: 'WaitingReview', position: null });
  const requests = [
    request('ada', 'Ada Okafor', 9, 'Ngozi Okafor', '905-555-0300', 'h-okafor', false, 'Shellfish'),
    request('kevin', 'Kevin Tran', 10, 'Linh Tran', '905-555-0177', 'h-tran', true, null),
    request('yusuf', 'Yusuf Haddad', 8, 'Omar Haddad', '905-555-0190', 'h-haddad', true, null),
  ];
  return async (demo) => {
    await demo.page.route('**/api/**', async (route) => {
      const url = new URL(route.request().url());
      const path = url.pathname;
      if (path === '/api/me') return route.fulfill({ json: tom });
      if (path === '/api/programs/p-winter') return route.fulfill({ json: { ...winter, enrolled: winter.roster.length, pendingReviews: requests.filter((r) => r.status === 'WaitingReview').length } });
      if (path === '/api/programs/p-winter/enrollments') return route.fulfill({ json: { requests: requests.filter((r) => r.status === url.searchParams.get('status')) } });
      if (path.startsWith('/api/enrollments')) {
        const body = route.request().postDataJSON();
        const ids = body.ids ?? [path.split('/')[3]];
        for (const r of requests.filter((x) => ids.includes(x.id))) {
          if (body.decision === 'Accept') {
            r.status = 'Accepted';
            winter.roster.push({ id: r.childId, householdId: r.householdId, name: r.child, age: r.age, householdName: r.child.split(' ')[1] });
          } else if (body.decision === 'Waitlist') {
            r.status = 'Waitlisted';
            r.position = requests.filter((x) => x.status === 'Waitlisted').length;
          } else r.status = 'Declined';
        }
        return route.fulfill({ status: 204 });
      }
      return route.fulfill({ status: 599 });
    });
  };
}

export default [
  {
    name: 'review-one-desktop',
    run: async (demo) => {
      await reviewApi()(demo);
      await demo.go('/programs/p-winter/roster', { ready: false });
      await demo.app().getByRole('heading', { name: 'Roster · Winter Camp 2026' }).waitFor();
      demo.mark();
      await demo.pause(2000);
      await demo.click(demo.app().getByRole('button', { name: 'Accept Ada Okafor' }));
      await demo.pause(1200);
      await demo.type(demo.app().getByRole('dialog').getByRole('textbox'), 'Welcome! Camp starts at 8 am.');
      await demo.click(demo.app().getByRole('dialog').getByRole('button', { name: 'Accept and text Ngozi' }));
      await demo.pause(2500);
      await demo.click(demo.app().getByRole('tab', { name: /^Enrolled/ }));
      await demo.pause(2500);
    },
  },
  {
    name: 'bulk-review-phone',
    phone: true,
    run: async (demo) => {
      await reviewApi()(demo);
      await demo.go('/programs/p-winter/roster', { ready: false });
      await demo.app().getByRole('heading', { name: 'Roster · Winter Camp 2026' }).waitFor();
      demo.mark();
      await demo.pause(1500);
      await demo.click(demo.app().getByRole('checkbox', { name: 'Select Kevin Tran' }));
      await demo.click(demo.app().getByRole('checkbox', { name: 'Select Yusuf Haddad' }));
      await demo.pause(1200);
      await demo.click(demo.app().getByRole('region', { name: 'Selected enrollments' }).getByRole('button', { name: 'Accept 2' }));
      await demo.pause(1500);
      await demo.click(demo.app().getByRole('dialog').getByRole('button', { name: 'Accept 2' }));
      await demo.pause(3000);
    },
  },
];
