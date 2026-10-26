import { test, expect } from '../../fixtures/test';
import { AccountPage } from '../../pages/account.page';

// L2-006 staff sign-in (account, recovery codes, sign out everywhere), L2-031, L2-035/L2-036.
test.describe('Manage sessions as staff', () => {
  test.use({ signedInAs: 'm-tom' });

  test('Given Tom, when he opens his account from the account menu, then his profile and two-step sign-in show', async ({ page }) => {
    const account = new AccountPage(page);
    await page.goto('/');

    await account.openFromAccountMenu();

    await expect(account.profile).toContainText('tom@harbourview.example');
    await expect(account.profile).toContainText('Admin · Harbourview Youth Collective');
    await expect(account.twoStep).toContainText('0 recovery codes left');
    await account.expectAccessible();
    await account.expectNoHorizontalScroll();
  });

  test('Given new recovery codes, when made, then ten show once and the count follows', async ({ page }) => {
    const account = new AccountPage(page);
    await account.open();

    await account.makeRecoveryCodes();

    await expect(account.codes).toHaveCount(10);
    await account.expectAccessible();
    await account.closeCodes();
    await expect(account.twoStep).toContainText('10 recovery codes left');
  });

  test('Given another device, when Tom signs out everywhere else, then it is confirmed and he stays here', async ({ page, api }) => {
    const account = new AccountPage(page);
    await account.open();

    await account.signOutEverywhereElse();

    await expect(account.toast).toContainText('Other devices are signed out');
    await expect(page.getByRole('heading', { level: 1, name: 'Your account' })).toBeVisible();
    expect(api.signedOutOthers).toBe(true);
  });
});
