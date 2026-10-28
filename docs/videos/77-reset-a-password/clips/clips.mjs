// Screen recordings and screenshots for video 77, made with tools/video-record/record-clips.mjs against the running
// frontend. The backend is faked like the e2e suite: Sofía Rivera (Youth) asks for a link on her phone, resends it, and
// sets a new password that the shared policy first refuses; Daniel Osei (Mentor) resets on a laptop and lands on
// Mentoring; Lucía Rivera at Northgate, where Learning and Mentoring are off, lands on Today; then an earlier link that a
// newer one replaced, an address that isn't an email and a save that failed (L2-115, L2-116, ADR 0071).
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const shots = join(dirname(fileURLToPath(import.meta.url)), '..', 'shots');
const ON = ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports', 'Learning', 'Mentoring'];
const HARBOURVIEW = { organizationId: 'org-harbourview', organizationName: 'Harbourview Youth Collective', plan: 'Standard', modules: ON };
const NORTHGATE = { organizationId: 'org-northgate', organizationName: 'Northgate Community Church Kids', plan: 'Free', modules: ['Roster', 'RollCall', 'QuickCards'] };
const PEOPLE = {
  'sofia@harbourview.example': { personName: 'Sofía Rivera', role: 'Youth', membershipId: 'm-sofia', ...HARBOURVIEW },
  'daniel@harbourview.example': { personName: 'Daniel Osei', role: 'Mentor', membershipId: 'm-daniel', ...HARBOURVIEW },
  'lucia@northgate.example': { personName: 'Lucía Rivera', role: 'Youth', membershipId: 'm-lucia', ...NORTHGATE },
};
const TOKENS = { 'tok-reset-sofia': 'sofia@harbourview.example', 'tok-reset-daniel': 'daniel@harbourview.example', 'tok-reset-lucia': 'lucia@northgate.example' };

const newState = (x = {}) => ({ signedIn: null, emails: {}, used: new Set(), failSave: false, ...x });

/** The policy as PasswordPolicy answers it (L2-053). */
function weak(password, email) {
  if (password.length < 12) return 'Use at least 12 characters.';
  if (password.length > 128) return 'Use at most 128 characters.';
  const local = email.split('@')[0];
  if (local.length >= 3 && password.toLowerCase().includes(local)) return 'Don’t use your email in your password.';
  return null;
}

