// Screen recordings and screenshots for video 60, made with tools/video-record/record-clips.mjs against the
// running frontend. The backend is faked like the e2e suite: Marisol Delgado (Program director, Harbourview) builds
// the Leading by Serving quiz and the assignment Serve someone this week (L2-073, L2-074).
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const shots = join(dirname(fileURLToPath(import.meta.url)), '..', 'shots');
const ON = ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports', 'Learning'];
const org = { organizationId: 'org-harbourview', organizationName: 'Harbourview Youth Collective', plan: 'Standard' };

const lessons = [
  { id: 'l-towel', title: 'Pick Up the Towel', minutes: 12, status: 'Published' },
  { id: 'l-line', title: 'Last in Line', minutes: 15, status: 'Draft' },
  { id: 'l-coach', title: 'Leading Like a Coach', minutes: 18, status: 'Draft' },
];

const newState = () => ({
  who: { personName: 'Marisol Delgado', role: 'ProgramDirector' },
  modules: ON,
  failNext: null,
  next: 1,
  quizzes: [],
  questions: [],
  assignments: [],
});

const total = (a) => a.rubric.reduce((n, c) => n + c.points, 0);
const clean = (v) => (v && v.trim() ? v.trim() : null);

/** The curriculum API as the real one answers a program director, for one module and its quizzes and assignments. */
async function fakeApi(demo, state) {
  const invalid = (route, errors) => route.fulfill({ status: 422, json: { errors } });
  const base = (x) => ({ moduleId: 'cm-serving', moduleTitle: 'Leading by Serving', trackId: 't-leadership', trackName: 'Leadership Foundations', lessons: lessons.map((l, i) => ({ id: l.id, position: i + 1, title: l.title })), programs: ['After-School Tutoring', 'Saturday Sports'], ...x });
  const lessonTitle = (id) => lessons.find((l) => l.id === id)?.title ?? null;
  await demo.page.route('**/api/**', async (route) => {
    const request = route.request();
    const method = request.method();
    const path = new URL(request.url()).pathname;
    const body = () => request.postDataJSON() ?? {};
    if (state.failNext && path === state.failNext) {
      state.failNext = null;
      return route.fulfill({ status: 500, json: { code: 'server-error' } });
    }
    if (path === '/api/me') return route.fulfill({ json: { ...state.who, ...org, modules: state.modules } });
    if (path === '/api/notifications') return route.fulfill({ json: { unread: 0, items: [] } });
    if (path === '/api/me/organizations') return route.fulfill({ json: { organizations: [] } });
    if (path === '/api/today') return route.fulfill({ status: 404 });
    if (path.startsWith('/api/curriculum') && !state.modules.includes('Learning')) return route.fulfill({ status: 404 });
    if (path.startsWith('/api/curriculum') && !['Admin', 'ProgramDirector'].includes(state.who.role)) return route.fulfill({ status: 403, json: { code: 'forbidden' } });
    let m;
    if (path === '/api/curriculum/modules/cm-serving') {
      return route.fulfill({
        json: {
          id: 'cm-serving', trackId: 't-leadership', trackName: 'Leadership Foundations', title: 'Leading by Serving',
          description: 'Putting others first and using influence to build people up.', prerequisiteModuleId: null, anchor: null,
          status: 'InReview', position: 2, moduleCount: 3, earlierModules: [], lessons: lessons.map((l) => ({ ...l })),
          programs: ['After-School Tutoring', 'Saturday Sports'],
          quizzes: state.quizzes.map((q) => ({ id: q.id, title: q.title, lessonTitle: lessonTitle(q.lessonId), status: q.status, questionCount: state.questions.filter((x) => x.quizId === q.id).length })),
          assignments: state.assignments.map((a) => ({ id: a.id, title: a.title, lessonTitle: lessonTitle(a.lessonId), status: a.status, totalPoints: total(a) })),
        },
      });
    }
    if (path === '/api/curriculum/quizzes' && method === 'POST') {
      const b = body();
      if (!clean(b.title)) return invalid(route, { title: 'Give the quiz a title.' });
      const id = `qz-${state.next++}`;
      state.quizzes.push({ id, title: clean(b.title), lessonId: b.lessonId ?? null, status: 'Draft', passMark: 70, attemptsAllowed: 2, feedback: 'ShowAnswers', shuffle: false, requiredToComplete: false });
      return route.fulfill({ status: 201, json: { id } });
    }
    if ((m = /^\/api\/curriculum\/quizzes\/([^/]+)\/questions$/.exec(path))) {
      const b = body();
      const errors = {};
      if (!clean(b.text)) errors.text = 'Write the question.';
      if (b.type !== 'ShortAnswer' && (b.correct ?? []).length === 0) errors.correct = b.type === 'MultipleAnswer' ? 'Mark at least one correct answer.' : 'Mark the correct answer.';
      if (Object.keys(errors).length) return invalid(route, errors);
      const list = state.questions.filter((x) => x.quizId === m[1]);
      state.questions.push({ id: `qq-${state.next++}`, quizId: m[1], position: list.length + 1, text: clean(b.text), type: b.type,
        options: b.type === 'TrueFalse' ? ['True', 'False'] : b.type === 'ShortAnswer' ? [] : b.options, correct: b.correct, answers: (b.answers ?? []).map((a) => a.trim()).filter(Boolean) });
      return route.fulfill({ status: 201, json: { id: 'q' } });
    }
    if ((m = /^\/api\/curriculum\/quizzes\/([^/]+)\/question-order$/.exec(path))) {
      body().questionIds.forEach((id, i) => (state.questions.find((x) => x.id === id).position = i + 1));
      return route.fulfill({ status: 204 });
    }
    if ((m = /^\/api\/curriculum\/quizzes\/([^/]+)\/status$/.exec(path))) {
      const q = state.quizzes.find((x) => x.id === m[1]);
      if (body().status === 'Published' && !state.questions.some((x) => x.quizId === q.id)) return invalid(route, { status: 'Add a question before publishing the quiz.' });
      q.status = body().status;
      return route.fulfill({ status: 204 });
    }
    if ((m = /^\/api\/curriculum\/quizzes\/([^/]+)$/.exec(path))) {
      const q = state.quizzes.find((x) => x.id === m[1]);
      if (!q) return route.fulfill({ status: 404 });
      if (method === 'PUT') {
        const b = body();
        if (!clean(b.title)) return invalid(route, { title: 'Give the quiz a title.' });
        Object.assign(q, { ...b, title: clean(b.title) });
        return route.fulfill({ status: 204 });
      }
      const questions = state.questions.filter((x) => x.quizId === q.id).sort((a, b) => a.position - b.position);
      return route.fulfill({ json: base({ ...q, questions }) });
    }
    if (path === '/api/curriculum/assignments' && method === 'POST') {
      const b = body();
      if (!clean(b.title)) return invalid(route, { title: 'Give the assignment a title.' });
      const id = `as-${state.next++}`;
      state.assignments.push({ id, title: clean(b.title), lessonId: b.lessonId ?? null, status: 'Draft', brief: null, submissionTypes: ['Text'], rubric: [], dueDate: null, graceDays: 0, allowLate: false, requireApproval: false });
      return route.fulfill({ status: 201, json: { id } });
    }
    if ((m = /^\/api\/curriculum\/assignments\/([^/]+)\/status$/.exec(path))) {
      const a = state.assignments.find((x) => x.id === m[1]);
      if (body().status === 'Published' && !a.brief) return invalid(route, { status: 'Describe the task before publishing.' });
      if (body().status === 'Published' && !a.rubric.length) return invalid(route, { status: 'Add a rubric criterion before publishing.' });
      a.status = body().status;
      return route.fulfill({ status: 204 });
    }
    if ((m = /^\/api\/curriculum\/assignments\/([^/]+)$/.exec(path))) {
      const a = state.assignments.find((x) => x.id === m[1]);
      if (!a) return route.fulfill({ status: 404 });
      if (method === 'PUT') {
        const b = body();
        const errors = {};
        if (!clean(b.title)) errors.title = 'Give the assignment a title.';
        if (!clean(b.brief)) errors.brief = 'Describe the task.';
        if (!(b.submissionTypes ?? []).length) errors.submissionTypes = 'Choose at least one way to submit.';
        if (Object.keys(errors).length) return invalid(route, errors);
        Object.assign(a, { ...b, title: clean(b.title), brief: clean(b.brief) });
        return route.fulfill({ status: 204 });
      }
      return route.fulfill({ json: base({ ...a, totalPoints: total(a) }) });
    }
    return route.fulfill({ status: 404 });
  });
}

