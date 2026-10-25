// Screen recordings for video 17, made with tools/video-record/record-clips.mjs against the
// running frontend. The backend is faked like the e2e suite: the Tran family's home link after Tom's decisions.
function homeApi(language) {
  let verified = false;
  const tran = {
    language: 'en',
    organization: 'Harbourview Youth Collective',
    phone: '905-555-0100',
    firstName: 'Linh',
    children: [
      { name: 'Emily Tran', firstName: 'Emily', enrollments: [{ program: 'Winter Camp 2026', status: 'Waitlisted', position: 1, note: null, startsOn: '2026-12-21', schedule: '21–23 Dec, 8 am–5 pm' }] },
      { name: 'Kevin Tran', firstName: 'Kevin', enrollments: [{ program: 'Winter Camp 2026', status: 'Enrolled', position: null, note: 'Welcome! Camp starts at 8 am.', startsOn: '2026-12-21', schedule: '21–23 Dec, 8 am–5 pm' }] },
    ],
  };
  const rivera = {
    language: 'es',
    organization: 'Harbourview Youth Collective',
    phone: '905-555-0100',
    firstName: 'Carmen',
    children: [
      { name: 'Mateo Rivera', firstName: 'Mateo', enrollments: [{ program: 'Winter Camp 2026', status: 'Enrolled', position: null, note: null, startsOn: '2026-12-21', schedule: null }] },
      { name: 'Sofía Rivera', firstName: 'Sofía', enrollments: [{ program: 'Winter Camp 2026', status: 'Declined', position: null, note: 'Camp is for ages 6 to 12.', startsOn: '2026-12-21', schedule: null }] },
    ],
  };
  const home = language === 'es' ? rivera : tran;
  return async (demo) => {
    await demo.page.route('**/api/**', async (route) => {
      const path = new URL(route.request().url()).pathname;
      if (path === '/api/g/auth/code') return route.fulfill({ status: 202 });
      if (path === '/api/g/auth/verify') {
        verified = true;
        return route.fulfill({ status: 204 });
      }
      if (path.startsWith('/api/g/home/')) {
        if (!verified) return route.fulfill({ status: 401, json: { code: 'verification-required', language: home.language, organization: home.organization, phone: home.phone, contacts: [] } });
        return route.fulfill({ json: home });
      }
      return route.fulfill({ status: 599 });
    });
  };
}

export default [
  {
    name: 'linh-home-phone',
    phone: true,
    run: async (demo) => {
      await homeApi('en')(demo);
      await demo.go('/g/home/tok-home-tran', { ready: false });
      await demo.app().getByRole('heading', { name: 'Check it’s you' }).waitFor();
      demo.mark();
      await demo.pause(1500);
      await demo.type(demo.app().getByLabel('Your mobile number or email'), '905-555-0163');
      await demo.click(demo.app().getByRole('button', { name: 'Send me a code' }));
      await demo.type(demo.app().getByLabel('Six-digit code'), '482913');
      await demo.click(demo.app().getByRole('button', { name: 'Continue' }));
      await demo.app().getByRole('heading', { name: 'Hi Linh' }).waitFor();
      await demo.pause(5000);
    },
  },
];
