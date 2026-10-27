// Screen recordings and screenshots for video 63, made with tools/video-record/record-clips.mjs against the
// running frontend. The backend is faked like the e2e suite: Daniel Osei (Mentor, Harbourview) mentors Sofía Rivera
// and Nadia Haddad; Sofía sent Serve someone this week, Nadia sent it late and her Leading by Serving quiz waits for
// his approval (L2-080 to L2-083).
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const shots = join(dirname(fileURLToPath(import.meta.url)), '..', 'shots');
const ALL = ['Roster', 'RollCall', 'Learning', 'Mentoring'];
const REFLECTION =
  'On Tuesday I stayed after tutoring to stack the chairs and wipe the tables so Jaylen could lock up on time. Nobody asked me. It felt small, but he noticed and said thanks.';
const BRIEF =
  'This week, put Pick Up the Towel into practice. Choose one person to serve without being asked, at home, at school or in your cohort. Afterwards, tell us what you did, how it felt and what you noticed. A photo or a short note is enough.';
const PRAISE = 'This is exactly it, Sofía. Serving is noticing what needs doing. Proud of you.';
const NOTE = 'Great start, Nadia! Can you add a line about one thing you noticed? Then this is a full pass.';
const RUBRIC = [
  { id: 'cr-1', description: 'Chose someone and served without being asked', points: 10 },
  { id: 'cr-2', description: 'Described what they did and how it felt', points: 10 },
  { id: 'cr-3', description: 'Named one thing they noticed', points: 5 },
];
const COMPETENCIES = [
  { id: 'cp-serves', name: 'Serves others', description: 'Notices what needs doing and helps without being asked.' },
  { id: 'cp-speaks', name: 'Speaks up', description: 'Shares ideas in the group and says when something is wrong.' },
  { id: 'cp-leads', name: 'Leads a small group', description: 'Guides a discussion and keeps a small group on track.' },
  { id: 'cp-follows', name: 'Follows through', description: 'Finishes what they start and keeps their promises.' },
  { id: 'cp-works', name: 'Works with others', description: 'Listens, takes turns and helps the group decide.' },
];
const youth = [
  { id: 'c-mateo', name: 'Mateo Rivera', age: 9, programs: ['After-School Tutoring'] },
  { id: 'c-nadia', name: 'Nadia Haddad', age: 18, programs: ['After-School Tutoring'] },
  { id: 'c-sofia', name: 'Sofía Rivera', age: 12, programs: ['After-School Tutoring'] },
];

function submission(id, name, text, at, late) {
  return {
    id, membershipId: id === 'sub-sofia' ? 'm-sofia' : 'm-nadia', youthName: name, assignmentId: 'as-serve', assignmentTitle: 'Serve someone this week',
    moduleTitle: 'Leading by Serving', brief: BRIEF, status: 'Submitted', late, round: 1, submittedAt: at, text, link: null,
    file: id === 'sub-sofia' ? { name: 'stacked-chairs.jpg', kind: 'Photo', bytes: 1_250_000 } : null,
    rubric: RUBRIC.map((c) => ({ ...c, score: null })), totalPoints: 25, comment: null, feedback: null, points: null,
    history: [{ kind: 'Submitted', actor: name, note: null, at }], version: 1,
  };
}

const newState = (x = {}) => ({
  modules: ALL,
  failNext: null,
  subs: [
    submission('sub-nadia', 'Nadia Haddad', 'I helped my neighbour carry her shopping up three flights of stairs.', '2026-11-02T23:40:00Z', true),
    submission('sub-sofia', 'Sofía Rivera', REFLECTION, '2026-11-03T21:12:00Z', false),
  ],
  attempts: [
    { id: 'qa-nadia', youthName: 'Nadia Haddad', quizTitle: 'Leading by Serving quiz', moduleTitle: 'Leading by Serving', number: 1, score: 75, correct: 3, total: 4, passMark: 70, submittedAt: '2026-11-04T22:02:00Z', status: 'AwaitingApproval' },
    { id: 'qa-sofia', youthName: 'Sofía Rivera', quizTitle: 'Leading by Serving quiz', moduleTitle: 'Leading by Serving', number: 1, score: 50, correct: 2, total: 4, passMark: 70, submittedAt: '2026-11-05T14:15:00Z', status: 'AwaitingApproval' },
  ],
  assessments: [{ childId: 'c-sofia', competencyId: 'cp-follows', level: 'Mastered', notes: 'Every assignment in on time this term.', by: 'Daniel Osei', at: '2026-10-28T20:00:00Z' }],
  ...x,
});