const app = (demo) => demo.app();
const heading = (demo, name) => app(demo).getByRole('heading', { level: 1, name }).first().waitFor();
const shot = (demo, name) => demo.page.locator('iframe').screenshot({ path: join(shots, `${name}.png`) });
const dialog = (demo) => app(demo).getByRole('dialog');
const closed = (demo) => dialog(demo).waitFor({ state: 'hidden' });

/** A quiz with the four questions Marisol writes in the first clip, for the clips that start later. */
function withQuiz(state, status = 'Draft') {
  state.quizzes.push({ id: 'qz-serving', title: 'Leading by Serving quiz', lessonId: null, status, passMark: 70, attemptsAllowed: 2, feedback: 'ShowAnswers', shuffle: false, requiredToComplete: true });
  state.questions.push(
    { id: 'qq-1', quizId: 'qz-serving', position: 1, text: 'In Pick Up the Towel, what did the captain do before the big game?', type: 'MultipleChoice', options: ['Packed the kit bags for everyone', 'Went home early', 'Asked the coach for help'], correct: [0], answers: [] },
    { id: 'qq-2', quizId: 'qz-serving', position: 2, text: 'Leading is a title someone gives you.', type: 'TrueFalse', options: ['True', 'False'], correct: [1], answers: [] },
    { id: 'qq-3', quizId: 'qz-serving', position: 3, text: 'Which of these are ways to “pick up the towel” this week?', type: 'MultipleAnswer', options: ['Help clear up after group', 'Wait to be asked', 'Check on someone who is new'], correct: [0, 2], answers: [] },
    { id: 'qq-4', quizId: 'qz-serving', position: 4, text: 'In one word, who does a servant leader put first?', type: 'ShortAnswer', options: [], correct: [], answers: ['others', 'other people'] },
  );
}

