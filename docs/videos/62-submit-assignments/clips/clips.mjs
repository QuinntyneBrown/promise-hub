// Screen recordings and screenshots for video 62, made with tools/video-record/record-clips.mjs against the
// running frontend. The backend is faked like the e2e suite: Sofía Rivera (Youth, Harbourview, consent given, in
// After-School Tutoring, mentored by Daniel Osei) has done Pick Up the Towel and submits Serve someone this week
// (L2-077 to L2-079).
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const shots = join(dirname(fileURLToPath(import.meta.url)), '..', 'shots');
const ON = ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports', 'Learning'];
const REFLECTION =
  'On Tuesday I stayed after tutoring to stack the chairs and wipe the tables so Jaylen could lock up on time. Nobody asked me. It felt small, but he noticed and said thanks.';
const ADDED = ' What I noticed: the room is always tidy because someone stays behind, and I never saw who it was before.';
const NOTE = 'Great story, Sofía! Can you add a line about one thing you noticed? Then this is a full pass.';
const PRAISE = 'This is exactly it, Sofía. Serving is noticing what needs doing. Proud of you.';
const PNG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, ...new Array(1_250_000).fill(0)]);
const PDF = Buffer.from('%PDF-1.7\n', 'utf-8');

const LESSONS = [
  { id: 'l-towel', title: 'Pick Up the Towel', kind: 'Reading', reading: 'The captain and the kit bags', minutes: 12 },
  { id: 'l-line', title: 'Last in Line', kind: 'Scripture', reading: 'Mark 10:35–45', minutes: 15 },
  { id: 'l-coach', title: 'Leading Like a Coach', kind: 'Reading', reading: null, minutes: 18 },
];

const ASSIGNMENT = {
  id: 'as-serve',
  title: 'Serve someone this week',
  brief:
    'This week, put Pick Up the Towel into practice. Choose one person to serve without being asked, at home, at school or in your cohort. Afterwards, tell us what you did, how it felt and what you noticed. A photo or a short note is enough.',
  submissionTypes: ['Text', 'Photo'],
  rubric: [
    { description: 'Chose someone and served without being asked', points: 10 },
    { description: 'Described what they did and how it felt', points: 10 },
    { description: 'Named one thing they noticed', points: 5 },
  ],
  dueDate: '2026-11-19',
  graceDays: 2,
  allowLate: true,
};

const newState = (x = {}) => ({ modules: ON, lessonsDone: 1, due: { dueState: 'open', daysLeft: 14 }, submission: null, failNext: null, ...x });

/** Her submission, as if sent earlier, in the status given. */
function sent(state, status = 'Submitted') {
  const s = {
    id: 'sub-1',
    status: 'Submitted',
    late: false,
    round: 1,
    text: REFLECTION,
    link: null,
    file: { name: 'stacked-chairs.png', kind: 'Photo', bytes: PNG.length },
    feedback: null,
    reviewerName: null,
    points: null,
    submittedAt: '2026-11-03T21:12:00Z',
    history: [{ kind: 'Submitted', actor: 'Sofía Rivera', note: null, at: '2026-11-03T21:12:00Z' }],
  };
  state.submission = s;
  if (status !== 'Submitted') review(s, 'InReview');
  if (status === 'NeedsRevision' || status === 'Accepted') review(s, 'NeedsRevision');
  if (status === 'Accepted') {
    s.text += ADDED;
    s.round = 2;
    s.history.push({ kind: 'Resubmitted', actor: 'Sofía Rivera', note: null, at: '2026-11-04T23:05:00Z' });
    review(s, 'Accepted');
  }
  return s;
}

function review(s, status, later = false) {
  const at = later ? { InReview: '2026-11-06T14:00:00Z', Accepted: '2026-11-06T15:20:00Z' }[status] : { InReview: '2026-11-04T14:30:00Z', NeedsRevision: '2026-11-04T14:45:00Z', Accepted: '2026-11-05T15:20:00Z' }[status];
  const kind = { InReview: 'ReviewStarted', NeedsRevision: 'RevisionRequested', Accepted: 'Accepted' }[status];
  const note = status === 'NeedsRevision' ? NOTE : status === 'Accepted' ? PRAISE : null;
  Object.assign(s, { status, reviewerName: 'Daniel Osei', feedback: note ?? s.feedback, points: status === 'Accepted' ? 25 : null });
  s.history.push({ kind, actor: 'Daniel Osei', note, at });
}

/** The parts of a multipart body by name: values as text, the file's name. */
function form(request) {
  const body = request.postDataBuffer()?.toString('latin1') ?? '';
  const parts = {};
  for (const part of body.split(/------[^\r\n]+/)) {
    const name = /name="([^"]+)"/.exec(part)?.[1];
    if (!name) continue;
    const file = /filename="([^"]*)"/.exec(part)?.[1];
    const value = part.slice(part.indexOf('\r\n\r\n') + 4).replace(/\r\n$/, '');
    parts[name] = file ?? Buffer.from(value, 'latin1').toString('utf-8');
  }
  return parts;
}