/** The API as the real one answers Daniel for his reviews, grading, quiz approvals and competencies. */
async function fakeApi(demo, state) {
  await demo.page.route('**/api/**', async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const method = request.method();
    if (state.failNext && path === state.failNext) {
      state.failNext = null;
      return route.fulfill({ status: 500, json: { code: 'server-error' } });
    }
    const learning = state.modules.includes('Learning');
    if (path === '/api/me')
      return route.fulfill({ json: { personName: 'Daniel Osei', role: 'Mentor', organizationId: 'org-harbourview', organizationName: 'Harbourview Youth Collective', plan: 'Standard', modules: state.modules, membershipId: 'm-daniel' } });
    if (path === '/api/notifications') return route.fulfill({ json: { unread: 0, items: [] } });
    if (path === '/api/me/organizations') return route.fulfill({ json: { organizations: [] } });
    if (path === '/api/mentoring/dashboard') return route.fulfill({ json: { youth, cohorts: [{ programId: 'p-tutoring', name: 'After-School Tutoring', term: '2026–27', role: 'Supporting', youthCount: 4 }], checkedInThisWeek: 2, recentActivity: [] } });
    if (path === '/api/mentoring/youth/c-sofia')
      return route.fulfill({ json: { id: 'c-sofia', name: 'Sofía Rivera', preferredName: 'Sofía', pronouns: 'she/her', age: 12, school: 'Bennetto Elementary, Grade 7', programs: ['After-School Tutoring'], mentor: 'Daniel Osei', guardians: [{ name: 'Carmen Rivera', relationship: 'Mother', mobile: '905-555-0142', email: 'carmen.rivera@example.com', isPrimary: true }], recentAttendance: [] } });
    let m;
    if ((m = /^\/api\/mentoring\/youth\/([^/]+)\/competencies$/.exec(path))) {
      if (m[1] !== 'c-sofia') return route.fulfill({ status: 403, json: { code: 'forbidden' } });
      if (method === 'PUT') {
        for (const i of request.postDataJSON().items) {
          const before = state.assessments.filter((a) => a.competencyId === i.competencyId).at(-1);
          const notes = i.notes?.trim() || null;
          if ((before?.level ?? 'NotStarted') !== i.level || (before?.notes ?? null) !== notes)
            state.assessments.push({ childId: 'c-sofia', competencyId: i.competencyId, level: i.level, notes, by: 'Daniel Osei', at: '2026-11-05T21:30:00Z' });
        }
      }
      const items = COMPETENCIES.map((c) => {
        const a = state.assessments.filter((x) => x.competencyId === c.id).at(-1);
        return { ...c, level: a?.level ?? 'NotStarted', notes: a?.notes ?? null, assessedBy: a?.by ?? null, assessedAt: a?.at ?? null };
      });
      return route.fulfill({ json: { childId: 'c-sofia', name: 'Sofía Rivera', items, proficientOrMastered: items.filter((i) => ['Proficient', 'Mastered'].includes(i.level)).length, total: items.length } });
    }
    if (path.startsWith('/api/mentoring/') && !learning) return route.fulfill({ status: 404 });
    if (path === '/api/mentoring/reviews') {
      const items = [
        ...state.subs.filter((s) => s.status === 'Submitted' || s.status === 'InReview').map((s) => ({ id: s.id, kind: 'Assignment', membershipId: s.membershipId, youthName: s.youthName, title: s.assignmentTitle, moduleTitle: s.moduleTitle, submittedAt: s.submittedAt, late: s.late, status: s.status, score: null })),
        ...state.attempts.filter((t) => t.status === 'AwaitingApproval').map((t) => ({ id: t.id, kind: 'Quiz', membershipId: '', youthName: t.youthName, title: t.quizTitle, moduleTitle: t.moduleTitle, submittedAt: t.submittedAt, late: false, status: t.status, score: t.score })),
      ].sort((a, b) => a.submittedAt.localeCompare(b.submittedAt));
      return route.fulfill({ json: { items } });
    }
    if ((m = /^\/api\/mentoring\/submissions\/([^/]+)$/.exec(path))) {
      const s = state.subs.find((x) => x.id === m[1]);
      if (!s) return route.fulfill({ status: 404 });
      if (s.status === 'Submitted') {
        Object.assign(s, { status: 'InReview', version: s.version + 1 });
        s.history.push({ kind: 'ReviewStarted', actor: 'Daniel Osei', note: null, at: '2026-11-05T21:20:00Z' });
      }
      return route.fulfill({ json: s });
    }
    if ((m = /^\/api\/mentoring\/submissions\/([^/]+)\/grade$/.exec(path))) {
      const s = state.subs.find((x) => x.id === m[1]);
      const body = request.postDataJSON();
      if (body.version !== s.version) return route.fulfill({ status: 409, json: { code: 'stale' } });
      const given = Object.fromEntries(body.scores.map((x) => [x.criterionId, x.points]));
      s.rubric = s.rubric.map((c) => ({ ...c, score: given[c.id] ?? null }));
      s.comment = body.comment;
      s.version++;
      const total = body.scores.reduce((n, x) => n + x.points, 0);
      if (body.decision === 'approve') {
        Object.assign(s, { status: 'Accepted', points: total, feedback: body.comment });
        s.history.push({ kind: 'Accepted', actor: 'Daniel Osei', note: body.comment, at: '2026-11-05T21:25:00Z' });
      } else if (body.decision === 'revise') {
        Object.assign(s, { status: 'NeedsRevision', feedback: body.comment });
        s.history.push({ kind: 'RevisionRequested', actor: 'Daniel Osei', note: body.comment, at: '2026-11-05T21:25:00Z' });
      }
      return route.fulfill({ json: { status: s.status, points: s.points, version: s.version } });
    }
    if (path === '/api/mentoring/quiz-approvals') return route.fulfill({ json: { items: state.attempts.filter((t) => t.status === 'AwaitingApproval') } });
    if (path === '/api/mentoring/quiz-approvals/approve-all') {
      const waiting = state.attempts.filter((t) => t.status === 'AwaitingApproval');
      waiting.forEach((t) => (t.status = 'Scored'));
      return route.fulfill({ json: { approved: waiting.length } });
    }
    if ((m = /^\/api\/mentoring\/quiz-attempts\/([^/]+)\/approve$/.exec(path))) {
      const t = state.attempts.find((x) => x.id === m[1]);
      const override = request.postDataJSON().override;
      if (override !== null && (override < 0 || override > 100)) return route.fulfill({ status: 422, json: { errors: { override: 'Enter a whole number from 0 to 100, or leave it blank.' } } });
      Object.assign(t, { status: 'Scored', score: override ?? t.score });
      return route.fulfill({ json: { approved: 1 } });
    }
    return route.fulfill({ status: 404 });
  });
}

