// Screen recordings and screenshots for video 65, made with tools/video-record/record-clips.mjs against the
// running frontend. The backend is faked like the e2e suite: Sofía Rivera (Youth, Harbourview, consent given, in
// After-School Tutoring and Saturday Sports) looks at her journey, her badges and her progress (L2-087, L2-088).
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const shots = join(dirname(fileURLToPath(import.meta.url)), '..', 'shots');
const ON = ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports', 'Learning', 'Mentoring'];

const mod = (id, title, lessonCount, completedLessons, status, unlockAfter = null) => ({ id, title, description: null, lessonCount, completedLessons, status, unlockAfter });
const TRACKS = [
  {
    id: 't-leadership', name: 'Leadership Foundations', completedLessons: 4, totalLessons: 7,
    modules: [mod('cm-knowing', 'Knowing Yourself', 2, 2, 'done'), mod('cm-serving', 'Leading by Serving', 3, 2, 'in-progress'), mod('cm-speaking', 'Speaking Up', 2, 0, 'locked', 'Leading by Serving')],
  },
  { id: 't-digital', name: 'Digital Skills', completedLessons: 0, totalLessons: 2, modules: [mod('cm-web', 'Web Basics', 2, 0, 'not-started')] },
];
const STAGES = [
  { id: 'st-explorer', name: 'Explorer', description: 'Finding their place in the group', status: 'earned', proficient: 2, competencies: ['Serves others', 'Works with others'] },
  { id: 'st-contributor', name: 'Contributor', description: 'Takes part and helps others take part', status: 'current', proficient: 1, competencies: ['Speaks up', 'Follows through'] },
  { id: 'st-leader', name: 'Leader', description: 'Leads others in the cohort', status: 'ahead', proficient: 0, competencies: ['Leads a small group'] },
];
const EARNED = [
  { id: 'b-first', name: 'First Steps', icon: 'star', description: 'Finished a first lesson.', awardedAt: '2026-10-12T16:00:00Z', awardedBy: null },
  { id: 'b-speaks', name: 'Speaks Up', icon: 'flag', description: 'Shared an idea with the whole group.', awardedAt: '2026-10-29T18:00:00Z', awardedBy: 'Marisol Delgado' },
];
const LOCKED = [
  { id: 'b-servant', name: 'Servant Heart', icon: 'heart', description: 'Finished Leading by Serving.', kind: 'Automatic', rule: 'ModuleCompleted', completed: 2, total: 3 },
  { id: 'b-quiz', name: 'Quiz Champion', icon: 'award', description: 'Passed the Leading by Serving quiz.', kind: 'Automatic', rule: 'QuizPassed', completed: 0, total: 1 },
  { id: 'b-served', name: 'Served Someone', icon: 'check', description: 'Had Serve someone this week accepted.', kind: 'Automatic', rule: 'AssignmentAccepted', completed: 0, total: 1 },
  { id: 'b-encourager', name: 'Encourager', icon: 'sparkle', description: 'Lifted someone up in the group.', kind: 'Manual', rule: null, completed: null, total: null },
];
const COMPETENCIES = [
  ['cp-serves', 'Serves others', 'Explorer', 'Proficient'],
  ['cp-speaks', 'Speaks up', 'Contributor', 'Proficient'],
  ['cp-leads', 'Leads a small group', 'Leader', 'NotStarted'],
  ['cp-follows', 'Follows through', 'Contributor', 'Developing'],
  ['cp-works', 'Works with others', 'Explorer', 'Mastered'],
].map(([id, name, stage, level]) => ({ id, name, stage, level }));
const QUIZZES = [
  { quizId: 'qz-knowing', title: 'Knowing Yourself quiz', moduleTitle: 'Knowing Yourself', bestScore: 100, passed: true, waiting: false },
  { quizId: 'qz-towel', title: 'Pick Up the Towel check', moduleTitle: 'Leading by Serving', bestScore: 70, passed: true, waiting: false },
  { quizId: 'qz-serving', title: 'Leading by Serving quiz', moduleTitle: 'Leading by Serving', bestScore: null, passed: null, waiting: true },
];
const session = (eventId, day, status) => ({ eventId, name: 'Tutoring night', startsAt: `2026-${day}T21:00:00Z`, status });
const SESSIONS = [
  session('e-1', '11-05', 'Present'), session('e-2', '11-04', 'Present'), session('e-3', '10-29', 'Present'),
  session('e-4', '10-28', 'Absent'), session('e-5', '10-22', 'Present'), session('e-6', '10-21', 'Present'),
];

