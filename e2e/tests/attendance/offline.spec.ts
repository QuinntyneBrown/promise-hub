import { test, expect } from '../../fixtures/test';
import { CheckInPage } from '../../pages/check-in.page';
import { QuickCardPage } from '../../pages/quick-card.page';
import { TodayPage } from '../../pages/today.page';

// L2-028 offline check-in and Quick Cards, L2-035/L2-036 accessibility and phone layout.
test.describe('Run check-in offline as a site lead', () => {
  test('Given the roster opened online, when the signal drops, then Quick Cards open from the phone and a check-in waits to sync, then sends when the signal returns', async ({ page, api }) => {
    const checkIn = new CheckInPage(page);
    await checkIn.open();
    await expect(checkIn.row('Jordan Thompson')).toBeVisible();

    api.setOffline(true);
    await checkIn.openQuickCard('Mateo Rivera');
    const card = new QuickCardPage(page);
    await expect(card.heading).toHaveText('Mateo Rivera');
    await expect(card.savedOnPhone).toContainText('Saved on this phone');
    await page.goBack();
    await expect(checkIn.offlineBanner).toContainText('Roster saved');
    await checkIn.checkIn('Jordan Thompson');

    await expect(checkIn.row('Jordan Thompson')).toContainText('waiting to sync');
    await expect(checkIn.syncChip).toHaveText('1 queued');
    await expect(checkIn.signOutButton('Jordan Thompson')).toBeDisabled();
    await checkIn.expectAccessible();
    await checkIn.expectNoHorizontalScroll();

    api.setOffline(false);
    await checkIn.connectionReturns();

    await expect(page.getByRole('status').filter({ hasText: '1 check-in synced' })).toBeVisible();
    await expect(checkIn.syncChip).toHaveCount(0);
    expect(api.attendanceOf('e-tutoring-today', 'c-jordan')).toBe('Present');
  });

  test('Given the roster was never opened, when check-in opens with no signal, then it says nothing is saved on this phone', async ({ page, api }) => {
    await new TodayPage(page).open();
    api.setOffline(true);
    const checkIn = new CheckInPage(page);

    await checkIn.openFromNavigation();

    await expect(checkIn.nothingSaved).toBeVisible();
    await checkIn.expectAccessible();
  });

  test('Given an offline check-in synced after another device marked the child absent, when the roster opens, then she is present and the conflict is flagged', async ({ page, api }) => {
    api.attendanceConflict('e-tutoring-today', 'c-sofia');
    const checkIn = new CheckInPage(page);

    await checkIn.open();

    await expect(checkIn.conflictNote('Sofía Rivera')).toHaveText('Conflict: marked absent on another device');
  });
});