const app = (demo) => demo.app();
const heading = (demo, name) => app(demo).getByRole('heading', { level: 1, name }).first().waitFor();
const shot = (demo, name) => demo.page.locator('iframe').screenshot({ path: join(shots, `${name}.png`) });
const dialog = (demo) => app(demo).getByRole('dialog');
const scores = async (demo, points) => {
  const fields = app(demo).getByRole('region', { name: 'Rubric' }).getByRole('spinbutton');
  for (let i = 0; i < points.length; i++) await demo.type(fields.nth(i), String(points[i]));
};

export default [
  {
    // From Mentoring: Reviews with the count, the queue oldest first, and its filters.
    name: 'reviews-desktop',
    run: async (demo) => {
      const state = newState();
      await fakeApi(demo, state);
      await demo.go('/mentoring', { ready: false });
      await app(demo).getByRole('link', { name: /^Reviews · 4/ }).waitFor();
      demo.mark();
      await demo.pause(2000);
      await shot(demo, 'desktop-dashboard');
      await demo.click(app(demo).getByRole('link', { name: /^Reviews · 4/ }));
      await heading(demo, 'Reviews');
      await demo.pause(2600);
      await shot(demo, 'desktop-reviews');
      await demo.click(app(demo).getByRole('tab', { name: /^Assignments/ }));
      await demo.pause(1600);
      await demo.click(app(demo).getByRole('tab', { name: /^Quizzes/ }));
      await demo.pause(1600);
      await shot(demo, 'desktop-reviews-quizzes');
      await demo.click(app(demo).getByRole('tab', { name: /^All/ }));
      await demo.pause(1400);
    },
  },
  {
    // Sofía's submission: what she sent, scoring the rubric, a comment, the approve dialog and Accepted.
    name: 'grade-desktop',
    run: async (demo) => {
      const state = newState();
      await fakeApi(demo, state);
      await demo.go('/mentoring/reviews', { ready: false });
      await heading(demo, 'Reviews');
      demo.mark();
      await demo.pause(1200);
      await demo.click(app(demo).getByRole('link', { name: 'Review Sofía Rivera’s Serve someone this week' }));
      await heading(demo, 'Serve someone this week');
      await demo.pause(2600);
      await shot(demo, 'desktop-grade');
      await scores(demo, [10, 10, 5]);
      await demo.pause(800);
      await demo.type(app(demo).getByLabel(/^Comment to Sofía/), PRAISE);
      await demo.pause(1000);
      await shot(demo, 'desktop-grade-scored');
      await demo.click(app(demo).getByRole('button', { name: 'Approve', exact: true }));
      await dialog(demo).waitFor();
      await demo.pause(2400);
      await shot(demo, 'desktop-approve-dialog');
      await demo.click(dialog(demo).getByRole('button', { name: 'Approve', exact: true }));
      await app(demo).getByText('Sofía sees 25 of 25 points and your comment.').waitFor();
      await demo.pause(3000);
      await shot(demo, 'desktop-approved');
    },
  },
  {
    // Nadia's late submission: a draft first, then a revision with a note.
    name: 'revise-desktop',
    run: async (demo) => {
      const state = newState();
      await fakeApi(demo, state);
      await demo.go('/mentoring/reviews/submissions/sub-nadia', { ready: false });
      await heading(demo, 'Serve someone this week');
      demo.mark();
      await demo.pause(2000);
      await scores(demo, [10, 6]);
      await demo.pause(600);
      await demo.click(app(demo).getByRole('button', { name: 'Save draft' }));
      await app(demo).getByText('Nadia still sees In review.').waitFor();
      await demo.pause(1800);
      await shot(demo, 'desktop-draft-saved');
      await demo.click(app(demo).getByRole('button', { name: 'Request revision' }));
      await dialog(demo).waitFor();
      await demo.pause(800);
      await demo.type(dialog(demo).getByLabel('What should they change?'), NOTE);
      await demo.pause(1200);
      await shot(demo, 'desktop-revision-dialog');
      await demo.click(dialog(demo).getByRole('button', { name: 'Send request' }));
      await app(demo).getByText('Sent back to Nadia').waitFor();
      await demo.pause(2800);
      await shot(demo, 'desktop-revision-sent');
    },
  },
  {
    // Quiz approvals: Nadia's 75% approved with an override, then Approve all for the rest.
    name: 'quiz-desktop',
    run: async (demo) => {
      const state = newState();
      await fakeApi(demo, state);
      await demo.go('/mentoring/reviews', { ready: false });
      await heading(demo, 'Reviews');
      demo.mark();
      await demo.pause(1000);
      await demo.click(app(demo).getByRole('link', { name: 'Quiz approvals' }));
      await heading(demo, 'Quiz approvals');
      await demo.pause(2400);
      await shot(demo, 'desktop-quiz-approvals');
      await demo.click(app(demo).getByRole('button', { name: 'Approve Nadia Haddad’s Leading by Serving quiz' }));
      await dialog(demo).waitFor();
      await demo.pause(1400);
      await demo.type(dialog(demo).getByLabel(/^Override score/), '80');
      await demo.pause(1000);
      await shot(demo, 'desktop-approve-quiz');
      await demo.click(dialog(demo).getByRole('button', { name: 'Approve score' }));
      await app(demo).getByRole('status').filter({ hasText: 'Approved' }).first().waitFor();
      await demo.pause(2000);
      await demo.click(app(demo).getByRole('button', { name: 'Approve all' }));
      await dialog(demo).waitFor();
      await demo.pause(2000);
      await shot(demo, 'desktop-approve-all');
      await demo.click(dialog(demo).getByRole('button', { name: 'Approve all' }));
      await app(demo).getByText('No quiz results to approve').waitFor();
      await demo.pause(2200);
      await shot(demo, 'desktop-quiz-empty');
    },
  },
  {
    // Sofía's record, Competencies, two levels and a note, Save changes.
    name: 'competency-desktop',
    run: async (demo) => {
      const state = newState();
      await fakeApi(demo, state);
      await demo.go('/mentoring/youth/c-sofia', { ready: false });
      await heading(demo, 'Sofía Rivera');
      demo.mark();
      await demo.pause(1400);
      await demo.click(app(demo).getByRole('link', { name: 'Competencies' }));
      await heading(demo, 'Competencies');
      await demo.pause(2400);
      await shot(demo, 'desktop-competencies');
      await demo.click(app(demo).getByRole('group', { name: 'Serves others level' }).getByRole('button', { name: 'Proficient' }));
      await demo.type(app(demo).getByLabel('Notes on Serves others'), 'Stacked the chairs after tutoring two weeks running.');
      await demo.click(app(demo).getByRole('group', { name: 'Speaks up level' }).getByRole('button', { name: 'Developing' }));
      await demo.pause(1000);
      await demo.click(app(demo).getByRole('button', { name: 'Save changes' }));
      await app(demo).getByText('2 of 5 proficient or mastered').waitFor();
      await demo.pause(2600);
      await shot(demo, 'desktop-competencies-saved');
    },
  },
  {
    // On a phone: Reviews and grading Sofía's work.
    name: 'phone',
    phone: true,
    run: async (demo) => {
      const state = newState();
      await fakeApi(demo, state);
      await demo.go('/mentoring/reviews', { ready: false });
      await heading(demo, 'Reviews');
      demo.mark();
      await demo.pause(2200);
      await shot(demo, 'phone-reviews');
      await demo.click(app(demo).getByRole('link', { name: 'Review Sofía Rivera’s Serve someone this week' }));
      await heading(demo, 'Serve someone this week');
      await demo.pause(1600);
      await shot(demo, 'phone-grade');
      await scores(demo, [10, 10, 5]);
      await demo.pause(1200);
      await shot(demo, 'phone-scored');
    },
  },
  {
    // Invalid, a stale grade, a failed save, a forbidden youth, nothing waiting and Learning off.
    name: 'states-desktop',
    run: async (demo) => {
      const state = newState();
      await fakeApi(demo, state);
      await demo.go('/mentoring/reviews/submissions/sub-sofia', { ready: false });
      await heading(demo, 'Serve someone this week');
      demo.mark();
      await demo.pause(800);
      await scores(demo, [12, 10]);
      await demo.click(app(demo).getByRole('button', { name: 'Approve', exact: true }));
      await app(demo).getByText('Fix these to continue').waitFor();
      await demo.pause(2400);
      await shot(demo, 'desktop-invalid');
      await app(demo).getByRole('region', { name: 'Rubric' }).getByRole('spinbutton').first().fill('10');
      await app(demo).getByRole('region', { name: 'Rubric' }).getByRole('spinbutton').nth(2).fill('5');
      state.subs[1].version++;
      state.subs[1].comment = 'Hana’s draft note.';
      await demo.click(app(demo).getByRole('button', { name: 'Approve', exact: true }));
      await dialog(demo).waitFor();
      await demo.click(dialog(demo).getByRole('button', { name: 'Approve', exact: true }));
      await app(demo).getByText('This submission changed after you opened it').waitFor();
      await demo.pause(2600);
      await shot(demo, 'desktop-conflict');
      state.failNext = '/api/mentoring/submissions/sub-sofia/grade';
      await demo.click(app(demo).getByRole('button', { name: 'Load the latest' }));
      await demo.pause(800);
      await app(demo).getByRole('region', { name: 'Rubric' }).getByRole('spinbutton').first().fill('9');
      await demo.click(app(demo).getByRole('button', { name: 'Save draft' }));
      await app(demo).getByText('That didn’t save').waitFor();
      await demo.pause(2000);
      await shot(demo, 'desktop-failed');
      await demo.go('/mentoring/youth/c-amara/competencies', { ready: false });
      await app(demo).getByText('This youth isn’t assigned to you').waitFor();
      await demo.pause(1800);
      await shot(demo, 'desktop-forbidden');
      state.subs = [];
      state.attempts = [];
      await demo.go('/mentoring/reviews', { ready: false });
      await app(demo).getByText('You’re all caught up').waitFor();
      await demo.pause(1800);
      await shot(demo, 'desktop-caught-up');
      state.modules = ALL.filter((x) => x !== 'Learning');
      await demo.go('/mentoring', { ready: false });
      await heading(demo, 'Mentoring');
      await demo.pause(1800);
      await shot(demo, 'desktop-learning-off');
      await demo.go('/mentoring/reviews', { ready: false });
      await demo.pause(2200);
    },
  },
];