const newState = (x = {}) => ({ modules: ON, failNext: null, tracks: TRACKS, earned: EARNED, locked: LOCKED, consent: true, ...x });

const journeyOf = (s) => ({
  completedLessons: s.tracks.reduce((n, t) => n + t.completedLessons, 0),
  totalLessons: s.tracks.reduce((n, t) => n + t.totalLessons, 0),
  streakWeeks: s.tracks.length ? 3 : 0,
  current: s.tracks.length ? { trackId: 't-leadership', moduleId: 'cm-serving', moduleTitle: 'Leading by Serving' } : null,
  tracks: s.tracks,
  stages: STAGES,
  badges: {
    earned: s.earned.length,
    total: s.earned.length + s.locked.length,
    items: [...s.earned.map((b) => ({ id: b.id, name: b.name, icon: b.icon, earned: true })), ...s.locked.map((b) => ({ id: b.id, name: b.name, icon: b.icon, earned: false }))],
  },
});
const badgesOf = (s) => ({
  earned: s.earned,
  locked: s.locked,
  milestones: [
    { kind: 'joined', title: 'Joined After-School Tutoring', text: 'Welcome to PromiseHub', at: '2026-09-14T13:00:00Z' },
    ...s.earned.map((b) => ({ kind: 'badge', title: `${b.name} badge`, text: b.description, at: b.awardedAt })),
    { kind: 'next', title: 'Next up: Servant Heart', text: '2 of 3 lessons · Finished Leading by Serving.', at: null },
  ],
});
const progressOf = (s) => ({
  completedLessons: 4,
  totalLessons: 9,
  streakWeeks: 3,
  quizAverage: 85,
  quizzes: QUIZZES,
  competencies: COMPETENCIES,
  attendance: s.modules.includes('RollCall') ? { attended: 5, marked: 6, sessions: SESSIONS } : null,
});

