import { test, expect } from '../../fixtures/test';
import type { ModuleId } from '../../fixtures/seed';
import { LearnLessonPage } from '../../pages/learn-lesson.page';

// Acceptance test. Traces to: L2-069 criterion 3 (the lesson video plays from the server; a failure keeps the lesson readable and offers retry), L2-035.
const SUITE: ModuleId[] = ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports'];

test.describe('Lesson video', () => {
  test.use({ signedInAs: 'm-sofia' });

  test.beforeEach(({ api }) => {
    api.setModules('org-harbourview', [...SUITE, 'Learning']);
    api.giveConsent('c-sofia');
    api.saveOnboarding('m-sofia', { step: 3, preferredName: 'Sofía', completed: true });
    api.curriculumState.youthJourney();
    api.learningState.complete('m-sofia', 'l-strengths', 'l-values');
  });

  test('Given Pick Up the Towel has a video, when Sofía opens it, then the player loads the video from the server beside the lesson', async ({ page }) => {
    const lesson = new LearnLessonPage(page);

    await lesson.open('l-towel');

    await lesson.expectOpen('Pick Up the Towel');
    await expect(lesson.player).toBeVisible();
    await expect.poll(() => lesson.videoReadyState()).toBeGreaterThanOrEqual(1);
    await expect(lesson.video).toHaveAttribute('src', '/api/learning/lessons/l-towel/video');
    await lesson.expectAccessible();
  });

  test('Given the video fails to load, when she opens the lesson, then it says so with Retry video and the lesson text stays; Retry plays it once it is back', async ({
    page,
    api,
  }) => {
    api.learningState.failVideos = true;
    const lesson = new LearnLessonPage(page);

    await lesson.open('l-towel');

    await expect(lesson.videoFailed).toBeVisible();
    await expect(lesson.teaching).toContainText('Leading isn’t a title.');
    await lesson.expectAccessible();

    api.learningState.failVideos = false;
    await lesson.retryVideo();

    await expect(lesson.videoFailed).toHaveCount(0);
    await expect.poll(() => lesson.videoReadyState()).toBeGreaterThanOrEqual(1);
  });

  test('Given a lesson without a video, when she opens it, then no player shows', async ({ page }) => {
    const lesson = new LearnLessonPage(page);

    await lesson.open('l-strengths');

    await lesson.expectOpen('Your Strengths');
    await expect(lesson.player).toHaveCount(0);
  });
});
