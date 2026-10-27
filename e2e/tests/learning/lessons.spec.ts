import { test, expect } from '../../fixtures/test';
import type { ModuleId } from '../../fixtures/seed';
import { LearnLessonPage } from '../../pages/learn-lesson.page';
import { LearnModulePage } from '../../pages/learn-module.page';
import { LearningPage } from '../../pages/learning.page';
import { TodayPage } from '../../pages/today.page';

// Acceptance test. Traces to: L2-069 (lesson delivery and completion), L2-068 criteria 3 to 6, L2-029 and L2-035.
const SUITE: ModuleId[] = ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports'];

test.describe('Complete lessons', () => {
  test.use({ signedInAs: 'm-sofia' });

  test.beforeEach(({ api }) => {
    api.setModules('org-harbourview', [...SUITE, 'Learning']);
    api.giveConsent('c-sofia');
    api.saveOnboarding('m-sofia', { step: 3, preferredName: 'Sofía', completed: true });
  });

  test('Given her first lesson, when Sofía continues from Learning and marks it complete, then it is saved and the next lesson opens from Next', async ({
    page,
  }) => {
    const learning = new LearningPage(page);
    const lesson = new LearnLessonPage(page);
    await learning.open();

    await learning.continueLesson();

    await lesson.expectOpen('Your Strengths');
    await expect(lesson.teaching).toContainText('Everyone is good at something.');
    await expect(page.getByText('Watch for youth who find it hard to accept help.')).toHaveCount(0);
    await lesson.expectAccessible();

    await lesson.markComplete();

    await expect(lesson.completeAlert).toContainText('What Matters to You is unlocked');
    await lesson.expectAccessible();
    await lesson.next();
    await lesson.expectOpen('What Matters to You');
  });

  test('Given a scripture lesson, when she opens it, then the passage shows in a scripture block, A+ makes it larger, and completing it unlocks the next lesson', async ({
    page,
    api,
  }) => {
    api.curriculumState.youthJourney();
    api.learningState.complete('m-sofia', 'l-strengths', 'l-values', 'l-towel');
    const lesson = new LearnLessonPage(page);

    await lesson.open('l-line');

    await lesson.expectOpen('Last in Line');
    await expect(lesson.passage).toContainText('did not come to be served, but to serve');
    await expect(lesson.passage).toContainText('Mark 10:35–45');
    const before = await lesson.passageFontSize();
    await lesson.larger();
    await expect.poll(() => lesson.passageFontSize()).toBeGreaterThan(before);
    await lesson.expectNoHorizontalScroll();
    await lesson.expectAccessible();

    await lesson.markComplete();

    await expect(lesson.completeAlert).toContainText('Leading Like a Coach is unlocked');
  });

  test('Given the last lesson of a module, when she completes it, then the module is done and the module page says so', async ({ page, api }) => {
    api.learningState.complete('m-sofia', 'l-strengths');
    const lesson = new LearnLessonPage(page);
    const module = new LearnModulePage(page);
    await lesson.open('l-values');

    await lesson.markComplete();

    await expect(lesson.completeAlert).toContainText('Knowing Yourself is complete');
    await module.open('cm-knowing');
    await expect(page.getByText('Module complete')).toBeVisible();
    await expect(module.lesson('What Matters to You')).toContainText('Done');
  });

  test('Given a lesson after one she has not done, when she opens it directly, then it is locked and the server refuses it', async ({ page }) => {
    const lesson = new LearnLessonPage(page);

    await lesson.open('l-values');

    await expect(lesson.locked('Your Strengths')).toBeVisible();
    expect(await lesson.apiStatus('l-values')).toBe(403);
    await lesson.expectAccessible();
  });

  test('Given marking complete fails, when she tries, then the lesson stays and she is told to try again', async ({ page, api }) => {
    api.learningState.failCompletes = true;
    const lesson = new LearnLessonPage(page);
    await lesson.open('l-strengths');

    await lesson.markComplete();

    await expect(lesson.failed).toBeVisible();
    await expect(page.getByRole('button', { name: 'Mark complete' })).toBeEnabled();
  });

  test('Given a draft lesson, when she opens it, then it is not found', async ({ page }) => {
    const lesson = new LearnLessonPage(page);

    await lesson.open('l-circle');

    await expect(lesson.notFound).toBeVisible();
    expect(await lesson.apiStatus('l-circle')).toBe(404);
  });

  test('Given Learning is off, when a lesson is opened directly, then Today opens and the API answers 404', async ({ page, api }) => {
    api.setModules('org-harbourview', SUITE);
    const lesson = new LearnLessonPage(page);

    await lesson.open('l-strengths');

    await expect(page).toHaveURL(/\/$/);
    await expect(new TodayPage(page).heading).toHaveText('Welcome, Sofía');
    expect(await lesson.apiStatus('l-strengths')).toBe(404);
  });
});