/** The Learning API as the real one answers Sofía for her journey, badges and progress. */
async function fakeApi(demo, state) {
  await demo.page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (state.failNext && path === state.failNext) {
      state.failNext = null;
      return route.fulfill({ status: 500, json: { code: 'server-error' } });
    }
    if (path === '/api/me')
      return route.fulfill({ json: { personName: 'Sofía Rivera', role: 'Youth', organizationId: 'org-harbourview', organizationName: 'Harbourview Youth Collective', plan: 'Standard', modules: state.modules, membershipId: 'm-sofia' } });
    if (path === '/api/notifications') return route.fulfill({ json: { unread: 0, items: [] } });
    if (path === '/api/me/organizations') return route.fulfill({ json: { organizations: [] } });
    if (path.startsWith('/api/learning') && !state.modules.includes('Learning')) return route.fulfill({ status: 404 });
    if (path === '/api/learning/onboarding')
      return route.fulfill({ json: { status: 'completed', step: 3, preferredName: 'Sofía', pronouns: 'she/her', lessonReminders: true, mentorMessages: true, announcements: false, program: { name: 'After-School Tutoring', schedule: 'Mon–Thu, 4–6 pm', startsOn: '2026-09-08', endsOn: '2027-06-24' } } });
    if (path.startsWith('/api/learning') && !state.consent) return route.fulfill({ status: 403, json: { code: 'consent-required', consentAge: 13 } });
    if (path === '/api/learning/home')
      return route.fulfill({
        json: {
          completedLessons: 4, totalLessons: 9,
          next: { lessonId: 'l-coach', kind: 'Reading', title: 'Leading Like a Coach', moduleId: 'cm-serving', moduleTitle: 'Leading by Serving', reading: null, minutes: 18, moduleCompleted: 2, moduleTotal: 3 },
          tracks: [
            { id: 't-leadership', name: 'Leadership Foundations', description: null, program: 'After-School Tutoring', completedLessons: 4, totalLessons: 7 },
            { id: 't-digital', name: 'Digital Skills', description: null, program: 'Saturday Sports', completedLessons: 0, totalLessons: 2 },
          ],
        },
      });
    if (path === '/api/learning/journey') return route.fulfill({ json: journeyOf(state) });
    if (path === '/api/learning/badges') return route.fulfill({ json: badgesOf(state) });
    if (path === '/api/learning/progress') return route.fulfill({ json: progressOf(state) });
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

export default [
  {
    // From Learning: Your journey, her numbers, her roadmap, her stage and her badges.
    name: 'journey-desktop',
    run: async (demo) => {
      await fakeApi(demo, newState());
      await demo.go('/learning', { ready: false });
      await heading(demo, 'Learning');
      demo.mark();
      await demo.pause(1600);
      await demo.click(app(demo).getByRole('link', { name: /^Your journey/ }));
      await heading(demo, 'Your journey');
      await demo.pause(3200);
      await shot(demo, 'desktop-journey');
      await scroll(demo, 420);
      await demo.pause(2600);
      await shot(demo, 'desktop-journey-badges');
      await scroll(demo, 0);
      await demo.pause(1200);
    },
  },
  {
    // From the journey: See all badges, earned and still to unlock, and her milestones.
    name: 'badges-desktop',
    run: async (demo) => {
      await fakeApi(demo, newState());
      await demo.go('/learning/journey', { ready: false });
      await heading(demo, 'Your journey');
      demo.mark();
      await demo.pause(1200);
      await demo.click(app(demo).getByRole('link', { name: 'See all badges' }));
      await heading(demo, 'Badges');
      await demo.pause(3200);
      await shot(demo, 'desktop-badges');
      await scroll(demo, 420);
      await demo.pause(2400);
      await scroll(demo, 0);
    },
  },
  {
    // Your progress: Overview, then Quizzes and Attendance with the arrow keys.
    name: 'progress-desktop',
    run: async (demo) => {
      await fakeApi(demo, newState());
      await demo.go('/learning/journey', { ready: false });
      await heading(demo, 'Your journey');
      demo.mark();
      await demo.pause(1000);
      await demo.click(app(demo).getByRole('link', { name: /^Your progress/ }));
      await heading(demo, 'Your progress');
      await demo.pause(3200);
      await shot(demo, 'desktop-progress');
      await demo.click(app(demo).getByRole('tab', { name: 'Quizzes' }));
      await demo.pause(2600);
      await shot(demo, 'desktop-quizzes');
      await demo.press('ArrowRight');
      await demo.pause(2600);
      await shot(demo, 'desktop-attendance');
    },
  },
  {
    // On a phone: the journey, badges and progress in one column.
    name: 'phone',
    phone: true,
    run: async (demo) => {
      await fakeApi(demo, newState());
      await demo.go('/learning/journey', { ready: false });
      await heading(demo, 'Your journey');
      demo.mark();
      await demo.pause(2200);
      await shot(demo, 'phone-journey');
      await demo.go('/learning/badges', { ready: false });
      await heading(demo, 'Badges');
      await demo.pause(2200);
      await shot(demo, 'phone-badges');
      await demo.go('/learning/progress', { ready: false });
      await heading(demo, 'Your progress');
      await demo.pause(2200);
      await shot(demo, 'phone-progress');
    },
  },
  {
    // Empty, none earned, Roll Call off, a failed load and a retry, not open yet and Learning off.
    name: 'states-desktop',
    run: async (demo) => {
      const state = newState({ tracks: [], earned: [] });
      await fakeApi(demo, state);
      await demo.go('/learning/journey', { ready: false });
      await app(demo).getByText('Your journey starts with your first track').waitFor();
      demo.mark();
      await demo.pause(2200);
      await shot(demo, 'desktop-journey-empty');
      await demo.go('/learning/badges', { ready: false });
      await app(demo).getByText('No badges yet').waitFor();
      await demo.pause(2200);
      await shot(demo, 'desktop-badges-empty');
      state.tracks = TRACKS;
      state.earned = EARNED;
      state.modules = ON.filter((x) => x !== 'RollCall');
      await demo.go('/learning/progress', { ready: false });
      await heading(demo, 'Your progress');
      await demo.pause(2400);
      await shot(demo, 'desktop-roll-call-off');
      state.failNext = '/api/learning/journey';
      await demo.go('/learning/journey', { ready: false });
      await app(demo).getByText('We couldn’t load your journey').waitFor();
      await demo.pause(1800);
      await shot(demo, 'desktop-error');
      await demo.click(app(demo).getByRole('button', { name: 'Try again' }));
      await app(demo).getByText('You’re in Leading by Serving now.').waitFor();
      await demo.pause(1800);
      state.consent = false;
      await demo.go('/learning/progress', { ready: false });
      await app(demo).getByText('Learning isn’t open for you yet').waitFor();
      await demo.pause(1800);
      await shot(demo, 'desktop-not-open');
      state.consent = true;
      state.modules = ON.filter((x) => x !== 'Learning');
      await demo.go('/learning/journey', { ready: false });
      await demo.pause(2400);
      await shot(demo, 'desktop-learning-off');
    },
  },
];
