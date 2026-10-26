import { test, expect } from '../../fixtures/test';
import { seededPassword } from '../../fixtures/seed';
import { LearningPage } from '../../pages/learning.page';
import { ResetPasswordPage } from '../../pages/reset-password.page';
import { SignInPage } from '../../pages/sign-in.page';

// Acceptance Test
// Traces to: L2-047, L2-044, L2-035
// Description: five failures lock a youth's sign-in with the end time and the reset path; a reset ends the lock and lands on her home.
test.describe('Account lockout', () => {
  test.use({ signedInAs: null });

  test('Given Sofía failed five times, when she tries again with the right password, then the locked state names the time and offers a reset', async ({ page }) => {
    const signIn = new SignInPage(page);
    await signIn.open('/sign-in');
    for (let i = 0; i < 5; i++) {
      await signIn.signIn('sofia@harbourview.example', `wrong-${i}`);
      await expect(signIn.passwordError).toBeVisible();
    }

    await signIn.signIn('sofia@harbourview.example', seededPassword);

    await expect(signIn.alert).toContainText('Sign-in paused until');
    await expect(signIn.submit).toBeDisabled();
    await signIn.expectAccessible();
    await signIn.resetFromLock();
    await expect(new ResetPasswordPage(page).heading).toHaveText('Reset your password');
  });

  test('Given a locked youth, when she chooses a new password from the emailed link, then she lands on Learning signed in', async ({ page, api }) => {
    api.lock('sofia@harbourview.example');
    const reset = new ResetPasswordPage(page);

    await reset.openLink('tok-reset-sofia');
    await reset.choose('harbour-lantern-2027');

    await new LearningPage(page).expectOpen();
    await expect(page).toHaveURL(/\/learning$/);
    expect(api.isLocked('sofia@harbourview.example')).toBe(false);
  });
});
