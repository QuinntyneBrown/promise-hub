// Screen recordings and screenshots for video 66, made with tools/video-record/record-clips.mjs against the
// running frontend. The backend is faked like the e2e suite: Sofía Rivera (Youth, Harbourview, consent given, in
// After-School Tutoring, mentored by Daniel Osei) reflects on Pick Up the Towel, and Daniel reads what she shared (L2-089, L2-079).
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const shots = join(dirname(fileURLToPath(import.meta.url)), '..', 'shots');
const ON = ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports', 'Learning', 'Mentoring'];
const WORDS = 'Mateo cleared the table without being asked. I want to notice first.';
const ACTION = 'Pack my own lunch on Thursday.';
const MOODS = ['Hopeful', 'Thoughtful', 'Unsure', 'Challenged'];

const newState = (x = {}) => ({ who: 'sofia', modules: ON, consent: true, failSave: false, reflection: null, ...x });

const LESSON = {
  id: 'l-towel', kind: 'Reading', title: 'Pick Up the Towel', reading: 'The captain and the kit bags', passage: null, minutes: 12,
  objectives: ['Notice what needs doing', 'Serve without being asked'],
  body: 'The night before the big game, the team captain stayed behind to pack the kit bags while everyone else went home. Nobody asked her to.\n\nLeading isn’t a title. It’s noticing what needs doing and doing it, especially when nobody is watching.',
  prompts: ['Who picked up the towel for you this week?'],
  moduleId: 'cm-serving', moduleTitle: 'Leading by Serving', trackId: 't-leadership', trackName: 'Leadership Foundations',
  position: 1, lessonCount: 3, hasVideo: false, done: true, next: { id: 'l-line', title: 'Last in Line', kind: 'Scripture' },
};

const ME = {
  sofia: { personName: 'Sofía Rivera', role: 'Youth', membershipId: 'm-sofia' },
  daniel: { personName: 'Daniel Osei', role: 'Mentor', membershipId: 'm-daniel' },
};

const RECORD = {
  id: 'c-sofia', name: 'Sofía Rivera', preferredName: 'Sofía', pronouns: 'she/her', age: 12, school: 'Bennetto Elementary, Grade 7',
  programs: ['After-School Tutoring'], mentor: 'Daniel Osei',
  guardians: [{ name: 'Carmen Rivera', relationship: 'Parent', mobile: '905-555-0142', email: 'carmen.rivera@example.com', isPrimary: true }],
  recentAttendance: [{ session: 'Tutoring night', at: '2026-11-05T21:02:00Z', status: 'CheckedIn' }],
};

/** The Learning and Mentoring APIs as the real ones answer Sofía and Daniel. */
async function fakeApi(demo, state) {
  await demo.page.route('**/api/**', async (route) => {
    const req = route.request();
    const path = new URL(req.url()).pathname;
    const me = ME[state.who];
    if (path === '/api/me')
      return route.fulfill({ json: { ...me, organizationId: 'org-harbourview', organizationName: 'Harbourview Youth Collective', plan: 'Standard', modules: state.modules } });
    if (path === '/api/notifications') return route.fulfill({ json: { unread: 0, items: [] } });
    if (path === '/api/me/organizations') return route.fulfill({ json: { organizations: [] } });
    if (path.startsWith('/api/learning') && !state.modules.includes('Learning')) return route.fulfill({ status: 404 });
    if (path === '/api/learning/onboarding')
      return route.fulfill({ json: { status: 'completed', step: 3, preferredName: 'Sofía', pronouns: 'she/her', lessonReminders: true, mentorMessages: true, announcements: false, program: { name: 'After-School Tutoring', schedule: 'Mon–Thu, 4–6 pm', startsOn: '2026-09-08', endsOn: '2027-06-24' } } });
    if (path.startsWith('/api/learning') && !state.consent) return route.fulfill({ status: 403, json: { code: 'consent-required', consentAge: 13 } });
    if (path === '/api/learning/lessons/l-towel') return route.fulfill({ json: LESSON });
    if (path === '/api/learning/lessons/l-coach/reflection') return route.fulfill({ status: 403, json: { code: 'locked', unlockAfter: 'Last in Line' } });
    if (path === '/api/learning/lessons/l-towel/reflection') {
      if (req.method() === 'GET')
        return route.fulfill({
          json: { lessonId: 'l-towel', lessonTitle: 'Pick Up the Towel', moduleId: 'cm-serving', moduleTitle: 'Leading by Serving', prompts: LESSON.prompts, mentorName: 'Daniel Osei', reflection: state.reflection },
        });
      if (state.failSave) return route.fulfill({ status: 500 });
      const body = req.postDataJSON();
      const errors = {};
      if (!MOODS.includes(body.mood)) errors.mood = 'Choose how you’re feeling.';
      if (!body.text?.trim()) errors.text = 'Write your reflection.';
      if (Object.keys(errors).length) return route.fulfill({ status: 422, json: { errors } });
      state.reflection = { mood: body.mood, text: body.text, action: body.action, shared: body.shared, savedAt: '2026-11-05T21:12:00Z' };
      return route.fulfill({ json: state.reflection });
    }
    if (path.startsWith('/api/mentoring') && !state.modules.includes('Mentoring')) return route.fulfill({ status: 404 });
    if (path === '/api/mentoring/youth/c-sofia') return route.fulfill({ json: RECORD });
    if (path === '/api/mentoring/youth/c-sofia/reflections') {
      const r = state.reflection;
      return route.fulfill({
        json: { childId: 'c-sofia', name: 'Sofía Rivera', reflections: r?.shared ? [{ lessonId: 'l-towel', lessonTitle: 'Pick Up the Towel', moduleTitle: 'Leading by Serving', mood: r.mood, text: r.text, action: r.action, savedAt: r.savedAt }] : [] },
      });
    }
    return route.fulfill({ status: 404 });
  });
}

