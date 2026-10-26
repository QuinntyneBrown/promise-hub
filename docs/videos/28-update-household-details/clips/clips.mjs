// Screen recordings for video 28, made with tools/video-record/record-clips.mjs against the
// running frontend. The backend is faked like the e2e suite: Linh corrects her email and Kevin's allergy.
function homeApi() {
  let verified = false;
  const state = { email: null, language: 'English', allergies: null, medication: null };
  const home = () => ({
    language: state.language === 'French' ? 'fr' : 'en',
    organization: 'Harbourview Youth Collective',
    phone: '905-555-0100',
    firstName: 'Linh',
    noShows: [],
    pickupRequests: [],
    contact: { name: 'Linh Tran', mobile: '905-555-0163', email: state.email, language: state.language },
    children: [
      { id: 'c-kevin', name: 'Kevin Tran', firstName: 'Kevin', pickups: [], allergies: state.allergies, medication: state.medication,
        enrollments: [{ program: 'Saturday Sports', status: 'Enrolled', position: null, note: null, startsOn: '2026-09-12', schedule: null }] },
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
      if (path.endsWith('/household') && method === 'PUT') {
        const b = route.request().postDataJSON();
        Object.assign(state, { email: b.email, language: b.language });
        return route.fulfill({ status: 204 });
      }
      if (path.endsWith('/medical') && method === 'PUT') {
        const b = route.request().postDataJSON();
        Object.assign(state, { allergies: b.allergies, medication: b.medication });
        return route.fulfill({ status: 204 });
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
    name: 'update-details-phone',
    phone: true,
    run: async (demo) => {
      await homeApi()(demo);
      await demo.go('/g/home/tok-home-tran', { ready: false });
      await demo.app().getByRole('heading', { name: 'Check it’s you' }).waitFor();
      demo.mark();
      await demo.pause(800);
      await demo.type(demo.app().getByLabel('Your mobile number or email'), '905-555-0163');
      await demo.click(demo.app().getByRole('button', { name: 'Send me a code' }));
      await demo.type(demo.app().getByLabel('Six-digit code'), '482913');
      await demo.click(demo.app().getByRole('button', { name: 'Continue' }));
      await demo.app().getByRole('heading', { name: 'Hi Linh' }).waitFor();
      await demo.pause(1200);
      await demo.click(demo.app().getByRole('button', { name: 'Update your details' }));
      await demo.type(demo.app().getByRole('dialog').getByLabel('Email'), 'linh.tran@example.com');
      await demo.click(demo.app().getByRole('dialog').getByRole('button', { name: 'Save' }));
      await demo.pause(1500);
      await demo.click(demo.app().getByRole('button', { name: 'Update Kevin’s medical details' }));
      await demo.type(demo.app().getByRole('dialog').getByLabel('Allergies'), 'Peanuts (hives)');
      await demo.click(demo.app().getByRole('dialog').getByRole('button', { name: 'Save' }));
      await demo.app().getByText('Peanuts (hives)').waitFor();
      await demo.pause(3000);
    },
  },
];
