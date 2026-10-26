// Screen recordings and screenshots for video 50, made with tools/video-record/record-clips.mjs against the
// running frontend. The backend is faked like the e2e suite: sign-in with the lock and the inactive account,
// the session, sign-out, and the first endpoint of Learning and Mentoring (L2-046 to L2-050).
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const shots = join(dirname(fileURLToPath(import.meta.url)), '..', 'shots');
const password = 'harbour-tutoring-2026';
const suite = ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports'];
const harbourview = { organizationId: 'org-harbourview', organizationName: 'Harbourview Youth Collective', plan: 'Standard', modules: [...suite, 'Learning', 'Mentoring'] };
const northgate = { organizationId: 'org-northgate', organizationName: 'Northgate Community Church Kids', plan: 'Free', modules: ['Roster', 'RollCall', 'QuickCards'] };
const people = {
  'sofia@harbourview.example': { personName: 'Sofía Rivera', role: 'Youth', ...harbourview },
  'daniel@harbourview.example': { personName: 'Daniel Osei', role: 'Mentor', ...harbourview },
  'lucia@northgate.example': { personName: 'Lucía Rivera', role: 'Youth', ...northgate },
  'nadia@harbourview.example': { personName: 'Nadia Haddad', role: 'Youth', ...harbourview },
};

/** The API as the real one answers it; `state.signedIn` is the email of the session, `state.inactive` the removed accounts. */
async function fakeApi(demo, state) {
  state.failures ??= {};
  await demo.page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    const me = state.signedIn && people[state.signedIn];
    if (path === '/api/auth/sign-in') {
      const { email, password: given } = route.request().postDataJSON();
      const key = email.trim().toLowerCase();
      if ((state.failures[key] ?? 0) >= 5) return route.fulfill({ status: 423, json: { code: 'locked', lockedUntil: '2026-11-05T21:27:00Z' } });
      if (people[key] && given === password && state.inactive?.includes(key)) return route.fulfill({ status: 403, json: { code: 'account-deactivated' } });
      if (!people[key] || given !== password) {
        state.failures[key] = (state.failures[key] ?? 0) + 1;
        return route.fulfill({ status: 401, json: { code: 'invalid-credentials' } });
      }
      state.failures[key] = 0;
      state.signedIn = key;
      return route.fulfill({ json: { status: 'signed-in' } });
    }
    if (path === '/api/auth/sign-out') {
      state.signedIn = null;
      return route.fulfill({ status: 204 });
    }
    if (!me) return route.fulfill({ status: 401, json: { code: 'unauthenticated' } });
    if (path === '/api/me') return route.fulfill({ json: me });
    if (path === '/api/notifications') return route.fulfill({ json: { unread: 0, items: [] } });
    if (path === '/api/me/organizations') return route.fulfill({ json: { organizations: [] } });
    const gate = (module, role, body) => route.fulfill(!me.modules.includes(module) ? { status: 404 } : me.role !== role ? { status: 403 } : { json: body });
    if (path === '/api/learning/me') return gate('Learning', 'Youth', { personName: me.personName, child: null });
    if (path === '/api/mentoring/youth') return gate('Mentoring', 'Mentor', { youth: [] });
    return route.fulfill({ status: 599 });
  });
}

const heading = (demo, name) => demo.app().getByRole('heading', { level: 1, name }).waitFor();
const shot = (demo, name) => demo.page.locator('iframe').screenshot({ path: join(shots, `${name}.png`) });

async function signIn(demo, email, given) {
  await demo.type(demo.app().getByLabel('Email', { exact: true }), email);
  await demo.type(demo.app().getByLabel('Password', { exact: true }), given);
  await demo.click(demo.app().getByRole('button', { name: 'Sign in' }));
}

async function openSignIn(demo) {
  await demo.go('/sign-in', { ready: false });
  await heading(demo, 'Sign in to PromiseHub');
  await demo.pause(500);
}

