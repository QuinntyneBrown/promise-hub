// Screen recordings for video 23, made with tools/video-record/record-clips.mjs against the
// running frontend. The backend is faked like the e2e suite: Linh opens the link in tonight's no-show text.
function homeApi() {
  let verified = false;
  const home = {
    language: 'en',
    organization: 'Harbourview Youth Collective',
    phone: '905-555-0100',
    firstName: 'Linh',
    children: [
      { name: 'Emily Tran', firstName: 'Emily', enrollments: [{ program: 'After-School Tutoring', status: 'Enrolled', position: null, note: null, startsOn: '2026-09-08', schedule: null }] },
      { name: 'Kevin Tran', firstName: 'Kevin', enrollments: [{ program: 'After-School Tutoring', status: 'Enrolled', position: null, note: null, startsOn: '2026-09-08', schedule: null }] },
    ],
    noShows: [{ eventId: 'e-tonight', event: 'Tutoring night', startsAt: '2026-11-05T21:00:00Z', children: ['Emily', 'Kevin'] }],
  };
  return async (demo) => {
    await demo.page.route('**/api/**', async (route) => {
      const path = new URL(route.request().url()).pathname;
      if (path === '/api/g/auth/code') return route.fulfill({ status: 202 });
      if (path === '/api/g/auth/verify') {
        verified = true;
        return route.fulfill({ status: 204 });
      }
      if (path.endsWith('/no-show')) {
        home.noShows = [];
        return route.fulfill({ status: 204 });
      }
      if (path.startsWith('/api/g/home/')) {
        if (!verified) return route.fulfill({ status: 401, json: { code: 'verification-required', language: 'en', organization: home.organization, phone: home.phone, contacts: [] } });
        return route.fulfill({ json: home });
      }
      return route.fulfill({ status: 599 });
    });
  };
}

export default [
  {
    name: 'answer-phone',
    phone: true,
    run: async (demo) => {
      await homeApi()(demo);
      await demo.go('/g/home/tok-home-tran', { ready: false });
      await demo.app().getByRole('heading', { name: 'Check it’s you' }).waitFor();
      demo.mark();
      await demo.pause(1200);
      await demo.type(demo.app().getByLabel('Your mobile number or email'), '905-555-0163');
      await demo.click(demo.app().getByRole('button', { name: 'Send me a code' }));
      await demo.type(demo.app().getByLabel('Six-digit code'), '482913');
      await demo.click(demo.app().getByRole('button', { name: 'Continue' }));
      await demo.app().getByRole('heading', { name: 'Hi Linh' }).waitFor();
      await demo.pause(2500);
      await demo.click(demo.app().getByRole('button', { name: 'Absent tonight' }));
      await demo.pause(3500);
    },
  },
];
