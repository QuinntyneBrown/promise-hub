import { test, expect } from '../../fixtures/test';
import type { ModuleId } from '../../fixtures/seed';
import { CurriculumModulePage } from '../../pages/curriculum-module.page';
import { CurriculumQuizPage } from '../../pages/curriculum-quiz.page';

// Acceptance test. Traces to: L2-073 criteria 1 to 3 and 7 to 9 (a quiz and its questions of four types).
const ON: ModuleId[] = ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports', 'Learning'];

test.describe('Authoring quizzes', () => {
  test.use({ signedInAs: 'm-marisol' });

  test('Given Leading by Serving, when Marisol creates a quiz, then the empty builder opens and the module lists the quiz', async ({ page }) => {
    const module = new CurriculumModulePage(page);
    const quiz = new CurriculumQuizPage(page);
    await module.open('cm-serving');
    await module.expectOpen('Leading by Serving');
    await module.expectAccessible();

    await module.newQuiz('Leading by Serving quiz');

    await quiz.expectOpen('Leading by Serving quiz');
    await expect(quiz.subtitle).toHaveText('Quiz · Leading by Serving');
    await expect(quiz.status).toHaveText('Draft');
    await expect(quiz.noQuestions).toBeVisible();
    await quiz.expectAccessible();
    await page.goBack();
    await module.expectOpen('Leading by Serving');
    await expect(module.assessments).toContainText('Leading by Serving quiz');
    await expect(module.assessments).toContainText('Quiz · The whole module · 0 questions');
  });

  test('Given a blank title, when Marisol creates a quiz, then the dialog says to give it a title', async ({ page }) => {
    const module = new CurriculumModulePage(page);
    await module.open('cm-serving');
    await module.expectOpen('Leading by Serving');

    await module.newQuiz(' ');

    await expect(module.dialogError('title')).toHaveText('Give the quiz a title.');
    await module.expectAccessible();
  });

  test('Given the quiz builder, when Marisol adds a question of each type, then each is listed with its type and correct answers', async ({ page }) => {
    const quiz = new CurriculumQuizPage(page);
    await quiz.open('qz-serving');
    await quiz.expectOpen('Leading by Serving quiz');

    await quiz.addQuestion({
      text: 'In Pick Up the Towel, what did the captain do before the big game?',
      type: 'Multiple choice',
      options: ['Packed the kit bags for everyone', 'Went home early', 'Asked the coach for help'],
      correct: ['A'],
    });
    await expect(quiz.dialog).toBeHidden();
    await quiz.addQuestion({ text: 'Leading is a title someone gives you.', type: 'True / false', correct: ['False'] });
    await expect(quiz.dialog).toBeHidden();
    await quiz.addQuestion({
      text: 'Which of these are ways to “pick up the towel” this week?',
      type: 'Multiple answer',
      options: ['Help clear up after group', 'Wait to be asked', 'Check on someone who is new'],
      correct: ['A', 'C'],
    });
    await expect(quiz.dialog).toBeHidden();
    await quiz.addQuestion({ text: 'In one word, who does a servant leader put first?', type: 'Short answer', answers: 'others\nother people' });
    await expect(quiz.dialog).toBeHidden();

    expect(await quiz.questionTitles()).toEqual([
      '1. In Pick Up the Towel, what did the captain do before the big game?',
      '2. Leading is a title someone gives you.',
      '3. Which of these are ways to “pick up the towel” this week?',
      '4. In one word, who does a servant leader put first?',
    ]);
    expect(await quiz.questionMetas()).toEqual([
      'Multiple choice · 3 options · Answer: Packed the kit bags for everyone',
      'True / false · Answer: False',
      'Multiple answer · 3 options · Answers: Help clear up after group; Check on someone who is new',
      'Short answer · Accepts: others, other people',
    ]);
    await quiz.expectAccessible();
    await page.reload();
    await quiz.expectOpen('Leading by Serving quiz');
    expect((await quiz.questionTitles()).length).toBe(4);
  });

  test('Given a question with no text and no correct answer, when Marisol adds it, then both errors show and nothing is added', async ({ page }) => {
    const quiz = new CurriculumQuizPage(page);
    await quiz.open('qz-serving');
    await quiz.expectOpen('Leading by Serving quiz');

    await quiz.addQuestion({ text: '', type: 'Multiple choice', options: ['Packed the kit bags', 'Went home'] });

    await expect(quiz.dialogError('text')).toHaveText('Write the question.');
    await expect(quiz.groupError('Correct answer')).toHaveText('Mark the correct answer.');
    await quiz.expectAccessible();
    await page.keyboard.press('Escape');
    await expect(quiz.noQuestions).toBeVisible();
  });

  test('Given two questions, when Marisol edits the second and deletes the first, then the list shows the edited one first', async ({ page, api }) => {
    api.curriculumState.seedQuestions('qz-serving');
    const quiz = new CurriculumQuizPage(page);
    await quiz.open('qz-serving');
    await quiz.expectOpen('Leading by Serving quiz');
    expect((await quiz.questionTitles()).length).toBe(2);

    await quiz.editQuestion(2, { text: 'Leading is something you are given.' });
    await expect(quiz.dialog).toBeHidden();
    await expect(quiz.questions).toContainText('2. Leading is something you are given.');
    await quiz.deleteQuestion(1);

    await expect.poll(() => quiz.questionTitles()).toEqual(['1. Leading is something you are given.']);
    await expect(quiz.toast).toContainText('Question deleted');
  });

  test('Given an unknown quiz, when it is opened, then the page says it can’t be found', async ({ page }) => {
    const quiz = new CurriculumQuizPage(page);

    await quiz.open('qz-unknown');

    await expect(quiz.notFound).toBeVisible();
    await quiz.expectAccessible();
  });

  test('Given the quiz fails to load, when Marisol opens it, then the error state offers Try again', async ({ page, api }) => {
    const quiz = new CurriculumQuizPage(page);
    api.failNext('/api/curriculum/quizzes/qz-serving', 500);

    await quiz.open('qz-serving');

    await expect(quiz.errorState).toBeVisible();
    await quiz.expectAccessible();
  });

  test('Given Learning is off, when a quiz is opened directly, then Today opens and the quiz endpoint answers 404', async ({ page, api }) => {
    api.setModules(
      'org-harbourview',
      ON.filter((m) => m !== 'Learning'),
    );
    const quiz = new CurriculumQuizPage(page);

    await quiz.open('qz-serving');

    await expect(page).toHaveURL(/\/$/);
    expect(await quiz.apiStatus('/api/curriculum/quizzes/qz-serving')).toBe(404);
  });

  test('Given a phone, when Marisol opens the quiz builder, then nothing scrolls sideways', async ({ page, api }) => {
    api.curriculumState.seedQuestions('qz-serving');
    await page.setViewportSize({ width: 360, height: 800 });
    const quiz = new CurriculumQuizPage(page);

    await quiz.open('qz-serving');
    await quiz.expectOpen('Leading by Serving quiz');

    await quiz.expectNoHorizontalScroll();
    await quiz.expectAccessible();
  });
});

test.describe('Quizzes for other roles and organizations', () => {
  test('Given Jaylen, a site lead, when he opens a quiz, then the page says program directors write the curriculum', async ({ page }) => {
    const quiz = new CurriculumQuizPage(page);

    await quiz.open('qz-serving');

    await expect(quiz.forbidden).toBeVisible();
    expect(await quiz.apiStatus('/api/curriculum/quizzes/qz-serving')).toBe(403);
    await quiz.expectAccessible();
  });

  test.describe('at Northgate', () => {
    test.use({ signedInAs: 'm-grace' });

    test('Given Learning is on at Northgate, when Grace requests a Harbourview quiz, then it answers 404', async ({ page, api }) => {
      api.setModules('org-northgate', ['Roster', 'RollCall', 'QuickCards', 'Learning']);
      const quiz = new CurriculumQuizPage(page);

      await quiz.open('qz-serving');

      await expect(quiz.notFound).toBeVisible();
      expect(await quiz.apiStatus('/api/curriculum/quizzes/qz-serving')).toBe(404);
    });
  });
});