export default [
  {
    // Sofía, a youth, signs in on her phone and lands on Learning.
    name: 'youth-phone',
    phone: true,
    run: async (demo) => {
      await fakeApi(demo, {});
      await openSignIn(demo);
      demo.mark();
      await shot(demo, 'phone-sign-in');
      await demo.pause(1200);
      await signIn(demo, 'sofia@harbourview.example', password);
      await heading(demo, 'Learning');
      await demo.pause(1200);
      await shot(demo, 'phone-learning');
      await demo.pause(2000);
    },
  },
  {
    // Daniel, a mentor, signs in on a laptop and lands on Mentoring.
    name: 'mentor-desktop',
    run: async (demo) => {
      await fakeApi(demo, {});
      await openSignIn(demo);
      demo.mark();
      await demo.pause(1000);
      await signIn(demo, 'daniel@harbourview.example', password);
      await heading(demo, 'Mentoring');
      await demo.pause(1200);
      await shot(demo, 'desktop-mentoring');
      await demo.pause(2000);
    },
  },
  {
    // Lucía, a youth at Northgate where Learning is off, lands on Today.
    name: 'module-off-phone',
    phone: true,
    run: async (demo) => {
      await fakeApi(demo, {});
      await openSignIn(demo);
      demo.mark();
      await demo.pause(800);
      await signIn(demo, 'lucia@northgate.example', password);
      await heading(demo, 'Welcome, Lucía');
      await demo.pause(1200);
      await shot(demo, 'phone-today-learning-off');
      await demo.pause(2200);
    },
  },
  {
    // Four failures already; the fifth wrong password, then the right one is paused.
    name: 'locked-phone',
    phone: true,
    run: async (demo) => {
      await fakeApi(demo, { failures: { 'sofia@harbourview.example': 4 } });
      await openSignIn(demo);
      demo.mark();
      demo.note('Four wrong tries already');
      await demo.pause(800);
      await signIn(demo, 'sofia@harbourview.example', 'harbour-tutor');
      await demo.app().getByText('That email and password don’t match').waitFor();
      await demo.pause(1000);
      await shot(demo, 'phone-invalid');
      demo.note('');
      await demo.type(demo.app().getByLabel('Password', { exact: true }), password);
      await demo.click(demo.app().getByRole('button', { name: 'Sign in' }));
      await demo.app().getByText('Too many tries').waitFor();
      await demo.pause(1200);
      await shot(demo, 'phone-locked');
      await demo.pause(2500);
    },
  },
  {
    // Sofía signs out of a shared laptop: the signed-out page, and Back leads to sign-in.
    name: 'sign-out-desktop',
    run: async (demo) => {
      await fakeApi(demo, { signedIn: 'sofia@harbourview.example' });
      await demo.go('/learning', { ready: false });
      await heading(demo, 'Learning');
      demo.mark();
      await demo.pause(1500);
      await demo.click(demo.app().getByRole('button', { name: /^Account menu for/ }));
      await demo.pause(900);
      await demo.click(demo.app().getByRole('menuitem', { name: 'Sign out' }));
      await heading(demo, 'You’re signed out');
      await demo.pause(1500);
      await shot(demo, 'desktop-signed-out');
      await demo.pause(1200);
      demo.note('Back');
      await demo.app().goto(new URL('/learning', demo.base).href);
      await heading(demo, 'Sign in to PromiseHub');
      await demo.pause(2200);
    },
  },
  {
    // Nadia's access was turned off: the right password shows the inactive page.
    name: 'inactive-desktop',
    run: async (demo) => {
      await fakeApi(demo, { inactive: ['nadia@harbourview.example'] });
      await openSignIn(demo);
      demo.mark();
      await demo.pause(800);
      await signIn(demo, 'nadia@harbourview.example', password);
      await heading(demo, 'This account is inactive');
      await demo.pause(3700);
    },
  },
];
