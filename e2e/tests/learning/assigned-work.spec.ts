import { test, expect } from '../../fixtures/test';
import type { ModuleId } from '../../fixtures/seed';
import { LearnLessonPage } from '../../pages/learn-lesson.page';
import { LearningPage } from '../../pages/learning.page';

// Acceptance test. Traces to: L2-092 criteria 5, 6 and 8 (the youth sees the work her mentor assigned on her Learning home, soonest due
// first, with Due in n days or Overdue, who assigned it and the message; done work drops off; hidden while Mentoring is off; a phone),
// L2-068, L2-035, L2-036.
const SUITE: ModuleId[] = ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports'];
const MESSAGE = 'Read this before Tutoring night next week. Come ready to share one way you served someone.';

test.describe('Assigned work on the Learning home', () => {
  test.use({ signedInAs: 'm-sofia' });

  test.beforeEach(({ api }) => {
    api.setModules('org-harbourview', [...SUITE, 'Learning', 'Mentoring']);
    api.giveConsent('c-sofia');
    api.saveOnboarding('m-sofia', { step: 3, preferredName: 'Sofía', completed: true });
    api.curriculumState.youthJourney();
    api.curriculumState.assessments.quizJourney();
    api.learningState.complete('m-sofia', 'l-strengths', 'l-values');
    api.assignedWork.seed({ childId: 'c-sofia', kind: 'Lesson', itemId: 'l-line', dueOn: '2026-11-13', message: MESSAGE });
    api.assignedWork.seed({ childId: 'c-sofia', kind: 'Quiz', itemId: 'qz-serving', dueOn: '2026-11-03' });
    api.assignedWork.seed({ childId: 'c-mateo', kind: 'Lesson', itemId: 'l-towel', dueOn: '2026-11-06' });
  });

  test('Given Daniel assigned her Last in Line and a quiz, when Sofía opens Learning, then Assigned to you lists them soonest due first and opens the lesson', async ({
    page,
    api,
  }) => {
    api.learningState.complete('m-sofia', 'l-towel');
    const learning = new LearningPage(page);
    const lesson = new LearnLessonPage(page);
    await learning.open();

    await expect(learning.assignedHeading).toBeVisible();
    await expect(learning.assigned).toHaveCount(2);
    await expect(learning.assigned.nth(0)).toContainText('Leading by Serving quiz');
    await expect(learning.assigned.nth(0)).toContainText('Quiz · Leading by Serving · Was due Tue 3 Nov · From Daniel Osei');
    await expect(learning.assigned.nth(0)).toContainText('Overdue');
    await expect(learning.assigned.nth(1)).toContainText('Last in Line');
    await expect(learning.assigned.nth(1)).toContainText('Lesson · Leading by Serving · Due Fri 13 Nov · From Daniel Osei');
    await expect(learning.assigned.nth(1)).toContainText(MESSAGE);
    await expect(learning.assigned.nth(1)).toContainText('Due in 8 days');
    await expect(learning.assigned).not.toContainText(['Pick Up the Towel']);
    await learning.expectAccessible();
    await learning.expectNoHorizontalScroll();

    await learning.openAssigned('Last in Line');

    await lesson.expectOpen('Last in Line');
  });

  test('Given she finished everything assigned to her, when she opens Learning, then there is no Assigned to you card', async ({ page, api }) => {
    api.learningState.complete('m-sofia', 'l-towel', 'l-line');
    api.learningState.quizzes.submitted('m-sofia', 'qz-serving', []);
    const learning = new LearningPage(page);

    await learning.open();

    await learning.expectOpen();
    await expect(learning.assignedHeading).toHaveCount(0);
    await learning.expectAccessible();
  });

  test('Given Mentoring is off, when she opens Learning, then no assigned work is shown and her lessons are still there', async ({ page, api }) => {
    api.setModules('org-harbourview', [...SUITE, 'Learning']);
    const learning = new LearningPage(page);

    await learning.open();

    await expect(page.getByRole('heading', { name: 'Your tracks' })).toBeVisible();
    await expect(learning.assignedHeading).toHaveCount(0);
  });
});
