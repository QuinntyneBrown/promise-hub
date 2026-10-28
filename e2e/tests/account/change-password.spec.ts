import { test, expect } from '../../fixtures/test';
import { seededPassword } from '../../fixtures/seed';
import { AccountPage } from '../../pages/account.page';

// Acceptance Test
// Traces to: L2-118, L2-053, L2-035
// Description: anyone signed in changes their password from Your account by proving the current one; other devices are signed out and
// this one stays; a wrong current password, the policy, the repeat and a failed save are each said where they apply.
const NEW = 'lanterns over the harbour';

test.describe('Change your password', () => {
  test('Given Jaylen on Your account, when he changes his password, then the dialog closes and the toast says other devices were signed out', async ({ page, api }) => {
    const account = new AccountPage(page);
    await account.open();
    await page.getByRole('button', { name: 'Change password' }).click();
    await expect(account.dialog.getByRole('heading', { name: 'Change your password' })).toBeVisible();
    await expect(account.dialog.getByLabel('Current password')).toHaveAttribute('autocomplete', 'current-password');
    await expect(account.dialog.getByLabel('New password')).toHaveAttribute('autocomplete', 'new-password');
    await expect(account.dialog.getByText('At least 12 characters, and not your email.')).toBeVisible();
    await account.expectAccessible();
    await account.dialog.getByRole('button', { name: 'Cancel' }).click();

    await account.changePassword(seededPassword, NEW);

    await expect(account.dialog).toBeHidden();
    await expect(account.toast).toContainText('Password changed');
    await expect(account.toast).toContainText('Your other devices were signed out.');
    expect(api.passwordOf('jaylen@harbourview.example')).toBe(NEW);
    expect(api.signedOutOthers).toBe(true);
    await account.expectAccessible();
  });

  test('Given a wrong current password and a repeat that differs, when Jaylen saves, then each field says so and nothing changes', async ({ page, api }) => {
    const account = new AccountPage(page);
    await account.open();

    await account.changePassword('not my password', NEW);
    await expect(account.passwordError('current')).toHaveText('That isn’t your current password.');

    await account.dialog.getByLabel('Current password').fill(seededPassword);
    await account.dialog.getByLabel('New password').fill('jaylen at the harbour');
    await account.dialog.getByLabel('Repeat it').fill('jaylen at the bay');
    await account.dialog.getByRole('button', { name: 'Change password' }).click();

    await expect(account.passwordError('password')).toHaveText('Don’t use your email in your password.');
    await expect(account.passwordError('repeat')).toHaveText('The two passwords don’t match.');
    expect(api.passwordOf('jaylen@harbourview.example')).toBe(seededPassword);
    await account.expectAccessible();
  });

  test('Given the change fails, then the dialog keeps the fields and says the password is unchanged', async ({ page, api }) => {
    const account = new AccountPage(page);
    await account.open();
    api.failNext('/api/me/password', 500);

    await account.changePassword(seededPassword, NEW);

    await expect(account.passwordFailed).toContainText('Your password is unchanged. Try again.');
    await expect(account.dialog.getByLabel('New password')).toHaveValue(NEW);
  });

  test.describe('as a youth on a phone', () => {
    test.use({ signedInAs: 'm-sofia', viewport: { width: 360, height: 800 } });

    test('Given Sofía, when she changes her own password, then it is changed and nothing scrolls sideways', async ({ page, api }) => {
      const account = new AccountPage(page);
      await account.open();
      await account.expectNoHorizontalScroll();

      await account.changePassword(seededPassword, NEW);

      await expect(account.toast).toContainText('Password changed');
      expect(api.passwordOf('sofia@harbourview.example')).toBe(NEW);
    });
  });
});
