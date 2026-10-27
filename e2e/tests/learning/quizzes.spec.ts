import { test, expect } from '../../fixtures/test';
import type { ModuleId } from '../../fixtures/seed';
import { LearnModulePage } from '../../pages/learn-module.page';
import { LearnQuizIntroPage } from '../../pages/learn-quiz-intro.page';
import { LearnQuizPage } from '../../pages/learn-quiz.page';
import { LearnQuizResultPage } from '../../pages/learn-quiz-result.page';
import { TodayPage } from '../../pages/today.page';

// Acceptance test. Traces to: L2-075 criteria 1 to 9, L2-076 criteria 1 to 7 (a quiz's rules, its lock, the module's quizzes, taking it with autosave, Learning off), L2-035.
const SUITE: ModuleId[] = ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports'];
const SERVING = ['l-strengths', 'l-values', 'l-towel', 'l-line', 'l-coach'];
/** Every answer right but the multiple answer, which misses Check on someone who is new: 75%. */
const THREE_OF_FOUR = [
  { questionId: 'qq-captain', choices: [1], text: null },
  { questionId: 'qq-title', choices: [1], text: null },
  { questionId: 'qq-towel', choices: [0], text: null },
  { questionId: 'qq-first', choices: null, text: 'others' },
];

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

  test('Given every question answered, when Sofía submits on the last question and confirms, then the attempt is scored on the server, locked and its result opens', async ({
    page,
    api,
  }) => {
    api.learningState.complete('m-sofia', ...SERVING);
    api.learningState.quizzes.inProgress(
      'm-sofia',
      'qz-serving',
      [
        { questionId: 'qq-captain', choices: [1], text: null },
        { questionId: 'qq-title', choices: [1], text: null },
        { questionId: 'qq-towel', choices: [0], text: null },
      ],
      3,
    );
    const quiz = new LearnQuizPage(page);
    await quiz.open('qz-serving');
    await quiz.write('others');

    await quiz.submit();

    await expect(quiz.dialog).toContainText('Leading by Serving quiz · Attempt 1 of 2');
    await expect(quiz.dialog).toContainText('Once you submit, this attempt is scored and locked.');
    await quiz.expectAccessible();
    await quiz.confirmSubmit();

    await expect(page).toHaveURL(/\/learning\/attempts\/qa-1$/);
    const attempt = api.learningState.quizzes.attempts[0]!;
    expect(attempt.status).toBe('Scored');
    expect(attempt.score).toBe(75);
    expect(attempt.answers.find((a) => a.questionId === 'qq-first')?.text).toBe('others');
  });

  test('Given two questions left blank, when she submits, then the dialog names them and she can go back to them', async ({ page, api }) => {
    api.learningState.complete('m-sofia', ...SERVING);
    api.learningState.quizzes.inProgress(
      'm-sofia',
      'qz-serving',
      [
        { questionId: 'qq-captain', choices: [1], text: null },
        { questionId: 'qq-first', choices: null, text: 'others' },
      ],
      3,
    );
    const quiz = new LearnQuizPage(page);
    await quiz.open('qz-serving');

    await quiz.submit();

    await expect(quiz.dialog).toContainText('2 questions have no answer');
    await expect(quiz.dialog).toContainText('Questions 2 and 3 are blank and will count as wrong.');
    await quiz.keepReviewing();
    await expect(quiz.dialog).toHaveCount(0);
    expect(api.learningState.quizzes.attempts[0]!.status).toBe('InProgress');
  });

  test('Given the submit fails, when she confirms, then her answers stay saved and she can try again', async ({ page, api }) => {
    api.learningState.complete('m-sofia', ...SERVING);
    api.learningState.quizzes.inProgress('m-sofia', 'qz-serving', [{ questionId: 'qq-first', choices: null, text: 'others' }], 3);
    api.learningState.quizzes.failSubmits = true;
    const quiz = new LearnQuizPage(page);
    await quiz.open('qz-serving');

    await quiz.submit();
    await quiz.confirmSubmit();

    await expect(quiz.dialog).toContainText('Your quiz was not submitted. Your answers are saved; try again.');
    expect(api.learningState.quizzes.attempts[0]!.status).toBe('InProgress');
  });

  test('Given her attempt was submitted in another tab, when she changes an answer, then the page says it is already submitted', async ({ page, api }) => {
    api.learningState.complete('m-sofia', ...SERVING);
    const attempt = api.learningState.quizzes.inProgress('m-sofia', 'qz-serving', [], 0);
    const quiz = new LearnQuizPage(page);
    await quiz.open('qz-serving');
    await expect(quiz.question('In Pick Up the Towel, what did the captain do before the big game?')).toBeVisible();
    attempt.status = 'Scored';

    await quiz.choose('Went home early');

    await expect(quiz.alreadySubmitted).toBeVisible();
  });

  test('Given both attempts are used, when she opens the quiz, then Start is gone, her best attempt is offered and the server refuses another', async ({
    page,
    api,
  }) => {
    api.learningState.complete('m-sofia', ...SERVING);
    api.learningState.quizzes.submitted('m-sofia', 'qz-serving', [
      { questionId: 'qq-captain', choices: [1], text: null },
      { questionId: 'qq-title', choices: [1], text: null },
    ]);
    api.learningState.quizzes.submitted('m-sofia', 'qz-serving', [
      { questionId: 'qq-captain', choices: [1], text: null },
      { questionId: 'qq-title', choices: [1], text: null },
      { questionId: 'qq-first', choices: null, text: 'others' },
    ]);
    const intro = new LearnQuizIntroPage(page);
    const quiz = new LearnQuizPage(page);

    await intro.open('qz-serving');

    await expect(intro.notice).toContainText('You’ve used both attempts. Your best score, 75%, is the one that counts.');
    await expect(intro.startButton).toHaveCount(0);
    await expect(intro.bestAttemptButton).toBeVisible();
    await intro.expectAccessible();
    await quiz.open('qz-serving');
    await expect(quiz.noAttemptsLeft).toBeVisible();
    expect(api.learningState.quizzes.attempts).toHaveLength(2);
  });

  test('Given a submitted attempt with 3 of 4 right, when Sofía opens its result, then she has passed and the review marks each answer in words', async ({
    page,
    api,
  }) => {
    api.learningState.complete('m-sofia', ...SERVING);
    api.learningState.quizzes.submitted('m-sofia', 'qz-serving', THREE_OF_FOUR);
    const result = new LearnQuizResultPage(page);
    const intro = new LearnQuizIntroPage(page);

    await result.open('qa-1');

    await result.expectOpen('Leading by Serving quiz');
    await expect(result.outcome).toContainText('You passed, Sofía');
    await expect(result.fact('Your score')).toContainText('75%');
    await expect(result.fact('Your score')).toContainText('3 of 4 correct');
    await expect(result.fact('Pass mark')).toContainText('70%');
    await expect(result.reviewed(1)).toContainText('Packed the kit bags for everyone');
    await expect(result.reviewed(1)).toContainText('Your answer · correct');
    await expect(result.reviewed(3)).toContainText('Not quite');
    await expect(result.reviewed(3)).toContainText('Correct answer · you didn’t choose it');
    await expect(result.reviewed(4)).toContainText('others');
    await result.expectNoHorizontalScroll();
    await result.expectAccessible();

    await result.tryAgain.click();

    await expect(intro.notice).toContainText('You passed with 75%');
    await expect(intro.tryAgainButton).toBeVisible();
  });

  test('Given an attempt that did not pass, when she tries again, then the intro offers her last attempt and attempt 2 starts', async ({ page, api }) => {
    api.learningState.complete('m-sofia', ...SERVING);
    api.learningState.quizzes.submitted('m-sofia', 'qz-serving', [
      { questionId: 'qq-captain', choices: [0], text: null },
      { questionId: 'qq-title', choices: [1], text: null },
      { questionId: 'qq-towel', choices: [0, 1], text: null },
      { questionId: 'qq-first', choices: null, text: 'others' },
    ]);
    const result = new LearnQuizResultPage(page);
    const intro = new LearnQuizIntroPage(page);
    const quiz = new LearnQuizPage(page);
    await result.open('qa-1');
    await expect(result.outcome).toContainText('You got 50%. You need 70% to pass and you have 1 attempt left.');
    await expect(result.reviewed(1)).toContainText('Your answer · wrong');
    await result.expectAccessible();

    await result.tryAgain.click();
    await expect(intro.notice).toContainText('Last attempt');
    await expect(intro.fact('This attempt')).toContainText('2 of 2');
    await intro.start();

    await expect(page.getByText('Attempt 2 of 2 · Question 1 of 4')).toBeVisible();
    await expect(quiz.option('Gave the team talk')).not.toBeChecked();
  });

  test('Given a quiz that shows the score only, when she opens her result, then there is no review of the answers', async ({ page, api }) => {
    api.learningState.complete('m-sofia', ...SERVING);
    api.curriculumState.assessments.quizzes.find((q) => q.id === 'qz-serving')!.feedback = 'ScoreOnly';
    api.learningState.quizzes.submitted('m-sofia', 'qz-serving', THREE_OF_FOUR);
    const result = new LearnQuizResultPage(page);

    await result.open('qa-1');

    await expect(result.fact('Your score')).toContainText('75%');
    await expect(result.review).toContainText('This quiz shows your score only.');
    await expect(page.getByText('Packed the kit bags for everyone')).toHaveCount(0);
    await result.expectAccessible();
  });

  test('Given a quiz whose scores her mentor approves, when she opens her result, then it waits for her mentor and shows no score', async ({ page, api }) => {
    api.learningState.complete('m-sofia', ...SERVING);
    api.curriculumState.assessments.quizzes.find((q) => q.id === 'qz-serving')!.requireApproval = true;
    api.learningState.quizzes.submitted('m-sofia', 'qz-serving', THREE_OF_FOUR);
    const result = new LearnQuizResultPage(page);
    const module = new LearnModulePage(page);

    await result.open('qa-1');

    await expect(result.awaiting).toBeVisible();
    await expect(page.getByText('75%')).toHaveCount(0);
    await result.expectAccessible();
    await module.open('cm-serving');
    await expect(module.quiz('Leading by Serving quiz')).toContainText('Waiting for your mentor');
  });

  test('Given a quiz required to finish the module, when she passes it, then the module is complete', async ({ page, api }) => {
    api.learningState.complete('m-sofia', ...SERVING);
    api.curriculumState.assessments.quizzes.find((q) => q.id === 'qz-serving')!.requiredToComplete = true;
    const module = new LearnModulePage(page);
    await module.open('cm-serving');
    await expect(page.getByText('Pass the quiz to finish this module.')).toBeVisible();
    await expect(page.getByText('Module complete')).toHaveCount(0);

    api.learningState.quizzes.submitted('m-sofia', 'qz-serving', THREE_OF_FOUR);
    await module.open('cm-serving');

    await expect(page.getByText('Every lesson is done and you passed the quiz.')).toBeVisible();
    await expect(module.quiz('Leading by Serving quiz')).toContainText('Passed');
    await expect(module.quiz('Leading by Serving quiz')).toContainText('Best score 75%');
    await module.expectAccessible();
  });

  test('Given an attempt still in progress, when its result is opened, then it is not found', async ({ page, api }) => {
    api.learningState.complete('m-sofia', ...SERVING);
    api.learningState.quizzes.inProgress('m-sofia', 'qz-serving', [], 0);
    const result = new LearnQuizResultPage(page);

    await result.open('qa-1');

    await expect(result.notFound).toBeVisible();
    expect(await result.apiStatus('qa-1')).toBe(404);
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
    await new LearnQuizResultPage(page).open('qa-1');
    await expect(page).toHaveURL(/\/$/);
    expect(await new LearnQuizResultPage(page).apiStatus('qa-1')).toBe(404);
  });
});
