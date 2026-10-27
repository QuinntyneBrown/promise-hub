// Screen recordings and screenshots for video 53, made with tools/video-record/record-clips.mjs against the
// running frontend. The backend is faked like the e2e suite: Nadia's first-run setup saved step by step, Finish later
// and resume, the program step, the no-cohort lock on lessons and its waiting state (L2-059, L2-060).
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const shots = join(dirname(fileURLToPath(import.meta.url)), '..', 'shots');
const suite = ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports'];
const nadia = { personName: 'Nadia Haddad', role: 'Youth', organizationId: 'org-harbourview', organizationName: 'Harbourview Youth Collective', plan: 'Standard', modules: [...suite, 'Learning', 'Mentoring'] };
const tutoring = { name: 'After-School Tutoring', schedule: 'Mon–Thu, 4–6 pm', startsOn: '2026-09-08', endsOn: '2027-06-24' };

/** The API as the real one answers it; `state` holds the saved setup, the placement and a pending fault. */
async function fakeApi(demo, state) {
  await demo.page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    const method = route.request().method();
    if (path === '/api/me') return route.fulfill({ json: nadia });
    if (path === '/api/notifications') return route.fulfill({ json: { unread: 0, items: [] } });
    if (path === '/api/me/organizations') return route.fulfill({ json: { organizations: [] } });
    if (path === '/api/learning/lessons') {
      return route.fulfill(state.placed ? { json: { lessons: [] } } : { status: 403, json: { code: 'no-cohort' } });
    }
    if (path === '/api/learning/onboarding' && method === 'GET') {
      const s = state.setup;
      return route.fulfill({
        json: {
          status: s ? (s.completed ? 'completed' : 'in-progress') : 'not-started',
          step: s?.step ?? 1,
          preferredName: s?.preferredName ?? 'Nadia',
          pronouns: s?.pronouns ?? null,
          lessonReminders: s?.lessonReminders ?? true,
          mentorMessages: s?.mentorMessages ?? true,
          announcements: s?.announcements ?? false,
          program: state.placed ? tutoring : null,
        },
      });
    }
    if (path === '/api/learning/onboarding' && method === 'PUT') {
      if (state.failNext) {
        state.failNext = false;
        return route.fulfill({ status: 500, json: { code: 'server-error', reference: 'ERR-7Q2K' } });
      }
      const b = route.request().postDataJSON();
      if (!b.preferredName.trim()) return route.fulfill({ status: 422, json: { errors: { preferredName: 'Tell us what to call you.' } } });
      state.setup = { ...b, preferredName: b.preferredName.trim(), completed: state.setup?.completed ?? false };
      return route.fulfill({ status: 204 });
    }
    if (path === '/api/learning/onboarding/complete') {
      state.setup.completed = true;
      return route.fulfill({ status: 204 });
    }
    return route.fulfill({ status: 404 });
  });
}

const heading = (demo, level, name) => demo.app().getByRole('heading', { level, name }).waitFor();
const shot = (demo, name) => demo.page.locator('iframe').screenshot({ path: join(shots, `${name}.png`) });

export default [
  {
    // Nadia opens Learning for the first time: setup opens, and she goes through the three steps to Learning.
    name: 'first-run-phone',
    phone: true,
    run: async (demo) => {
      await fakeApi(demo, { placed: true });
      await demo.go('/learning', { ready: false });
      await heading(demo, 2, 'About you');
      demo.mark();
      await demo.pause(1200);
      await shot(demo, 'phone-welcome-you');
      await demo.app().getByLabel('Pronouns (optional)').selectOption({ label: 'She / her' });
      await demo.pause(800);
      await demo.click(demo.app().getByRole('button', { name: 'Continue' }));
      await heading(demo, 2, 'What should we tell you about?');
      await demo.pause(1000);
      await shot(demo, 'phone-welcome-preferences');
      await demo.click(demo.app().getByRole('switch', { name: 'Announcements' }));
      await demo.pause(800);
      await demo.click(demo.app().getByRole('button', { name: 'Continue' }));
      await heading(demo, 2, 'Meet your program');
      await demo.pause(1400);
      await shot(demo, 'phone-welcome-program');
      await demo.click(demo.app().getByRole('button', { name: 'Finish', exact: true }));
      await heading(demo, 1, 'Learning');
      await demo.app().getByText('You’re all set, Nadia').waitFor();
      await demo.pause(600);
      await shot(demo, 'phone-learning-done');
      await demo.pause(2200);
    },
  },
  {
    // A blank name is refused field by field; a failed save keeps the answers.
    name: 'invalid-phone',
    phone: true,
    run: async (demo) => {
      const state = { placed: true };
      await fakeApi(demo, state);
      await demo.go('/learning/welcome', { ready: false });
      await heading(demo, 2, 'About you');
      demo.mark();
      await demo.app().getByLabel('What should we call you?').fill('');
      await demo.pause(600);
      await demo.click(demo.app().getByRole('button', { name: 'Continue' }));
      await demo.app().getByText('Fix these to continue').waitFor();
      await demo.pause(1400);
      await shot(demo, 'phone-welcome-invalid');
      await demo.type(demo.app().getByLabel('What should we call you?'), 'Nadi');
      state.failNext = true;
      await demo.click(demo.app().getByRole('button', { name: 'Continue' }));
      await demo.app().getByText('We couldn’t save that').waitFor();
      await demo.pause(1400);
      await shot(demo, 'phone-welcome-error');
      await demo.click(demo.app().getByRole('button', { name: 'Continue' }));
      await heading(demo, 2, 'What should we tell you about?');
      await demo.pause(1600);
    },
  },
  {
    // Finish later on step 2, then Learning offers to pick up where she stopped.
    name: 'resume-desktop',
    run: async (demo) => {
      await fakeApi(demo, { placed: true });
      await demo.go('/learning/welcome', { ready: false });
      await heading(demo, 2, 'About you');
      demo.mark();
      await demo.pause(800);
      await demo.click(demo.app().getByRole('button', { name: 'Continue' }));
      await heading(demo, 2, 'What should we tell you about?');
      await demo.pause(1000);
      await shot(demo, 'desktop-welcome-preferences');
      await demo.click(demo.app().getByRole('button', { name: 'Finish later' }));
      await demo.app().getByText('You stopped at step 2 of 3.').waitFor();
      await demo.pause(1400);
      await shot(demo, 'desktop-resume');
      await demo.click(demo.app().getByRole('link', { name: 'Pick up where I left off' }));
      await heading(demo, 2, 'What should we tell you about?');
      await demo.pause(2000);
    },
  },
  {
    // Not in a program: the waiting note on the program step, the waiting state on Learning, then placed.
    name: 'no-cohort-phone',
    phone: true,
    run: async (demo) => {
      const state = { placed: false, setup: { step: 3, preferredName: 'Nadia', pronouns: null, lessonReminders: true, mentorMessages: true, announcements: false, completed: false } };
      await fakeApi(demo, state);
      await demo.go('/learning/welcome', { ready: false });
      await heading(demo, 2, 'Meet your program');
      demo.mark();
      await demo.pause(1400);
      await shot(demo, 'phone-welcome-waiting');
      await demo.click(demo.app().getByRole('button', { name: 'Finish', exact: true }));
      await demo.app().getByRole('heading', { name: 'You’re not in a program yet' }).waitFor();
      await demo.pause(1600);
      await shot(demo, 'phone-no-cohort');
      state.placed = true;
      await demo.click(demo.app().getByRole('button', { name: 'Check again' }));
      await demo.app().getByRole('heading', { name: 'No lessons yet' }).waitFor();
      await demo.pause(2000);
    },
  },
];
