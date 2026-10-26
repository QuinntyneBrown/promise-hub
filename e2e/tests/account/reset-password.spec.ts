import { test, expect } from '../../fixtures/test';
import { ResetPasswordPage } from '../../pages/reset-password.page';

// L2-044 recovering account access, L2-035/L2-036.
test.describe('Recover account access', () => {
  test.use({ signedInAs: null });

  test('Given a forgotten password, when Jaylen asks from sign in, then he is told a link is on its way', async ({ page, api }) => {
    const reset = new ResetPasswordPage(page);
    await page.goto('/sign-in');

    await page.getByRole('link', { name: 'Forgot your password?' }).click();
    await reset.askForLink('jaylen@harbourview.example');

    await expect(reset.heading).toHaveText('Check your email');
    expect(api.resetRequestedFor).toBe('jaylen@harbourview.example');
    await reset.expectAccessible();
  });

  test('Given not an email, when asked, then it says to enter the work email', async ({ page }) => {
    const reset = new ResetPasswordPage(page);
    await page.goto('/forgot-password');

    await reset.askForLink('jaylen');

    await expect(reset.fieldError('email')).toHaveText('Enter your work email.');
  });

  test('Given a valid link, when a good password is chosen, then he lands on Today signed in', async ({ page }) => {
    const reset = new ResetPasswordPage(page);
    await reset.openLink('tok-reset-jaylen');

    await expect(reset.heading).toHaveText('Choose a new password');
    await reset.expectAccessible();
    await reset.choose('harbour-lantern-2027');

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Welcome, Jaylen');
  });

  test('Given a short password that does not match, when submitted, then each field says why', async ({ page }) => {
    const reset = new ResetPasswordPage(page);
    await reset.openLink('tok-reset-jaylen');

    await reset.choose('short', 'other');

    await expect(reset.fieldError('password')).toHaveText('Use at least 12 characters.');
    await expect(reset.fieldError('repeat')).toHaveText('The two passwords don’t match.');
  });

  test('Given an expired link, when opened, then it offers a new one', async ({ page, api }) => {
    api.expireReset('tok-reset-jaylen');
    const reset = new ResetPasswordPage(page);

    await reset.openLink('tok-reset-jaylen');

    await expect(reset.heading).toHaveText('This link has expired');
    await expect(page.getByRole('link', { name: 'Send a new link' })).toBeVisible();
  });
});
