// Screen recordings and screenshots for video 61, made with tools/video-record/record-clips.mjs against the
// running frontend. The backend is faked like the e2e suite: Sofía Rivera (Youth, Harbourview, consent given, in
// After-School Tutoring) has done every lesson of Leading by Serving and takes its quiz (L2-075, L2-076).
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const shots = join(dirname(fileURLToPath(import.meta.url)), '..', 'shots');
const ON = ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports', 'Learning'];

const LESSONS = [
  { id: 'l-towel', title: 'Pick Up the Towel', kind: 'Reading', reading: 'The captain and the kit bags', minutes: 12 },
  { id: 'l-line', title: 'Last in Line', kind: 'Scripture', reading: 'Mark 10:35–45', minutes: 15 },
  { id: 'l-coach', title: 'Leading Like a Coach', kind: 'Reading', reading: null, minutes: 18 },
];

const QUESTIONS = [
  { id: 'qq-captain', text: 'In Pick Up the Towel, what did the captain do before the big game?', type: 'MultipleChoice', options: ['Gave the team talk', 'Packed the kit bags for everyone', 'Went home early', 'Picked the starting line‑up'], correct: [1], accepted: [] },
  { id: 'qq-title', text: 'Leading is a title someone gives you.', type: 'TrueFalse', options: ['True', 'False'], correct: [1], accepted: [] },
  { id: 'qq-towel', text: 'Which of these are ways to “pick up the towel” this week?', type: 'MultipleAnswer', options: ['Help clear up after group', 'Wait until someone asks you', 'Check on someone who is new'], correct: [0, 2], accepted: [] },
  { id: 'qq-first', text: 'In one word, who does a servant leader put first?', type: 'ShortAnswer', options: [], correct: [], accepted: ['others', 'other people'] },
];

const newState = (x = {}) => ({
  modules: ON,
  lessonsDone: 3,
  quiz: { id: 'qz-serving', title: 'Leading by Serving quiz', passMark: 70, attemptsAllowed: 2, feedback: 'ShowAnswers', required: true, requireApproval: false, status: 'Published' },
  attempts: [],
  offline: false,
  failNext: null,
  ...x,
});

const right = (q, a) => {
  if (!a) return false;
  if (q.type === 'ShortAnswer') return !!a.text?.trim() && q.accepted.some((x) => x === a.text.trim().toLowerCase());
  const c = [...new Set(a.choices ?? [])].sort();
  return c.length === q.correct.length && q.correct.every((v, i) => v === c[i]);
};

/** Scores an attempt the way the server does (ADR 0055). */
function score(state, a) {
  a.correct = QUESTIONS.filter((q) => right(q, a.answers.find((x) => x.questionId === q.id))).length;
  a.score = Math.round((100 * a.correct) / QUESTIONS.length);
  a.status = state.quiz.requireApproval ? 'AwaitingApproval' : 'Scored';
  a.submittedAt = '2026-10-27T20:12:00Z';
}

/** A submitted attempt, as if taken earlier. */
function took(state, answers) {
  const a = { id: `qa-${state.attempts.length + 1}`, number: state.attempts.length + 1, answers, position: 3 };
  score(state, a);
  state.attempts.push(a);
  return a;
}

const THREE_OF_FOUR = [
  { questionId: 'qq-captain', choices: [1], text: null },
  { questionId: 'qq-title', choices: [1], text: null },
  { questionId: 'qq-towel', choices: [0], text: null },
  { questionId: 'qq-first', choices: null, text: 'others' },
];
const TWO_OF_FOUR = [
  { questionId: 'qq-captain', choices: [0], text: null },
  { questionId: 'qq-title', choices: [1], text: null },
  { questionId: 'qq-towel', choices: [0, 1], text: null },
  { questionId: 'qq-first', choices: null, text: 'others' },
];

