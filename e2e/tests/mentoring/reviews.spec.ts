import { test, expect } from '../../fixtures/test';
import type { ModuleId } from '../../fixtures/seed';
import { waitingWork } from '../../fixtures/mentor-work';
import { MentoringPage } from '../../pages/mentoring.page';
import { MentorReviewsPage } from '../../pages/mentor-reviews.page';
import { TodayPage } from '../../pages/today.page';

// Acceptance test. Traces to: L2-080 criteria 1 and 7, L2-081 criterion 1 (the review queue of a mentor's youth, oldest first, its filters,
// empty and failed states, the dashboard's Reviews, other roles, Learning off), L2-035.
const ALL: ModuleId[] = ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports', 'Learning', 'Mentoring'];
test.describe('The review queue', () => {
  test.use({ signedInAs: 'm-daniel' });

  test('Given work from his youth, when Daniel opens Reviews from Mentoring, then it lists two submissions and a quiz result oldest first, and filters them', async ({ page, api }) => {
    waitingWork(api);
    const mentoring = new MentoringPage(page);
    const reviews = new MentorReviewsPage(page);
    await mentoring.open();
    await expect(mentoring.reviewsButton).toHaveText(/Reviews · 3/);

    await mentoring.reviewsButton.click();

    await reviews.expectOpen();
    await expect(reviews.rows).toHaveCount(3);
    await expect(reviews.rows.nth(0)).toContainText('Nadia Haddad');
    await expect(reviews.rows.nth(0)).toContainText('Serve someone this week');
    await expect(reviews.rows.nth(0)).toContainText('Late');
    await expect(reviews.rows.nth(1)).toContainText('Sofía Rivera');
    await expect(reviews.rows.nth(2)).toContainText('Leading by Serving quiz');
    await expect(reviews.rows.nth(2)).toContainText('Quiz · 75%');
    await reviews.expectAccessible();
    await reviews.filter('Quizzes');
    await expect(reviews.rows).toHaveCount(1);
    await reviews.filter('Assignments');
    await expect(reviews.rows).toHaveCount(2);
    await reviews.expectNoHorizontalScroll();
  });

  test('Given nothing is waiting, when Daniel opens Reviews, then he is all caught up', async ({ page, api }) => {
    api.setModules('org-harbourview', ALL);
    const reviews = new MentorReviewsPage(page);

    await reviews.open();

    await expect(reviews.caughtUp).toBeVisible();
    await reviews.expectAccessible();
  });

  test('Given the queue fails to load, when he tries again, then it loads', async ({ page, api }) => {
    waitingWork(api);
    api.failNext('/api/mentoring/reviews', 500);
    const reviews = new MentorReviewsPage(page);

    await reviews.open();
    await expect(reviews.failed).toBeVisible();
    await reviews.expectAccessible();
    api.recover('/api/mentoring/reviews');
    await reviews.retry();

    await expect(reviews.rows).toHaveCount(3);
  });

  test('Given Learning is off, when Daniel opens Mentoring or /mentoring/reviews, then there is no Reviews, the route goes to Today and the API answers 404', async ({ page, api }) => {
    waitingWork(api);
    api.setModules('org-harbourview', ALL.filter((m) => m !== 'Learning'));
    const mentoring = new MentoringPage(page);
    const reviews = new MentorReviewsPage(page);
    const fetched = mentoring.recordApiPaths();
    await mentoring.open();
    await mentoring.expectOpen();
    await expect(mentoring.stat('My youth')).toHaveText('2');
    await expect(mentoring.reviewsButton).toHaveCount(0);
    expect(fetched.filter((p) => p.startsWith('/api/mentoring/reviews'))).toEqual([]);

    await reviews.open();

    await expect(page).toHaveURL(/\/$/);
    await expect(new TodayPage(page).heading).toBeVisible();
    expect(await reviews.apiStatus()).toBe(404);
  });
});

test.describe('Reviews for other roles', () => {
  test.use({ signedInAs: 'm-marisol' });

  test('Given a program director opens /mentoring/reviews, when it loads, then it says reviews are for mentors and the API answers 403', async ({ page, api }) => {
    api.setModules('org-harbourview', ALL);
    const reviews = new MentorReviewsPage(page);

    await reviews.open();

    await expect(reviews.forbidden).toBeVisible();
    expect(await reviews.apiStatus()).toBe(403);
    await reviews.expectAccessible();
  });
});