/** The reset endpoints as the real API answers them, then the role homes. */
async function fakeApi(demo, state) {
  await demo.page.route('**/api/**', async (route) => {
    const req = route.request();
    const path = new URL(req.url()).pathname;
    if (path === '/api/auth/forgot-password') {
      const email = req.postDataJSON().email.trim().toLowerCase();
      const sent = state.emails[email] ?? 0;
      if (PEOPLE[email] && sent < 3) {
        state.emails[email] = sent + 1;
        // A newer link replaces the earlier ones.
        for (const [token, to] of Object.entries(TOKENS)) if (to === email) state.used.add(token);
      }
      return route.fulfill({ status: 202 });
    }
    const check = /^\/api\/auth\/reset-password\/(.+)$/.exec(path);
    if (check) {
      const email = TOKENS[check[1]];
      return email && !state.used.has(check[1]) ? route.fulfill({ json: { email } }) : route.fulfill({ status: 410 });
    }
    if (path === '/api/auth/reset-password') {
      if (state.failSave) return route.fulfill({ status: 500 });
      const b = req.postDataJSON();
      const email = TOKENS[b.token];
      if (!email || state.used.has(b.token)) return route.fulfill({ status: 410 });
      const errors = {};
      const problem = weak(b.password, email);
      if (problem) errors.password = problem;
      if (b.repeat !== b.password) errors.repeat = 'The two passwords don’t match.';
      if (Object.keys(errors).length) return route.fulfill({ status: 422, json: { errors } });
      state.used.add(b.token);
      state.signedIn = email;
      return route.fulfill({ json: { status: 'signed-in' } });
    }
    const me = state.signedIn && PEOPLE[state.signedIn];
    if (!me) return route.fulfill({ status: 401, json: { code: 'unauthenticated' } });
    if (path === '/api/me') return route.fulfill({ json: me });
    if (path === '/api/notifications') return route.fulfill({ json: { unread: 0, items: [] } });
    if (path === '/api/me/organizations') return route.fulfill({ json: { organizations: [] } });
    if (path === '/api/today') return route.fulfill({ json: { tasks: [], events: [], counts: {} } });
    if (path.startsWith('/api/learning') && !me.modules.includes('Learning')) return route.fulfill({ status: 404 });
    if (path.startsWith('/api/mentoring') && !me.modules.includes('Mentoring')) return route.fulfill({ status: 404 });
    if (path === '/api/learning/onboarding')
      return route.fulfill({ json: { status: 'completed', step: 3, preferredName: 'Sofía', pronouns: 'she/her', lessonReminders: true, mentorMessages: true, announcements: false, program: { name: 'After-School Tutoring', schedule: 'Mon–Thu, 4–6 pm', startsOn: '2026-09-08', endsOn: '2027-06-24' } } });
    if (path === '/api/learning/home')
      return route.fulfill({
        json: {
          completedLessons: 3,
          totalLessons: 7,
          next: { lessonId: 'l-line', kind: 'Scripture', title: 'Last in Line', moduleId: 'cm-serving', moduleTitle: 'Leading by Serving', reading: 'Mark 10:35–45', minutes: 15, moduleCompleted: 1, moduleTotal: 3 },
          tracks: [{ id: 't-leadership', name: 'Leadership Foundations', description: 'Growing as a leader at home, at school and in the cohort.', program: 'After-School Tutoring', completedLessons: 3, totalLessons: 7 }],
          assigned: [],
        },
      });
    if (path === '/api/mentoring/dashboard')
      return route.fulfill({
        json: {
          youth: [
            { id: 'c-mateo', name: 'Mateo Rivera', age: 9, programs: ['After-School Tutoring'], cohorts: 'After-School Tutoring', trackIds: [], atRisk: false },
            { id: 'c-sofia', name: 'Sofía Rivera', age: 12, programs: ['After-School Tutoring'], cohorts: 'After-School Tutoring', trackIds: [], atRisk: false },
          ],
          cohorts: [{ programId: 'p-tutoring', name: 'After-School Tutoring', term: '2026–27', role: 'Supporting', youthCount: 4 }],
          checkedInThisWeek: 3,
          recentActivity: [],
          followUps: [],
        },
      });
    if (path === '/api/mentoring/reviews') return route.fulfill({ json: { items: [] } });
    return route.fulfill({ status: 404 });
  });
}

const app = (demo) => demo.app();
const heading = (demo, name) => app(demo).getByRole('heading', { level: 1, name }).first().waitFor();
const shot = (demo, name) => demo.page.locator('iframe').screenshot({ path: join(shots, `${name}.png`) });
const button = (demo, name) => app(demo).getByRole('button', { name, exact: true });

async function choose(demo, password) {
  await app(demo).getByLabel('New password').fill('');
  await app(demo).getByLabel('Repeat it').fill('');
  await demo.type(app(demo).getByLabel('New password'), password);
  await demo.type(app(demo).getByLabel('Repeat it'), password);
  await demo.click(button(demo, 'Set password and sign in'));
}

