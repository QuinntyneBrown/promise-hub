import { test, expect } from '../../fixtures/test';
import { TodayPage } from '../../pages/today.page';

// Today renders the session's day (L2-017) or its empty state (L2-029, L2-035, L2-036).
test.describe('Today', () => {
  test('Given a signed-in site lead with a session tonight, when Today opens, then it welcomes them and shows the session', async ({ page }) => {
    const today = new TodayPage(page);

    await today.open();

    await expect(today.heading).toHaveText('Welcome, Jaylen');
    await expect(today.subtitle).toContainText('Harbourview Youth Collective');
    await expect(today.session('Tutoring night')).toBeVisible();
    await today.expectAccessible();
    await today.expectNoHorizontalScroll();
  });

  test.describe('Nothing set up', () => {
    test.use({ signedInAs: 'm-grace' });

    test('Given no session today, when Today opens, then it offers setup', async ({ page }) => {
      const today = new TodayPage(page);

      await today.open();

      await expect(today.heading).toHaveText('Welcome, Grace');
      await expect(today.emptyState).toBeVisible();
      await expect(today.emptyStateAction('Start setup')).toBeVisible();
      await today.expectAccessible();
    });
  });
});
