import { test, expect } from '../../fixtures/test';
import type { ModuleId } from '../../fixtures/seed';
import { waitingWork } from '../../fixtures/mentor-work';
import { MentorQuizApprovalsPage } from '../../pages/mentor-quiz-approvals.page';
import { MentorReviewsPage } from '../../pages/mentor-reviews.page';

// Acceptance test. Traces to: L2-081 criteria 1 to 6 (results awaiting approval, approving the auto-score or an override, approve all,
// empty, failed and Learning off), L2-035.
const ALL: ModuleId[] = ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports', 'Learning', 'Mentoring'];
const QUIZ = 'Leading by Serving quiz';

function secondResult(api: Parameters<typeof waitingWork>[0]): void {
  api.learningState.quizzes.submitted(
    'm-sofia',
    'qz-serving',
    [
      { questionId: 'qq-captain', choices: [0], text: null },
      { questionId: 'qq-title', choices: [1], text: null },
      { questionId: 'qq-towel', choices: [0], text: null },
      { questionId: 'qq-first', choices: null, text: 'others' },
    ],
    '2026-11-05T14:15:00Z',
  );
}

test.describe('Quiz approvals', () => {
  test.use({ signedInAs: 'm-daniel' });

  test('Given Nadia’s result waits, when Daniel opens Quiz approvals from Reviews and approves it with an override, then it counts at the score he set', async ({ page, api }) => {
    waitingWork(api);
    const reviews = new MentorReviewsPage(page);
    const approvals = new MentorQuizApprovalsPage(page);
    await reviews.open();

    await reviews.openQuizApprovals();

    await approvals.expectOpen();
    await expect(approvals.rows).toHaveCount(1);
    await expect(approvals.rows.first()).toContainText('Nadia Haddad');
    await expect(approvals.rows.first()).toContainText('75%');
    await expect(approvals.rows.first()).toContainText('Pass');
    await approvals.expectAccessible();
    await approvals.approve('Nadia Haddad', QUIZ);
    await expect(approvals.dialog).toContainText('75% · 3 of 4 right');
    await approvals.override.fill('150');
    await approvals.confirm('Approve score');
    await expect(approvals.dialog).toContainText('Enter a whole number from 0 to 100, or leave it blank.');
    await approvals.expectAccessible();
    await approvals.override.fill('80');
    await approvals.confirm('Approve score');

    await expect(approvals.toast('Approved')).toBeVisible();
    await expect(approvals.empty).toBeVisible();
    const attempt = api.learningState.quizzes.attempts.find((a) => a.membershipId === 'm-nadia')!;
    expect(attempt.status).toBe('Scored');
    expect(attempt.score).toBe(80);
    expect(attempt.autoScore).toBe(75);
    await approvals.expectNoHorizontalScroll();
  });

  test('Given two results wait, when he approves all, then both count at their auto-scores', async ({ page, api }) => {
    waitingWork(api);
    secondResult(api);
    const approvals = new MentorQuizApprovalsPage(page);
    await approvals.open();
    await expect(approvals.rows).toHaveCount(2);

    await approvals.approveAll();
    await expect(approvals.dialog).toContainText('Approve all 2 quiz scores?');
    await approvals.expectAccessible();
    await approvals.confirm('Approve all');

    await expect(approvals.empty).toBeVisible();
    expect(api.learningState.quizzes.attempts.map((a) => [a.status, a.score])).toEqual([
      ['Scored', 75],
      ['Scored', 50],
    ]);
  });

  test('Given the list fails to load, then it says so; given nothing waits, then it says there is nothing to approve', async ({ page, api }) => {
    api.setModules('org-harbourview', ALL);
    api.failNext('/api/mentoring/quiz-approvals', 500);
    const approvals = new MentorQuizApprovalsPage(page);

    await approvals.open();
    await expect(approvals.failed).toBeVisible();
    await approvals.expectAccessible();
    api.recover('/api/mentoring/quiz-approvals');
    await page.getByRole('button', { name: 'Try again' }).click();

    await expect(approvals.empty).toBeVisible();
    await approvals.expectAccessible();
  });

  test('Given Learning is off, when he opens Quiz approvals, then it goes to Today and the API answers 404', async ({ page, api }) => {
    waitingWork(api);
    api.setModules('org-harbourview', ALL.filter((m) => m !== 'Learning'));
    const approvals = new MentorQuizApprovalsPage(page);

    await approvals.open();

    await expect(page).toHaveURL(/\/$/);
    expect(await approvals.apiStatus()).toBe(404);
  });
});