export default [
  {
    // Sofía forgot her password: from sign-in she asks for a link, sees her address masked, and resends it.
    name: 'forgot-phone',
    phone: true,
    run: async (demo) => {
      await fakeApi(demo, newState());
      await demo.go('/sign-in', { ready: false });
      await heading(demo, 'Sign in to PromiseHub');
      demo.mark();
      await demo.pause(1200);
      await demo.click(app(demo).getByRole('link', { name: 'Forgot your password?' }));
      await heading(demo, 'Reset your password');
      await demo.pause(1000);
      await shot(demo, 'phone-forgot');
      await demo.type(app(demo).getByLabel('Email', { exact: true }), 'sofia@harbourview.example');
      await demo.click(button(demo, 'Email me a reset link'));
      await heading(demo, 'Check your email');
      await demo.pause(2600);
      await shot(demo, 'phone-sent');
      await demo.click(button(demo, 'Resend the email'));
      await app(demo).getByText('Sent again').waitFor();
      await demo.pause(2400);
      await shot(demo, 'phone-resent');
      await demo.pause(800);
    },
  },
  {
    // Sofía opens the emailed link: her email name in the password is refused, then she lands on Learning.
    name: 'reset-phone',
    phone: true,
    run: async (demo) => {
      await fakeApi(demo, newState());
      await demo.go('/reset-password?token=tok-reset-sofia', { ready: false });
      await heading(demo, 'Choose a new password');
      demo.mark();
      demo.note('From the emailed link');
      await demo.pause(1800);
      await shot(demo, 'phone-reset');
      demo.note('');
      await choose(demo, 'sofia-loves-coding');
      await app(demo).getByText('Don’t use your email in your password.').waitFor();
      await demo.pause(2200);
      await shot(demo, 'phone-weak');
      await choose(demo, 'harbour-lantern-2027');
      await heading(demo, 'Learning');
      await app(demo).getByText('Password updated').waitFor();
      await demo.pause(1200);
      await shot(demo, 'phone-learning-updated');
      await demo.pause(2200);
    },
  },
  {
    // Daniel resets on a laptop and lands on Mentoring.
    name: 'mentor-desktop',
    run: async (demo) => {
      await fakeApi(demo, newState());
      await demo.go('/reset-password?token=tok-reset-daniel', { ready: false });
      await heading(demo, 'Choose a new password');
      demo.mark();
      await demo.pause(1600);
      await shot(demo, 'desktop-reset-daniel');
      await choose(demo, 'harbour-lantern-2027');
      await heading(demo, 'Mentoring');
      await app(demo).getByText('Password updated').waitFor();
      await demo.pause(1200);
      await shot(demo, 'desktop-mentoring-updated');
      await demo.pause(2200);
    },
  },
  {
    // Lucía at Northgate lands on Today; then an earlier link, an address that isn't an email, and a failed save.
    name: 'states-desktop',
    run: async (demo) => {
      const state = newState();
      await fakeApi(demo, state);
      await demo.go('/reset-password?token=tok-reset-lucia', { ready: false });
      await heading(demo, 'Choose a new password');
      demo.mark();
      await demo.pause(1000);
      await choose(demo, 'harbour-lantern-2027');
      await heading(demo, 'Welcome, Lucía');
      await demo.pause(2400);
      await shot(demo, 'desktop-today-learning-off');
      state.signedIn = null;
      await demo.go('/forgot-password', { ready: false });
      await heading(demo, 'Reset your password');
      await demo.type(app(demo).getByLabel('Email', { exact: true }), 'sofia');
      await demo.click(button(demo, 'Email me a reset link'));
      await app(demo).getByText('Enter your email address.').waitFor();
      await demo.pause(1800);
      await shot(demo, 'desktop-invalid');
      await app(demo).getByLabel('Email', { exact: true }).fill('');
      await demo.type(app(demo).getByLabel('Email', { exact: true }), 'sofia@harbourview.example');
      await demo.click(button(demo, 'Email me a reset link'));
      await heading(demo, 'Check your email');
      await demo.pause(1000);
      demo.note('The earlier link');
      await demo.go('/reset-password?token=tok-reset-sofia', { ready: false });
      await heading(demo, 'This link has expired');
      await demo.pause(2400);
      await shot(demo, 'desktop-expired');
      demo.note('');
      state.used.delete('tok-reset-daniel');
      state.failSave = true;
      await demo.go('/reset-password?token=tok-reset-daniel', { ready: false });
      await heading(demo, 'Choose a new password');
      await choose(demo, 'harbour-lantern-2027');
      await app(demo).getByText('That didn’t save').waitFor();
      await demo.pause(2400);
      await shot(demo, 'desktop-failed');
    },
  },
];
