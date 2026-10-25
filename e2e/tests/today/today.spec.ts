import { test, expect } from '../../fixtures/test';
import { TodayPage } from '../../pages/today.page';

// Walking skeleton: Today renders its empty state from the session (L2-029, L2-035, L2-036).
test.describe('Today', () => {
  test('Given a signed-in site lead with nothing set up, when Today opens, then it welcomes them and offers setup', async ({ page }) => {
    const today = new TodayPage(page);

    await today.open();

    await expect(today.heading).toHaveText('Welcome, Jaylen');
    await expect(today.subtitle).toContainText('Harbourview Youth Collective');
    await expect(today.emptyState).toBeVisible();
    await expect(today.emptyStateAction('Start setup')).toBeVisible();
    await expect(today.emptyStateAction('Import a roster')).toBeVisible();
    await today.expectAccessible();
    await today.expectNoHorizontalScroll();
  });
});