/** The Learning API as the real one answers Sofía for Leading by Serving and its assignment. */
async function fakeApi(demo, state) {
  await demo.page.route('**/api/**', async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const method = request.method();
    if (state.failNext && path === state.failNext) {
      state.failNext = null;
      return route.fulfill({ status: 500, json: { code: 'server-error' } });
    }
    if (path === '/api/me')
      return route.fulfill({ json: { personName: 'Sofía Rivera', role: 'Youth', organizationId: 'org-harbourview', organizationName: 'Harbourview Youth Collective', plan: 'Standard', modules: state.modules, membershipId: 'm-sofia' } });
    if (path === '/api/notifications') return route.fulfill({ json: { unread: 0, items: [] } });
    if (path === '/api/me/organizations') return route.fulfill({ json: { organizations: [] } });
    if (path.startsWith('/api/learning') && !state.modules.includes('Learning')) return route.fulfill({ status: 404 });
    if (path === '/api/learning/onboarding') {
      return route.fulfill({ json: { status: 'completed', step: 3, preferredName: 'Sofía', pronouns: 'she/her', lessonReminders: true, mentorMessages: true, announcements: false, program: { name: 'After-School Tutoring', schedule: 'Mon–Thu, 4–6 pm', startsOn: '2026-09-08', endsOn: '2027-06-24' } } });
    }
    const locked = state.lessonsDone < 1;
    const s = state.submission;
    const status = locked ? 'locked' : !s ? 'next' : { Submitted: 'submitted', InReview: 'in-review', NeedsRevision: 'needs-revision', Accepted: 'accepted' }[s.status];
    if (path === '/api/learning/modules/cm-serving') {
      const lessons = LESSONS.map((l, i) => ({ ...l, status: i < state.lessonsDone ? 'done' : i === state.lessonsDone ? 'next' : 'locked', unlockAfter: i > state.lessonsDone ? LESSONS[i - 1].title : null }));
      return route.fulfill({
        json: {
          id: 'cm-serving', title: 'Leading by Serving', description: 'Putting others first and using influence to build people up.', anchor: '“The best leaders are the ones who carry the bags.”',
          trackId: 't-leadership', trackName: 'Leadership Foundations', position: 2, moduleCount: 3, completedLessons: state.lessonsDone, status: 'in-progress', lessons, quizzes: [],
          assignments: [{ id: 'as-serve', title: ASSIGNMENT.title, lessonId: 'l-towel', totalPoints: 25, dueDate: ASSIGNMENT.dueDate, status, unlockAfter: locked ? 'Pick Up the Towel' : null, submissionId: s?.id ?? null }],
        },
      });
    }
    let m;
    if ((m = /^\/api\/learning\/assignments\/([^/]+)$/.exec(path))) {
      if (m[1] !== 'as-serve') return route.fulfill({ status: 404 });
      if (locked) return route.fulfill({ status: 403, json: { code: 'locked', unlockAfter: 'Pick Up the Towel' } });
      return route.fulfill({
        json: { ...ASSIGNMENT, moduleId: 'cm-serving', moduleTitle: 'Leading by Serving', lessonTitle: 'Pick Up the Towel', totalPoints: 25, ...state.due, mentorName: 'Daniel Osei', submission: s ? { id: s.id, status: s.status } : null },
      });
    }
    if (method === 'POST' && (m = /^\/api\/learning\/(assignments\/as-serve\/submission|submissions\/sub-1\/resubmit)$/.exec(path))) {
      const f = form(request);
      if (m[1].startsWith('assignments')) {
        sent(state);
        state.submission.text = f.text;
        state.submission.submittedAt = state.submission.history[0].at = '2026-11-05T21:12:00Z';
        return route.fulfill({ status: 201, json: { id: 'sub-1' } });
      }
      Object.assign(s, { text: f.text, status: 'Submitted', round: s.round + 1, submittedAt: '2026-11-05T23:05:00Z' });
      s.history.push({ kind: 'Resubmitted', actor: 'Sofía Rivera', note: null, at: '2026-11-05T23:05:00Z' });
      return route.fulfill({ json: { id: s.id } });
    }
    if ((m = /^\/api\/learning\/submissions\/([^/]+)$/.exec(path))) {
      if (!s || m[1] !== s.id) return route.fulfill({ status: 404 });
      return route.fulfill({ json: { ...s, assignmentId: 'as-serve', assignmentTitle: ASSIGNMENT.title, moduleId: 'cm-serving', moduleTitle: 'Leading by Serving', mentorName: 'Daniel Osei', totalPoints: 25 } });
    }
    return route.fulfill({ status: 404 });
  });
}