/** The Learning API as the real one answers Sofía for Leading by Serving and its quiz. */
async function fakeApi(demo, state) {
  await demo.page.route('**/api/**', async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const method = request.method();
    const q = state.quiz;
    if (state.failNext && path === state.failNext) {
      state.failNext = null;
      return route.fulfill({ status: 500, json: { code: 'server-error' } });
    }
    if (path === '/api/me') return route.fulfill({ json: { personName: 'Sofía Rivera', role: 'Youth', organizationId: 'org-harbourview', organizationName: 'Harbourview Youth Collective', plan: 'Standard', modules: state.modules } });
    if (path === '/api/notifications') return route.fulfill({ json: { unread: 0, items: [] } });
    if (path === '/api/me/organizations') return route.fulfill({ json: { organizations: [] } });
    if (path.startsWith('/api/learning') && !state.modules.includes('Learning')) return route.fulfill({ status: 404 });
    if (path === '/api/learning/onboarding') {
      return route.fulfill({ json: { status: 'completed', step: 3, preferredName: 'Sofía', pronouns: 'she/her', lessonReminders: true, mentorMessages: true, announcements: false, program: { name: 'After-School Tutoring', schedule: 'Mon–Thu, 4–6 pm', startsOn: '2026-09-08', endsOn: '2027-06-24' } } });
    }
    const scored = state.attempts.filter((a) => a.status === 'Scored');
    const best = scored.slice().sort((a, b) => b.score - a.score)[0] ?? null;
    const passed = !!best && best.score >= q.passMark;
    const locked = state.lessonsDone < LESSONS.length;
    const open = state.attempts.find((a) => a.status === 'InProgress');
    const used = state.attempts.filter((a) => a.status !== 'InProgress').length;
    const quizState = locked ? 'locked' : passed ? 'passed' : open ? 'in-progress' : state.attempts.some((a) => a.status === 'AwaitingApproval') ? 'awaiting' : used ? 'not-passed' : 'next';
    if (path === '/api/learning/modules/cm-serving') {
      const lessons = LESSONS.map((l, i) => ({ ...l, status: i < state.lessonsDone ? 'done' : i === state.lessonsDone ? 'next' : 'locked', unlockAfter: i > state.lessonsDone ? LESSONS[i - 1].title : null }));
      const done = state.lessonsDone === LESSONS.length && (!q.required || passed);
      return route.fulfill({
        json: {
          id: 'cm-serving', title: 'Leading by Serving', description: 'Putting others first and using influence to build people up.', anchor: '“The best leaders are the ones who carry the bags.”',
          trackId: 't-leadership', trackName: 'Leadership Foundations', position: 2, moduleCount: 3, completedLessons: state.lessonsDone,
          status: done ? 'done' : 'in-progress', lessons,
          quizzes: [{ id: q.id, title: q.title, lessonId: null, questionCount: 4, required: q.required, status: quizState, bestScore: best?.score ?? null, unlockAfter: locked ? LESSONS[state.lessonsDone].title : null }],
        },
      });
    }
    let m;
    if ((m = /^\/api\/learning\/quizzes\/([^/]+)$/.exec(path))) {
      if (m[1] !== q.id) return route.fulfill({ status: 404 });
      if (locked) return route.fulfill({ status: 403, json: { code: 'locked', unlockAfter: LESSONS[state.lessonsDone].title } });
      return route.fulfill({
        json: {
          id: q.id, title: q.title, moduleId: 'cm-serving', moduleTitle: 'Leading by Serving', lessonTitle: null, questionCount: 4, passMark: q.passMark, attemptsAllowed: q.attemptsAllowed,
          feedback: q.feedback, attemptsUsed: used, attemptNumber: open?.number ?? used + 1,
          inProgress: open ? { attemptId: open.id, number: open.number, answered: open.answers.length } : null,
          bestScore: best?.score ?? null, passed, bestAttemptId: best?.id ?? null, lastAttemptId: state.attempts.filter((a) => a.status !== 'InProgress').at(-1)?.id ?? null,
          awaiting: state.attempts.some((a) => a.status === 'AwaitingApproval'), canStart: !!open || used < q.attemptsAllowed,
        },
      });
    }
    if ((m = /^\/api\/learning\/quizzes\/([^/]+)\/attempts$/.exec(path))) {
      let a = open;
      if (!a) {
        if (used >= q.attemptsAllowed) return route.fulfill({ status: 409, json: { code: 'no-attempts' } });
        a = { id: `qa-${state.attempts.length + 1}`, number: state.attempts.length + 1, answers: [], position: 0, status: 'InProgress' };
        state.attempts.push(a);
      }
      return route.fulfill({
        json: { attemptId: a.id, quizId: q.id, title: q.title, moduleId: 'cm-serving', moduleTitle: 'Leading by Serving', number: a.number, attemptsAllowed: q.attemptsAllowed, position: a.position,
          questions: QUESTIONS.map(({ id, text, type, options }) => ({ id, text, type, options })), answers: a.answers },
      });
    }
    if ((m = /^\/api\/learning\/attempts\/([^/]+)\/(answers|submit)$/.exec(path))) {
      if (state.offline) return route.abort('internetdisconnected');
      const a = state.attempts.find((x) => x.id === m[1]);
      if (a.status !== 'InProgress') return route.fulfill({ status: 409, json: { code: 'submitted' } });
      const b = request.postDataJSON();
      a.answers = b.answers;
      a.position = b.position;
      if (m[2] === 'answers') return route.fulfill({ status: 204 });
      score(state, a);
      return route.fulfill({ json: { id: a.id } });
    }
    if ((m = /^\/api\/learning\/attempts\/([^/]+)$/.exec(path))) {
      const a = state.attempts.find((x) => x.id === m[1]);
      if (!a || a.status === 'InProgress') return route.fulfill({ status: 404 });
      const left = q.attemptsAllowed - used;
      const waiting = a.status === 'AwaitingApproval';
      const show = !waiting && (q.feedback === 'ShowAnswers' || (q.feedback === 'AfterLastAttempt' && left === 0));
      return route.fulfill({
        json: {
          attemptId: a.id, quizId: q.id, title: q.title, moduleId: 'cm-serving', moduleTitle: 'Leading by Serving', number: a.number, attemptsAllowed: q.attemptsAllowed, attemptsUsed: used, attemptsLeft: left,
          status: waiting ? 'awaiting-approval' : 'scored', submittedAt: a.submittedAt, score: waiting ? null : a.score, correct: waiting ? null : a.correct, total: waiting ? null : 4,
          passMark: q.passMark, passed: waiting ? null : a.score >= q.passMark, bestScore: best?.score ?? null, canRetake: left > 0, feedback: q.feedback,
          review: show
            ? QUESTIONS.map((x, i) => {
                const ans = a.answers.find((y) => y.questionId === x.id);
                return { questionId: x.id, number: i + 1, text: x.text, type: x.type, options: x.options, chosen: ans?.choices ?? [], answerText: ans?.text ?? null, correctOptions: x.correct, accepted: x.accepted, right: right(x, ans) };
              })
            : [],
        },
      });
    }
    return route.fulfill({ status: 404 });
  });
}

