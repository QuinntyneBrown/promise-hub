import { test, expect } from '../../fixtures/test';
import type { ModuleId } from '../../fixtures/seed';
import { LearnModulePage } from '../../pages/learn-module.page';
import { LearnQuizIntroPage } from '../../pages/learn-quiz-intro.page';
import { LearnQuizPage } from '../../pages/learn-quiz.page';
import { TodayPage } from '../../pages/today.page';

// Acceptance test. Traces to: L2-075 criteria 1 to 4, 8 and 9 (a quiz's rules, its lock, the module's quizzes, taking it with autosave, Learning off), L2-035.
const SUITE: ModuleId[] = ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports'];
const SERVING = ['l-strengths', 'l-values', 'l-towel', 'l-line', 'l-coach'];

test.describe('Take quizzes', () => {
  test.use({ signedInAs: 'm-sofia' });

  test.beforeEach(({ api }) => {
    api.setModules('org-harbourview', [...SUITE, 'Learning']);
    api.giveConsent('c-sofia');
    api.saveOnboarding('m-sofia', {
      step: 3,
      preferredName: 'Sofía',
      completed: true,
    });
    api.curriculumState.youthJourney();
    api.curriculumState.assessments.quizJourney();
  });

  test('Given every lesson of Leading by Serving is done, when Sofía opens the quiz from the module, then she sees its rules and Start quiz', async ({
    page,
    api,
  }) => {
    api.learningState.complete('m-sofia', ...SERVING);
    const module = new LearnModulePage(page);
    const intro = new LearnQuizIntroPage(page);
    await module.open('cm-serving');
    await expect(module.quiz('Leading by Serving quiz')).toContainText('Up next');

    await module.openQuiz('Leading by Serving quiz');

    await intro.expectOpen('Leading by Serving quiz');
    await expect(intro.fact('Questions')).toContainText('4');
    await expect(intro.fact('Pass mark')).toContainText('70%');
    await expect(intro.fact('Attempts')).toContainText('2');
    await expect(intro.fact('This attempt')).toContainText('1 of 2');
    await expect(intro.rules).toContainText('Once you submit, you can’t change your answers for that attempt.');
    await expect(intro.startButton).toBeVisible();
    await expect(page.getByText('Packed the kit bags for everyone')).toHaveCount(0);
    await intro.expectNoHorizontalScroll();
    await intro.expectAccessible();
  });

  test('Given a lesson of the module is not done, when she opens the quiz, then it is locked, named on the module, and the server refuses it', async ({
    page,
    api,
  }) => {
    api.learningState.complete('m-sofia', 'l-strengths', 'l-values', 'l-towel', 'l-line');
    const module = new LearnModulePage(page);
    const intro = new LearnQuizIntroPage(page);
    await module.open('cm-serving');
    await expect(module.quiz('Leading by Serving quiz')).toContainText('Unlocks after Leading Like a Coach');

    await intro.open('qz-serving');

    await expect(intro.locked('Leading Like a Coach')).toBeVisible();
    expect(await intro.apiStatus('qz-serving')).toBe(403);
    await intro.expectAccessible();
  });

  test('Given the quiz is open, when Sofía starts it and answers, then each answer saves and a reload resumes the same question with her answers', async ({
    page,
    api,
  }) => {
    api.learningState.complete('m-sofia', ...SERVING);
    const intro = new LearnQuizIntroPage(page);
    const quiz = new LearnQuizPage(page);
    await intro.open('qz-serving');

    await intro.start();

    await expect(quiz.question('In Pick Up the Towel, what did the captain do before the big game?')).toBeVisible();
    await expect(quiz.progressText).toHaveText('Question 1 of 4');
    await quiz.choose('Packed the kit bags for everyone');
    await expect(quiz.saveStatus).toHaveText(/Answers saved/);
    await quiz.next();
    await expect(quiz.question('Leading is a title someone gives you.')).toBeVisible();
    await quiz.choose('False');
    await expect(quiz.saveStatus).toHaveText(/Answers saved/);
    await quiz.expectAccessible();

    await quiz.reload();

    await expect(quiz.question('Leading is a title someone gives you.')).toBeVisible();
    await expect(quiz.option('False')).toBeChecked();
    await quiz.back();
    await expect(quiz.option('Packed the kit bags for everyone')).toBeChecked();
    await intro.open('qz-serving');
    await expect(intro.notice).toContainText('Attempt 1 · 2 of 4 answered');
    await expect(intro.resumeButton).toBeVisible();
  });

  test('Given a multiple answer and a short answer, when she answers them, then she can tick several and type one, and both save', async ({ page, api }) => {
    api.learningState.complete('m-sofia', ...SERVING);
    api.learningState.quizzes.inProgress('m-sofia', 'qz-serving', [], 2);
    const quiz = new LearnQuizPage(page);
    await quiz.open('qz-serving');

    await expect(quiz.question('Which of these are ways to “pick up the towel” this week?')).toBeVisible();
    await quiz.choose('Help clear up after group');
    await quiz.choose('Check on someone who is new');
    await expect(quiz.saveStatus).toHaveText(/Answers saved/);
    await quiz.next();
    await quiz.write('others');
    await expect(quiz.saveStatus).toHaveText(/Answers saved/);
    await quiz.expectAccessible();

    await quiz.reload();

    await expect(quiz.shortAnswer).toHaveValue('others');
    await quiz.back();
    await expect(quiz.option('Help clear up after group')).toBeChecked();
    await expect(quiz.option('Check on someone who is new')).toBeChecked();
    await expect(quiz.option('Wait until someone asks you')).not.toBeChecked();
  });

  test('Given the connection drops, when she answers, then her answer stays, the page says it is not saved, and it saves when she is back online', async ({
    page,
    api,
  }) => {
    api.learningState.complete('m-sofia', ...SERVING);
    const quiz = new LearnQuizPage(page);
    await quiz.open('qz-serving');
    await expect(quiz.question('In Pick Up the Towel, what did the captain do before the big game?')).toBeVisible();

    api.learningState.quizzes.offline = true;
    await quiz.goOffline();
    await quiz.choose('Gave the team talk');

    await expect(quiz.saveStatus).toHaveText(/Not saved · you’re offline/);
    await expect(quiz.offlineAlert).toBeVisible();
    await expect(quiz.option('Gave the team talk')).toBeChecked();
    await quiz.expectAccessible();
    api.learningState.quizzes.offline = false;
    await quiz.goOnline();
    await expect(quiz.saveStatus).toHaveText(/Answers saved/);
    expect(api.learningState.quizzes.attempts[0]!.answers).toEqual([{ questionId: 'qq-captain', choices: [0], text: null }]);
  });

  test('Given a draft quiz, when she opens it, then it is not found', async ({ page, api }) => {
    api.learningState.complete('m-sofia', ...SERVING);
    api.curriculumState.assessments.quizzes.find((q) => q.id === 'qz-serving')!.status = 'Draft';
    const intro = new LearnQuizIntroPage(page);

    await intro.open('qz-serving');

    await expect(intro.notFound).toBeVisible();
    expect(await intro.apiStatus('qz-serving')).toBe(404);
  });

  test('Given Learning is off, when a quiz is opened directly, then Today opens and the API answers 404', async ({ page, api }) => {
    api.learningState.complete('m-sofia', ...SERVING);
    api.setModules('org-harbourview', SUITE);
    const intro = new LearnQuizIntroPage(page);

    await intro.open('qz-serving');

    await expect(page).toHaveURL(/\/$/);
    await expect(new TodayPage(page).heading).toHaveText('Welcome, Sofía');
    expect(await intro.apiStatus('qz-serving')).toBe(404);
  });
});
