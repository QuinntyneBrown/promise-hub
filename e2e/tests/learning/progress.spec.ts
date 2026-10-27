import { test, expect } from '../../fixtures/test';
import type { ModuleId } from '../../fixtures/seed';
import { LearnJourneyPage } from '../../pages/learn-journey.page';
import { LearnProgressPage } from '../../pages/learn-progress.page';
import { TodayPage } from '../../pages/today.page';

// Acceptance test. Traces to: L2-088 criteria 1 to 8 (Overview with progress, quiz average, streak, attendance and competencies; the quiz
// history; attendance while Roll Call is on and nothing while it is off; empty and failed states; tabs by keyboard; Learning off), L2-035, L2-036.
const SUITE: ModuleId[] = ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports'];

test.describe('Review personal progress', () => {
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
  });

  test('Given lessons done, a scored quiz, sessions marked and assessed competencies, when Sofía opens Your progress from her journey, then Overview, Quizzes and Attendance show them', async ({
    page,
    api,
  }) => {
    api.learningState.completeOn('m-sofia', '2026-11-03T16:00:00Z', 'l-strengths', 'l-values', 'l-towel', 'l-line', 'l-coach');
    api.curriculumState.assessments.quizJourney();
    api.learningState.quizzes.submitted('m-sofia', 'qz-serving', [
      { questionId: 'qq-captain', choices: [1], text: null },
      { questionId: 'qq-title', choices: [1], text: null },
      { questionId: 'qq-first', choices: null, text: 'others' },
    ]);
    api.recordAttendance('e-tutoring-yesterday', 'c-sofia', 'Absent', null);
    api.recordAttendance('e-tutoring-today', 'c-sofia', 'Present', '2026-11-05T21:02:00Z');
    api.reviews.assess({
      childId: 'c-sofia',
      competencyId: 'cp-speaks',
      level: 'Proficient',
      notes: null,
      by: 'Daniel Osei',
      at: '2026-10-29T16:00:00Z',
    });
    const journey = new LearnJourneyPage(page);
    const progress = new LearnProgressPage(page);
    await journey.open();

    await journey.openProgress();

    await progress.expectOpen();
    await expect(progress.tab('Overview')).toHaveAttribute('aria-selected', 'true');
    await expect(progress.stat('Quiz average')).toHaveText('75%');
    await expect(progress.stat('Streak')).toHaveText('1 week');
    await expect(progress.stat('Attendance')).toHaveText('50%');
    await expect(progress.competency('Speaks up')).toContainText('Proficient');
    await expect(progress.competency('Leads a small group')).toContainText('Not started');
    await progress.expectAccessible();

    await progress.openTab('Quizzes');
    await expect(progress.row('Leading by Serving quiz')).toContainText('75%');
    await expect(progress.row('Leading by Serving quiz')).toContainText('Passed');
    await progress.expectAccessible();

    await progress.tab('Quizzes').press('ArrowRight');
    await expect(progress.tab('Attendance')).toHaveAttribute('aria-selected', 'true');
    await expect(progress.tab('Attendance')).toBeFocused();
    await expect(progress.panel.getByRole('row')).toHaveCount(3);
    await expect(progress.panel.getByRole('row').nth(1)).toContainText('Present');
    await expect(progress.panel.getByRole('row').nth(2)).toContainText('Absent');
    await progress.expectAccessible();
  });

  test('Given Roll Call is off, when she opens Your progress, then there is no Attendance tab and no attendance number', async ({ page, api }) => {
    api.setModules('org-harbourview', ['Roster', 'Slips', 'Messages', 'Learning', 'Mentoring']);
    const progress = new LearnProgressPage(page);

    await progress.open();

    await expect(progress.tab('Quizzes')).toBeVisible();
    await expect(progress.tab('Attendance')).toHaveCount(0);
    await expect(progress.stat('Attendance')).toHaveCount(0);
    await expect(page.getByText('Attendance')).toHaveCount(0);
  });

  test('Given nothing done yet, when she opens Your progress, then the numbers say so and Overview offers Start a lesson', async ({ page }) => {
    const progress = new LearnProgressPage(page);

    await progress.open();

    await expect(progress.stat('Quiz average')).toHaveText('—');
    await expect(progress.stat('Streak')).toHaveText('0 weeks');
    await expect(progress.startALesson).toBeVisible();
    await progress.expectAccessible();
  });

  test('Given Your progress fails to load, then the error state offers Try again', async ({ page, api }) => {
    api.failNext('/api/learning/progress', 500);
    const progress = new LearnProgressPage(page);

    await progress.open();

    await expect(progress.failed).toBeVisible();
    await progress.expectAccessible();
  });

  test('Given Learning is off, when Your progress is opened directly, then Today opens and the API answers 404', async ({ page, api }) => {
    api.setModules('org-harbourview', SUITE);
    const progress = new LearnProgressPage(page);

    await progress.open();

    await expect(page).toHaveURL(/\/$/);
    await expect(new TodayPage(page).heading).toHaveText('Welcome, Sofía');
    expect(await progress.apiStatus()).toBe(404);
  });

  test('Given a phone, when she opens each tab, then nothing scrolls sideways and each passes axe', async ({ page, api }) => {
    api.recordAttendance('e-tutoring-today', 'c-sofia', 'Present', '2026-11-05T21:02:00Z');
    await page.setViewportSize({ width: 360, height: 800 });
    const progress = new LearnProgressPage(page);

    await progress.open();

    for (const tab of ['Overview', 'Quizzes', 'Attendance']) {
      await progress.openTab(tab);
      await expect(progress.tab(tab)).toHaveAttribute('aria-selected', 'true');
      await progress.expectNoHorizontalScroll();
      await progress.expectAccessible();
    }
  });
});