async function addQuestion(demo, q) {
  await demo.click(app(demo).getByRole('button', { name: 'Add question' }).first());
  await dialog(demo).waitFor();
  const d = dialog(demo);
  if (q.type) await d.getByLabel('Question type').selectOption({ label: q.type });
  await demo.type(d.getByLabel('Question', { exact: true }), q.text);
  for (const [i, text] of (q.options ?? []).entries()) {
    const letter = 'ABCDEF'[i];
    if (!(await d.getByLabel(`Option ${letter}`, { exact: true }).count())) await demo.click(d.getByRole('button', { name: 'Add option' }));
    await demo.type(d.getByLabel(`Option ${letter}`, { exact: true }), text);
  }
  if (q.answers) await demo.type(d.getByLabel('Accepted answers'), q.answers);
  for (const mark of q.correct ?? []) await demo.click(d.getByRole(q.type === 'Multiple answer' ? 'checkbox' : 'radio', { name: new RegExp(`^${mark}\\b`) }));
  await demo.pause(700);
  if (q.shot) await shot(demo, q.shot);
  await demo.click(d.getByRole('button', { name: 'Add question' }));
  await closed(demo);
  await demo.pause(900);
}

export default [
  {
    // Marisol creates the quiz from the module, writes four questions of each type and saves the rules.
    name: 'quiz-desktop',
    run: async (demo) => {
      const state = newState();
      await fakeApi(demo, state);
      await demo.go('/curriculum/modules/cm-serving', { ready: false });
      await heading(demo, 'Leading by Serving');
      demo.mark();
      await demo.pause(1600);
      await shot(demo, 'desktop-module-empty');
      await demo.click(app(demo).getByRole('button', { name: 'New quiz' }));
      await dialog(demo).waitFor();
      await demo.type(dialog(demo).getByLabel('Quiz title'), 'Leading by Serving quiz');
      await demo.pause(700);
      await shot(demo, 'desktop-new-quiz');
      await demo.click(dialog(demo).getByRole('button', { name: 'Create and build' }));
      await heading(demo, 'Leading by Serving quiz');
      await demo.pause(1600);
      await shot(demo, 'desktop-quiz-empty');
      await addQuestion(demo, { type: 'Multiple choice', text: 'In Pick Up the Towel, what did the captain do before the big game?', options: ['Packed the kit bags for everyone', 'Went home early', 'Asked the coach for help'], correct: ['A'], shot: 'desktop-question-dialog' });
      await addQuestion(demo, { type: 'True / false', text: 'Leading is a title someone gives you.', correct: ['False'] });
      await addQuestion(demo, { type: 'Multiple answer', text: 'Which of these are ways to “pick up the towel” this week?', options: ['Help clear up after group', 'Wait to be asked', 'Check on someone who is new'], correct: ['A', 'C'] });
      await addQuestion(demo, { type: 'Short answer', text: 'In one word, who does a servant leader put first?', answers: 'others\nother people', shot: 'desktop-short-answer' });
      await demo.pause(1200);
      await shot(demo, 'desktop-quiz-questions');
      await demo.click(app(demo).getByRole('button', { name: 'Move question 2 up' }));
      await demo.pause(1400);
      await app(demo).getByLabel('Pass mark').selectOption({ label: '80%' });
      await app(demo).getByLabel('Attempts allowed').selectOption({ label: '3' });
      await demo.click(app(demo).getByRole('switch', { name: 'Required to complete the module' }));
      await demo.pause(600);
      await demo.click(app(demo).getByRole('button', { name: 'Save settings' }));
      await app(demo).getByText('Quiz saved').waitFor();
      await demo.pause(1600);
      await shot(demo, 'desktop-quiz-saved');
      await demo.click(app(demo).getByRole('button', { name: /^Status of / }));
      await dialog(demo).waitFor();
      await demo.click(dialog(demo).getByRole('radio', { name: /^Published/ }));
      await demo.pause(700);
      await shot(demo, 'desktop-quiz-status');
      await demo.click(dialog(demo).getByRole('button', { name: 'Save status' }));
      await closed(demo);
      await demo.pause(2200);
      await shot(demo, 'desktop-quiz-published');
    },
  },
  {
    // Marisol defines Serve someone this week: the task, ways to submit, a 25-point rubric and due rules, then publishes it.
    name: 'assignment-desktop',
    run: async (demo) => {
      const state = newState();
      withQuiz(state, 'Published');
      await fakeApi(demo, state);
      await demo.go('/curriculum/modules/cm-serving', { ready: false });
      await heading(demo, 'Leading by Serving');
      demo.mark();
      await demo.pause(1200);
      await demo.click(app(demo).getByRole('button', { name: 'New assignment' }));
      await dialog(demo).waitFor();
      await demo.type(dialog(demo).getByLabel('Assignment title'), 'Serve someone this week');
      await dialog(demo).getByLabel('Attached to').selectOption({ label: 'Lesson 1 · Pick Up the Towel' });
      await demo.pause(800);
      await demo.click(dialog(demo).getByRole('button', { name: 'Create and build' }));
      await heading(demo, 'Serve someone this week');
      await demo.pause(1400);
      await shot(demo, 'desktop-assignment-empty');
      await demo.type(app(demo).getByLabel('Task'), 'This week, put Pick Up the Towel into practice. Choose one person to serve without being asked. Afterwards, tell us what you did and what you noticed.');
      await demo.click(app(demo).getByRole('checkbox', { name: 'Photo' }));
      for (const [d, p] of [['Chose someone and served without being asked', '10'], ['Described what they did and how it felt', '10'], ['Named one thing they noticed', '5']]) {
        await demo.click(app(demo).getByRole('button', { name: 'Add criterion' }));
        await dialog(demo).waitFor();
        await demo.type(dialog(demo).getByLabel('Criterion'), d);
        await demo.type(dialog(demo).getByLabel('Points'), p);
        if (p === '5') await shot(demo, 'desktop-criterion-dialog');
        await demo.click(dialog(demo).getByRole('button', { name: 'Add criterion' }));
        await closed(demo);
        await demo.pause(500);
      }
      await app(demo).getByLabel(/^Due date/).fill('2026-11-19');
      await app(demo).getByLabel('Grace period').selectOption({ label: '2 days' });
      await demo.click(app(demo).getByRole('switch', { name: 'Allow late submissions' }));
      await demo.click(app(demo).getByRole('switch', { name: 'Mentor approves before it counts as complete' }));
      await demo.pause(800);
      await demo.click(app(demo).getByRole('button', { name: 'Save assignment' }));
      await app(demo).getByText('Assignment saved').waitFor();
      await demo.pause(1600);
      await shot(demo, 'desktop-assignment-saved');
      await demo.click(app(demo).getByRole('button', { name: /^Status of / }));
      await dialog(demo).waitFor();
      await demo.click(dialog(demo).getByRole('radio', { name: /^Published/ }));
      await demo.click(dialog(demo).getByRole('button', { name: 'Save status' }));
      await closed(demo);
      await demo.pause(1600);
      await shot(demo, 'desktop-assignment-published');
      await demo.click(app(demo).getByRole('navigation', { name: 'Breadcrumb' }).getByRole('link', { name: 'Leading by Serving' }));
      await heading(demo, 'Leading by Serving');
      await demo.pause(2400);
      await shot(demo, 'desktop-module-assessments');
    },
  },
  {
    // On a phone: the quiz builder and its settings.
    name: 'phone',
    phone: true,
    run: async (demo) => {
      const state = newState();
      withQuiz(state);
      await fakeApi(demo, state);
      await demo.go('/curriculum/quizzes/qz-serving', { ready: false });
      await heading(demo, 'Leading by Serving quiz');
      demo.mark();
      await demo.pause(2000);
      await shot(demo, 'phone-quiz');
      await app(demo).getByRole('region', { name: 'Settings' }).scrollIntoViewIfNeeded();
      await demo.pause(2200);
      await shot(demo, 'phone-quiz-settings');
      await demo.click(app(demo).getByRole('button', { name: 'Edit question 2' }));
      await dialog(demo).waitFor();
      await demo.pause(2200);
      await shot(demo, 'phone-question-dialog');
    },
  },
  {
    // A quiz with no questions refused, an assignment with no task, an unknown quiz, a failed load, a site lead and Learning off.
    name: 'states-desktop',
    run: async (demo) => {
      const state = newState();
      state.quizzes.push({ id: 'qz-new', title: 'Speaking Up check-in', lessonId: null, status: 'Draft', passMark: 70, attemptsAllowed: 2, feedback: 'ShowAnswers', shuffle: false, requiredToComplete: false });
      state.assignments.push({ id: 'as-new', title: 'Serve someone this week', lessonId: 'l-towel', status: 'Draft', brief: null, submissionTypes: ['Text'], rubric: [], dueDate: null, graceDays: 0, allowLate: false, requireApproval: false });
      await fakeApi(demo, state);
      await demo.go('/curriculum/quizzes/qz-new', { ready: false });
      await heading(demo, 'Speaking Up check-in');
      demo.mark();
      await demo.pause(1400);
      await demo.click(app(demo).getByRole('button', { name: /^Status of / }));
      await dialog(demo).waitFor();
      await demo.click(dialog(demo).getByRole('radio', { name: /^Published/ }));
      await demo.click(dialog(demo).getByRole('button', { name: 'Save status' }));
      await app(demo).getByText('Add a question before publishing the quiz.').waitFor();
      await demo.pause(1800);
      await shot(demo, 'desktop-quiz-refused');
      await demo.press('Escape');
      await demo.go('/curriculum/assignments/as-new', { ready: false });
      await heading(demo, 'Serve someone this week');
      await demo.click(app(demo).getByRole('checkbox', { name: 'Text reflection' }));
      await demo.click(app(demo).getByRole('button', { name: 'Save assignment' }));
      await app(demo).getByText('Describe the task.').first().waitFor();
      await demo.pause(2000);
      await shot(demo, 'desktop-assignment-invalid');
      await demo.go('/curriculum/quizzes/qz-northgate', { ready: false });
      await heading(demo, 'We can’t find that quiz');
      await demo.pause(1600);
      await shot(demo, 'desktop-not-found');
      state.failNext = '/api/curriculum/assignments/as-new';
      await demo.go('/curriculum/assignments/as-new', { ready: false });
      await app(demo).getByText('We couldn’t load this assignment').waitFor();
      await demo.pause(1600);
      await shot(demo, 'desktop-error');
      state.who = { personName: 'Jaylen Okafor', role: 'SiteLead' };
      await demo.go('/curriculum/quizzes/qz-new', { ready: false });
      await heading(demo, 'Program directors write the curriculum');
      await demo.pause(1600);
      await shot(demo, 'desktop-forbidden');
      state.who = { personName: 'Marisol Delgado', role: 'ProgramDirector' };
      state.modules = ON.filter((x) => x !== 'Learning');
      await demo.go('/curriculum/quizzes/qz-new', { ready: false });
      await demo.pause(2400);
      await shot(demo, 'desktop-learning-off');
    },
  },
];