const app = (demo) => demo.app();
const heading = (demo, name) => app(demo).getByRole('heading', { level: 1, name }).first().waitFor();
const shot = (demo, name) => demo.page.locator('iframe').screenshot({ path: join(shots, `${name}.png`) });
const dialog = (demo) => app(demo).getByRole('dialog');
const saved = (demo) => app(demo).getByText('Answers saved').waitFor();
const choose = async (demo, label) => {
  await demo.click(app(demo).getByText(label, { exact: true }));
  await saved(demo);
  await demo.pause(700);
};
const next = (demo) => demo.click(app(demo).getByRole('button', { name: 'Next' }));

export default [
  {
    // Sofía opens the quiz from the module, answers four questions with each one saved, submits and reads her result.
    name: 'take-desktop',
    run: async (demo) => {
      const state = newState();
      await fakeApi(demo, state);
      await demo.go('/learning/modules/cm-serving', { ready: false });
      await heading(demo, 'Leading by Serving');
      demo.mark();
      await demo.pause(1800);
      await shot(demo, 'desktop-module-quiz');
      await demo.click(app(demo).getByRole('link', { name: /Leading by Serving quiz/ }).first());
      await heading(demo, 'Leading by Serving quiz');
      await demo.pause(2400);
      await shot(demo, 'desktop-intro');
      await demo.click(app(demo).getByRole('link', { name: 'Start quiz' }));
      await app(demo).getByText('Question 1 of 4').first().waitFor();
      await demo.pause(1200);
      await choose(demo, 'Packed the kit bags for everyone');
      await shot(demo, 'desktop-question');
      await next(demo);
      await demo.pause(900);
      await choose(demo, 'False');
      await next(demo);
      await demo.pause(900);
      await choose(demo, 'Help clear up after group');
      await shot(demo, 'desktop-multiple-answer');
      await next(demo);
      await demo.pause(900);
      await demo.type(app(demo).getByRole('textbox', { name: 'Your answer' }), 'others');
      await saved(demo);
      await demo.pause(1000);
      await shot(demo, 'desktop-short-answer');
      await demo.click(app(demo).getByRole('button', { name: 'Submit answers' }));
      await dialog(demo).waitFor();
      await demo.pause(2000);
      await shot(demo, 'desktop-submit-dialog');
      await demo.click(dialog(demo).getByRole('button', { name: 'Submit answers' }));
      await app(demo).getByText('You passed, Sofía').waitFor();
      await demo.pause(2400);
      await shot(demo, 'desktop-result-passed');
      await app(demo).getByRole('heading', { name: /^3\. / }).scrollIntoViewIfNeeded();
      await demo.pause(2600);
      await shot(demo, 'desktop-review');
      await demo.click(app(demo).getByRole('link', { name: 'Back to the module' }));
      await heading(demo, 'Leading by Serving');
      await demo.pause(2400);
      await shot(demo, 'desktop-module-complete');
    },
  },
  {
    // A first attempt at 50%: the result, Try again, the last attempt and a reload that resumes it.
    name: 'retake-desktop',
    run: async (demo) => {
      const state = newState();
      took(state, TWO_OF_FOUR);
      await fakeApi(demo, state);
      await demo.go('/learning/attempts/qa-1', { ready: false });
      await heading(demo, 'Leading by Serving quiz');
      demo.mark();
      await demo.pause(2600);
      await shot(demo, 'desktop-result-failed');
      await demo.click(app(demo).getByRole('link', { name: 'Try again' }));
      await app(demo).getByText('Last attempt').waitFor();
      await demo.pause(2400);
      await shot(demo, 'desktop-intro-retake');
      await demo.click(app(demo).getByRole('link', { name: 'Start quiz' }));
      await app(demo).getByText('Question 1 of 4').first().waitFor();
      await demo.pause(900);
      await choose(demo, 'Packed the kit bags for everyone');
      await next(demo);
      await demo.pause(700);
      await choose(demo, 'False');
      await demo.go('/learning/quizzes/qz-serving/take', { ready: false });
      await app(demo).getByText('Question 2 of 4').first().waitFor();
      await demo.pause(2200);
      await shot(demo, 'desktop-resumed');
    },
  },
  {
    // On a phone: the intro, a question and the result.
    name: 'phone',
    phone: true,
    run: async (demo) => {
      const state = newState();
      await fakeApi(demo, state);
      await demo.go('/learning/quizzes/qz-serving', { ready: false });
      await heading(demo, 'Leading by Serving quiz');
      demo.mark();
      await demo.pause(2000);
      await shot(demo, 'phone-intro');
      await demo.click(app(demo).getByRole('link', { name: 'Start quiz' }));
      await app(demo).getByText('Question 1 of 4').first().waitFor();
      await choose(demo, 'Packed the kit bags for everyone');
      await demo.pause(1200);
      await shot(demo, 'phone-question');
      state.attempts = [];
      took(state, THREE_OF_FOUR);
      await demo.go('/learning/attempts/qa-1', { ready: false });
      await heading(demo, 'Leading by Serving quiz');
      await demo.pause(2200);
      await shot(demo, 'phone-result');
    },
  },
  {
    // Locked, offline, no attempts left, score only, waiting for the mentor, not found, a failed load and Learning off.
    name: 'states-desktop',
    run: async (demo) => {
      const state = newState({ lessonsDone: 2 });
      await fakeApi(demo, state);
      await demo.go('/learning/quizzes/qz-serving', { ready: false });
      await heading(demo, 'Quiz');
      demo.mark();
      await demo.pause(2000);
      await shot(demo, 'desktop-locked');
      state.lessonsDone = 3;
      await demo.go('/learning/quizzes/qz-serving/take', { ready: false });
      await app(demo).getByText('Question 1 of 4').first().waitFor();
      state.offline = true;
      await demo.click(app(demo).getByText('Went home early', { exact: true }));
      await app(demo).getByText('Not saved · you’re offline').waitFor();
      await demo.pause(2200);
      await shot(demo, 'desktop-offline');
      state.offline = false;
      await app(demo).locator('body').evaluate(() => window.dispatchEvent(new Event('online')));
      await saved(demo);
      await demo.pause(1400);
      state.attempts = [];
      took(state, TWO_OF_FOUR);
      took(state, THREE_OF_FOUR);
      await demo.go('/learning/quizzes/qz-serving', { ready: false });
      await app(demo).getByText('No attempts left').waitFor();
      await demo.pause(2000);
      await shot(demo, 'desktop-exhausted');
      state.quiz.feedback = 'ScoreOnly';
      await demo.go('/learning/attempts/qa-2', { ready: false });
      await app(demo).getByText('This quiz shows your score only.').waitFor();
      await demo.pause(2000);
      await shot(demo, 'desktop-score-only');
      state.quiz.feedback = 'ShowAnswers';
      state.quiz.requireApproval = true;
      state.attempts = [];
      took(state, THREE_OF_FOUR);
      await demo.go('/learning/attempts/qa-1', { ready: false });
      await app(demo).getByText('Waiting for your mentor').waitFor();
      await demo.pause(2000);
      await shot(demo, 'desktop-awaiting');
      await demo.go('/learning/quizzes/qz-northgate', { ready: false });
      await app(demo).getByText('We can’t find that quiz').waitFor();
      await demo.pause(1600);
      await shot(demo, 'desktop-not-found');
      state.failNext = '/api/learning/quizzes/qz-serving';
      await demo.go('/learning/quizzes/qz-serving', { ready: false });
      await app(demo).getByText('We couldn’t load this quiz').waitFor();
      await demo.pause(1600);
      await shot(demo, 'desktop-error');
      state.modules = ON.filter((x) => x !== 'Learning');
      await demo.go('/learning/quizzes/qz-serving', { ready: false });
      await demo.pause(2400);
      await shot(demo, 'desktop-learning-off');
    },
  },
];