const app = (demo) => demo.app();
const heading = (demo, name) => app(demo).getByRole('heading', { level: 1, name }).first().waitFor();
const shot = (demo, name) => demo.page.locator('iframe').screenshot({ path: join(shots, `${name}.png`) });
const dialog = (demo) => app(demo).getByRole('dialog');
const attach = (demo, name, mimeType, buffer) => app(demo).getByLabel(/^Choose (photo|file)$/).setInputFiles({ name, mimeType, buffer });

export default [
  {
    // From the module: the brief, writing the reflection, a photo, the attestation, the dialog and the status.
    name: 'submit-desktop',
    run: async (demo) => {
      const state = newState();
      await fakeApi(demo, state);
      await demo.go('/learning/modules/cm-serving', { ready: false });
      await heading(demo, 'Leading by Serving');
      demo.mark();
      await demo.pause(1600);
      await app(demo).getByRole('region', { name: 'Assignments' }).scrollIntoViewIfNeeded();
      await demo.pause(1000);
      await shot(demo, 'desktop-module-assignment');
      await demo.click(app(demo).getByRole('link', { name: /Serve someone this week/ }).first());
      await heading(demo, 'Serve someone this week');
      await demo.pause(2600);
      await shot(demo, 'desktop-brief');
      await demo.click(app(demo).getByRole('link', { name: 'Start submission' }));
      await heading(demo, 'Serve someone this week');
      await demo.pause(1000);
      await shot(demo, 'desktop-form-empty');
      await demo.type(app(demo).getByLabel('Your reflection'), REFLECTION);
      await demo.pause(600);
      await attach(demo, 'stacked-chairs.png', 'image/png', PNG);
      await demo.pause(1000);
      await demo.click(app(demo).getByRole('checkbox', { name: /This is my own work/ }));
      await demo.pause(800);
      await shot(demo, 'desktop-form');
      await demo.click(app(demo).getByRole('button', { name: 'Submit', exact: true }));
      await dialog(demo).waitFor();
      await demo.pause(2200);
      await shot(demo, 'desktop-submit-dialog');
      await demo.click(dialog(demo).getByRole('button', { name: 'Submit for review' }));
      await app(demo).getByText('It’s in').first().waitFor();
      await demo.pause(2600);
      await shot(demo, 'desktop-submitted');
    },
  },
  {
    // Daniel asked for a revision: his note, revising with the photo kept, resubmitting; later, accepted with 25 of 25.
    name: 'revise-desktop',
    run: async (demo) => {
      const state = newState();
      sent(state, 'NeedsRevision');
      await fakeApi(demo, state);
      await demo.go('/learning/submissions/sub-1', { ready: false });
      await heading(demo, 'Serve someone this week');
      demo.mark();
      await demo.pause(2600);
      await shot(demo, 'desktop-needs-revision');
      await demo.click(app(demo).getByRole('link', { name: 'Revise your submission' }));
      await app(demo).getByText('Note from Daniel Osei').waitFor();
      await demo.pause(1800);
      await shot(demo, 'desktop-revise');
      const box = app(demo).getByLabel('Your reflection');
      await box.click();
      await box.press('End');
      await demo.type(box, ADDED);
      await demo.click(app(demo).getByRole('checkbox', { name: /This is my own work/ }));
      await demo.pause(800);
      await demo.click(app(demo).getByRole('button', { name: 'Resubmit', exact: true }));
      await dialog(demo).waitFor();
      await demo.pause(1800);
      await shot(demo, 'desktop-resubmit-dialog');
      await demo.click(dialog(demo).getByRole('button', { name: 'Resubmit' }));
      await app(demo).getByText('Sent again').waitFor();
      await demo.pause(2400);
      await shot(demo, 'desktop-resubmitted');
      review(state.submission, 'InReview', true);
      review(state.submission, 'Accepted', true);
      await demo.go('/learning/submissions/sub-1', { ready: false });
      await app(demo).getByText('Accepted by Daniel Osei').waitFor();
      await demo.pause(3000);
      await shot(demo, 'desktop-accepted');
    },
  },
  {
    // Leaving with unsent work: the question, Save draft and leave, and the draft restored.
    name: 'draft-desktop',
    run: async (demo) => {
      const state = newState();
      await fakeApi(demo, state);
      await demo.go('/learning/assignments/as-serve/submit', { ready: false });
      await heading(demo, 'Serve someone this week');
      demo.mark();
      await demo.pause(1000);
      await demo.type(app(demo).getByLabel('Your reflection'), 'On Tuesday I stayed after tutoring to stack the chairs.');
      await demo.pause(800);
      await demo.click(app(demo).getByRole('navigation', { name: 'Breadcrumb' }).getByRole('link', { name: 'Leading by Serving' }));
      await dialog(demo).waitFor();
      await demo.pause(2400);
      await shot(demo, 'desktop-leave');
      await demo.click(dialog(demo).getByRole('button', { name: 'Save draft and leave' }));
      await heading(demo, 'Leading by Serving');
      await demo.pause(1200);
      await demo.go('/learning/assignments/as-serve', { ready: false });
      await app(demo).getByText('You have a draft').waitFor();
      await demo.pause(2000);
      await shot(demo, 'desktop-brief-draft');
      await demo.click(app(demo).getByRole('link', { name: 'Continue your draft' }));
      await app(demo).getByText('We restored your draft').waitFor();
      await demo.pause(2600);
      await shot(demo, 'desktop-restored');
    },
  },
  {
    // On a phone: the brief, the form and her submission.
    name: 'phone',
    phone: true,
    run: async (demo) => {
      const state = newState();
      await fakeApi(demo, state);
      await demo.go('/learning/assignments/as-serve', { ready: false });
      await heading(demo, 'Serve someone this week');
      demo.mark();
      await demo.pause(2200);
      await shot(demo, 'phone-brief');
      await demo.click(app(demo).getByRole('link', { name: 'Start submission' }));
      await heading(demo, 'Serve someone this week');
      await demo.type(app(demo).getByLabel('Your reflection'), 'I stacked the chairs after tutoring so Jaylen could lock up.');
      await demo.click(app(demo).getByRole('checkbox', { name: /This is my own work/ }));
      await demo.pause(1200);
      await shot(demo, 'phone-form');
      await demo.click(app(demo).getByRole('button', { name: 'Submit', exact: true }));
      await dialog(demo).waitFor();
      await demo.pause(1200);
      await demo.click(dialog(demo).getByRole('button', { name: 'Submit for review' }));
      await app(demo).getByText('It’s in').first().waitFor();
      await demo.pause(2400);
      await shot(demo, 'phone-submitted');
    },
  },
  {
    // Invalid, a refused file, in review, late, closed, locked, not found, a failed load and Learning off.
    name: 'states-desktop',
    run: async (demo) => {
      const state = newState();
      await fakeApi(demo, state);
      await demo.go('/learning/assignments/as-serve/submit', { ready: false });
      await heading(demo, 'Serve someone this week');
      demo.mark();
      await demo.pause(800);
      await demo.click(app(demo).getByRole('button', { name: 'Submit', exact: true }));
      await app(demo).getByText('Fix these to continue').waitFor();
      await demo.pause(2200);
      await shot(demo, 'desktop-invalid');
      await attach(demo, 'weekly-schedule.pdf', 'application/pdf', PDF);
      await app(demo).getByText('That file can’t be used').waitFor();
      await demo.pause(2200);
      await shot(demo, 'desktop-file-refused');
      sent(state, 'InReview');
      await demo.go('/learning/submissions/sub-1', { ready: false });
      await app(demo).getByText('Daniel Osei is reviewing your work').waitFor();
      await demo.pause(2000);
      await shot(demo, 'desktop-in-review');
      state.submission = null;
      state.due = { dueState: 'late', daysLeft: -3 };
      await demo.go('/learning/assignments/as-serve', { ready: false });
      await app(demo).getByText('This is past its due date').waitFor();
      await demo.pause(1800);
      await shot(demo, 'desktop-late');
      state.due = { dueState: 'closed', daysLeft: -3 };
      await demo.go('/learning/assignments/as-serve', { ready: false });
      await app(demo).getByText('Submissions are closed').waitFor();
      await demo.pause(1800);
      await shot(demo, 'desktop-closed');
      state.due = { dueState: 'open', daysLeft: 14 };
      state.lessonsDone = 0;
      await demo.go('/learning/assignments/as-serve', { ready: false });
      await app(demo).getByText('Finish Pick Up the Towel first').waitFor();
      await demo.pause(1800);
      await shot(demo, 'desktop-locked');
      state.lessonsDone = 1;
      await demo.go('/learning/assignments/as-northgate', { ready: false });
      await app(demo).getByText('We can’t find that assignment').waitFor();
      await demo.pause(1600);
      await shot(demo, 'desktop-not-found');
      state.failNext = '/api/learning/assignments/as-serve';
      await demo.go('/learning/assignments/as-serve', { ready: false });
      await app(demo).getByText('We couldn’t load this assignment').waitFor();
      await demo.pause(1600);
      await shot(demo, 'desktop-error');
      state.modules = ON.filter((x) => x !== 'Learning');
      await demo.go('/learning/assignments/as-serve', { ready: false });
      await demo.pause(2400);
      await shot(demo, 'desktop-learning-off');
    },
  },
];
