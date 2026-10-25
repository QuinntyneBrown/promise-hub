// Screen recordings for video 02, made with tools/video-record/record-clips.mjs against the
// running frontend. The backend is faked like the e2e suite: sign-in, MFA, sign-out and /me.
const people = {
  'jaylen@harbourview.example': { personName: 'Jaylen Okafor', role: 'SiteLead', mfa: false },
  'tom@harbourview.example': { personName: 'Tom Nguyen', role: 'Admin', mfa: true },
};
const password = 'harbour-tutoring-2026';
const code = '246810';

async function fakeApi(demo) {
  let signedIn = null;
  let pending = null;
  await demo.page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    const body = route.request().postDataJSON?.() ?? {};
    if (path === '/api/me') {
      const p = people[signedIn];
      return p
        ? route.fulfill({ json: { personName: p.personName, role: p.role, organizationId: 'org-harbourview', organizationName: 'Harbourview Youth Collective', plan: 'Standard' } })
        : route.fulfill({ status: 401, json: { code: 'unauthenticated' } });
    }
    if (path === '/api/auth/sign-in') {
      const p = people[body.email];
      if (!p || body.password !== password) return route.fulfill({ status: 401, json: { code: 'invalid-credentials' } });
      if (p.mfa) {
        pending = body.email;
        return route.fulfill({ json: { status: 'mfa-required' } });
      }
      signedIn = body.email;
      return route.fulfill({ json: { status: 'signed-in' } });
    }
    if (path === '/api/auth/mfa') {
      if (body.code !== code) return route.fulfill({ status: 401, json: { code: 'invalid-code' } });
      signedIn = pending;
      return route.fulfill({ json: { status: 'signed-in' } });
    }
    if (path === '/api/auth/sign-out') {
      signedIn = null;
      return route.fulfill({ status: 204 });
    }
    return route.fulfill({ status: 599 });
  });
}

async function open(demo, path) {
  await demo.go(path, { ready: false });
  await demo.app().getByRole('heading', { level: 1 }).waitFor();
  await demo.pause(600);
}

export default [
  {
    name: 'sign-in-desktop',
    run: async (demo) => {
      await fakeApi(demo);
      await open(demo, '/');
      demo.mark();
      await demo.pause(1200);
      const app = demo.app();
      await demo.type(app.getByLabel('Work email'), 'jaylen@harbourview.example');
      await demo.type(app.getByLabel('Password', { exact: true }), 'harbour-tutoring');
      await demo.click(app.getByRole('button', { name: 'Sign in' }));
      await demo.pause(2200);
      await demo.type(app.getByLabel('Password', { exact: true }), password);
      await demo.click(app.getByRole('button', { name: 'Sign in' }));
      await app.getByRole('heading', { name: 'Welcome, Jaylen' }).waitFor();
      await demo.pause(1500);
      await demo.click(app.getByRole('button', { name: /^Account menu for/ }));
      await demo.pause(1500);
      await demo.click(app.getByRole('menuitem', { name: 'Sign out' }));
      await demo.pause(1500);
    },
  },
  {
    name: 'mfa-phone',
    phone: true,
    run: async (demo) => {
      await fakeApi(demo);
      await open(demo, '/');
      demo.mark();
      await demo.pause(1000);
      const app = demo.app();
      await demo.type(app.getByLabel('Work email'), 'tom@harbourview.example');
      await demo.type(app.getByLabel('Password', { exact: true }), password);
      await demo.click(app.getByRole('button', { name: 'Sign in' }));
      await app.getByRole('heading', { name: 'Enter your code' }).waitFor();
      await demo.pause(1200);
      await demo.type(app.getByLabel('Six-digit code'), code);
      await demo.click(app.getByRole('button', { name: 'Continue' }));
      await app.getByRole('heading', { name: 'Welcome, Tom' }).waitFor();
      await demo.pause(1800);
    },
  },
];