const app = (demo) => demo.app();
const heading = (demo, name) => app(demo).getByRole('heading', { level: 1, name }).first().waitFor();
const shot = (demo, name) => demo.page.locator('iframe').screenshot({ path: join(shots, `${name}.png`) });
const scroll = async (demo, y) => {
  await app(demo).locator('body').evaluate((_, top) => window.scrollTo({ top, behavior: 'smooth' }), y);
  await demo.pause(1200);
};
const mood = (demo, name) => app(demo).getByRole('radio', { name: new RegExp(`^${name}`) });
const words = (demo) => app(demo).getByRole('textbox', { name: 'Your reflection' });
const action = (demo) => app(demo).getByRole('textbox', { name: /One thing I’ll do this week/ });
const share = (demo) => app(demo).getByRole('switch', { name: /^Share with my mentor/ });
const button = (demo, name) => app(demo).getByRole('button', { name });

const write = async (demo, withAction = true) => {
  await demo.click(mood(demo, 'Thoughtful'));
  await demo.type(words(demo), WORDS);
  if (withAction) await demo.type(action(demo), ACTION);
};

export default [
  {
    // From the lesson: Write your reflection, a mood, her words, one thing she'll do, saved privately.
    name: 'write-desktop',
    run: async (demo) => {
      await fakeApi(demo, newState());
      await demo.go('/learning/lessons/l-towel', { ready: false });
      await heading(demo, 'Pick Up the Towel');
      demo.mark();
      await demo.pause(1400);
      await demo.click(app(demo).getByRole('link', { name: 'Write your reflection' }));
      await heading(demo, 'Reflect on Pick Up the Towel');
      await demo.pause(2400);
      await shot(demo, 'desktop-empty');
      await write(demo);
      await demo.pause(800);
      await shot(demo, 'desktop-reflection');
      await demo.click(button(demo, 'Save reflection'));
      await app(demo).getByText('Only you can see it.').first().waitFor();
      await scroll(demo, 0);
      await demo.pause(2400);
      await shot(demo, 'desktop-private');
    },
  },
  {
    // Sharing: on, saved, and Daniel can read it.
    name: 'share-desktop',
    run: async (demo) => {
      const state = newState({ reflection: { mood: 'Thoughtful', text: WORDS, action: ACTION, shared: false, savedAt: '2026-11-05T21:12:00Z' } });
      await fakeApi(demo, state);
      await demo.go('/learning/lessons/l-towel/reflection', { ready: false });
      await heading(demo, 'Reflect on Pick Up the Towel');
      demo.mark();
      await demo.pause(1200);
      await share(demo).scrollIntoViewIfNeeded();
      await demo.pause(800);
      await demo.click(share(demo));
      await demo.pause(1600);
      await demo.click(button(demo, 'Save reflection'));
      await app(demo).getByText('Daniel Osei can read it.').first().waitFor();
      await scroll(demo, 0);
      await demo.pause(2400);
      await shot(demo, 'desktop-shared');
    },
  },
  {
    // Daniel opens Sofía's record: Shared reflections.
    name: 'mentor-desktop',
    run: async (demo) => {
      await fakeApi(demo, newState({ who: 'daniel', reflection: { mood: 'Thoughtful', text: WORDS, action: ACTION, shared: true, savedAt: '2026-11-05T21:12:00Z' } }));
      await demo.go('/mentoring/youth/c-sofia', { ready: false });
      await heading(demo, 'Sofía Rivera');
      demo.mark();
      await demo.pause(1600);
      await app(demo).getByRole('region', { name: 'Shared reflections' }).scrollIntoViewIfNeeded();
      await demo.pause(3200);
      await shot(demo, 'desktop-mentor');
    },
  },
  {
    // Leaving with unsaved words: the dialog, Save draft and leave, and the draft restored.
    name: 'leave-desktop',
    run: async (demo) => {
      await fakeApi(demo, newState());
      await demo.go('/learning/lessons/l-towel/reflection', { ready: false });
      await heading(demo, 'Reflect on Pick Up the Towel');
      await app(demo).locator('body').evaluate(() => localStorage.clear());
      demo.mark();
      await demo.pause(800);
      await write(demo, false);
      await scroll(demo, 0);
      await demo.click(app(demo).getByRole('navigation', { name: 'Breadcrumb' }).getByRole('link', { name: 'Pick Up the Towel' }));
      await app(demo).getByRole('dialog', { name: 'Leave without saving?' }).waitFor();
      await demo.pause(2400);
      await shot(demo, 'desktop-leave');
      await demo.click(button(demo, 'Save draft and leave'));
      await heading(demo, 'Pick Up the Towel');
      await demo.pause(1400);
      await demo.click(app(demo).getByRole('link', { name: 'Write your reflection' }));
      await app(demo).getByText('We restored your draft').waitFor();
      await demo.pause(2600);
      await shot(demo, 'desktop-restored');
    },
  },
  {
    // On a phone: the reflection in one column, and the mentor's card.
    name: 'phone',
    phone: true,
    run: async (demo) => {
      const state = newState({ reflection: { mood: 'Thoughtful', text: WORDS, action: ACTION, shared: true, savedAt: '2026-11-05T21:12:00Z' } });
      await fakeApi(demo, state);
      await demo.go('/learning/lessons/l-towel/reflection', { ready: false });
      await heading(demo, 'Reflect on Pick Up the Towel');
      demo.mark();
      await demo.pause(2200);
      await shot(demo, 'phone-reflection');
      await scroll(demo, 700);
      await demo.pause(1800);
      state.who = 'daniel';
      await demo.go('/mentoring/youth/c-sofia', { ready: false });
      await heading(demo, 'Sofía Rivera');
      await app(demo).getByRole('region', { name: 'Shared reflections' }).scrollIntoViewIfNeeded();
      await demo.pause(2400);
      await shot(demo, 'phone-mentor');
    },
  },
  {
    // Invalid, a failed save, a lesson not reached, not open yet, and Learning off.
    name: 'states-desktop',
    run: async (demo) => {
      const state = newState();
      await fakeApi(demo, state);
      await demo.go('/learning/lessons/l-towel/reflection', { ready: false });
      await heading(demo, 'Reflect on Pick Up the Towel');
      demo.mark();
      await demo.pause(1000);
      await demo.click(button(demo, 'Save reflection'));
      await app(demo).getByText('Fix these to continue').waitFor();
      await demo.pause(2400);
      await shot(demo, 'desktop-invalid');
      state.failSave = true;
      await write(demo, false);
      await demo.click(button(demo, 'Save reflection'));
      await app(demo).getByText('We couldn’t save your reflection').waitFor();
      await scroll(demo, 0);
      await demo.pause(2000);
      await shot(demo, 'desktop-failed');
      await app(demo).locator('body').evaluate(() => localStorage.clear());
      await demo.go('/learning/lessons/l-coach/reflection', { ready: false });
      const leave = app(demo).getByRole('button', { name: 'Leave without saving' });
      if (await leave.isVisible().catch(() => false)) await leave.click();
      await app(demo).getByText('Finish Last in Line first').waitFor();
      await demo.pause(1800);
      await shot(demo, 'desktop-locked');
      state.consent = false;
      await demo.go('/learning/lessons/l-towel/reflection', { ready: false });
      await app(demo).getByText('Learning isn’t open for you yet').waitFor();
      await demo.pause(1800);
      await shot(demo, 'desktop-not-open');
      state.consent = true;
      state.modules = ON.filter((x) => x !== 'Learning');
      await demo.go('/learning/lessons/l-towel/reflection', { ready: false });
      await demo.pause(2400);
      await shot(demo, 'desktop-learning-off');
    },
  },
];
