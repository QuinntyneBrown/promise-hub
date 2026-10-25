// Screen recordings for video 26, made with tools/video-record/record-clips.mjs against the
// running frontend. The backend is faked like the e2e suite: Linh adds her sister on the family page.
function homeApi() {
  let verified = false;
  const pickups = [];
  const home = () => ({
    language: 'en',
    organization: 'Harbourview Youth Collective',
    phone: '905-555-0100',
    firstName: 'Linh',
    noShows: [],
    children: [
      { id: 'c-kevin', name: 'Kevin Tran', firstName: 'Kevin', pickups: [...pickups], enrollments: [{ program: 'Saturday Sports', status: 'Enrolled', position: null, note: null, startsOn: '2026-09-12', schedule: null }] },
    ],
  });
  return async (demo) => {
    await demo.page.route('**/api/**', async (route) => {
      const path = new URL(route.request().url()).pathname;
      const method = route.request().method();
      if (path === '/api/g/auth/code') return route.fulfill({ status: 202 });
      if (path === '/api/g/auth/verify') {
        verified = true;
        return route.fulfill({ status: 204 });
      }
      if (path.endsWith('/pickups') && method === 'POST') {
        const b = route.request().postDataJSON();
        pickups.push({ id: `pu-${pickups.length + 1}`, name: b.name, relationship: b.relationship });
        return route.fulfill({ status: 201, json: { id: 'pu-1' } });
      }
      if (path.startsWith('/api/g/home/')) {
        if (!verified) return route.fulfill({ status: 401, json: { code: 'verification-required', language: 'en', organization: 'Harbourview Youth Collective', phone: '905-555-0100', contacts: [] } });
        return route.fulfill({ json: home() });
      }
      return route.fulfill({ status: 599 });
    });
  };
}

export default [
  {
    name: 'family-pickups-phone',
    phone: true,
    run: async (demo) => {
      await homeApi()(demo);
      await demo.go('/g/home/tok-home-tran', { ready: false });
      await demo.app().getByRole('heading', { name: 'Check it’s you' }).waitFor();
      demo.mark();
      await demo.pause(1000);
      await demo.type(demo.app().getByLabel('Your mobile number or email'), '905-555-0163');
      await demo.click(demo.app().getByRole('button', { name: 'Send me a code' }));
      await demo.type(demo.app().getByLabel('Six-digit code'), '482913');
      await demo.click(demo.app().getByRole('button', { name: 'Continue' }));
      await demo.app().getByRole('heading', { name: 'Hi Linh' }).waitFor();
      await demo.pause(1500);
      await demo.click(demo.app().getByRole('button', { name: 'Add someone for Kevin' }));
      await demo.type(demo.app().getByRole('dialog').getByLabel('Full name'), 'Mai Tran');
      await demo.type(demo.app().getByRole('dialog').getByLabel('Relationship to Kevin'), 'Aunt');
      await demo.click(demo.app().getByRole('dialog').getByRole('button', { name: 'Add' }));
      await demo.app().getByText('Mai Tran').waitFor();
      await demo.pause(3500);
    },
  },
];
