import { test, expect } from '../../fixtures/test';
import { seededPassword } from '../../fixtures/seed';
import { AccountDeactivatedPage } from '../../pages/account-deactivated.page';
import { LearningPage } from '../../pages/learning.page';
import { SignInPage } from '../../pages/sign-in.page';

// Acceptance Test
// Traces to: L2-050, L2-006, L2-035
// Description: an account whose access was turned off shows the inactive state, only after the right password; a timed-out youth session shows the timed-out state and returns to the page.
test.describe('Account inactive', () => {
  test.describe('signing in', () => {
    test.use({ signedInAs: null });

    test('Given Nadia’s access was turned off, when she signs in with the right password, then the inactive page says who can restore it', async ({ page, api }) => {
      api.deactivate('nadia@harbourview.example');
      const signIn = new SignInPage(page);
      await signIn.open('/sign-in');

      await signIn.signIn('nadia@harbourview.example', seededPassword);

      const inactive = new AccountDeactivatedPage(page);
      await inactive.expectShown();
      await expect(page.getByText('ask your program director or admin')).toBeVisible();
      await inactive.expectAccessible();
      await inactive.expectNoHorizontalScroll();
      await inactive.backToSignIn();
      await signIn.expectShown();
    });

    test('Given Nadia’s access was turned off, when she signs in with a wrong password, then only the generic message shows', async ({ page, api }) => {
      api.deactivate('nadia@harbourview.example');
      const signIn = new SignInPage(page);
      await signIn.open('/sign-in');

      await signIn.signIn('nadia@harbourview.example', 'not-my-password');

      await expect(signIn.passwordError).toHaveText('That email and password don’t match. Try again or reset your password.');
    });
  });

  test.describe('while signed in', () => {
    test.use({ signedInAs: 'm-nadia' });

    test('Given Nadia is signed in, when her access is turned off, then her next page is the inactive page', async ({ page, api }) => {
      api.placeInProgram('c-nadia', 'p-tutoring');
      api.saveOnboarding('m-nadia', { step: 3, preferredName: 'Nadia', completed: true });
      const learning = new LearningPage(page);
      await learning.open();
      await learning.expectOpen();
      api.deactivate('nadia@harbourview.example');

      await page.reload();

      await new AccountDeactivatedPage(page).expectShown();
    });
  });
});

test.describe('Timed-out youth session', () => {
  test.use({ signedInAs: 'm-sofia' });

  test('Given Sofía’s session timed out, when Learning next asks the server, then sign-in explains the timeout and returns her to Learning', async ({ page, api }) => {
    const learning = new LearningPage(page);
    await learning.open();
    await learning.expectOpen();
    api.expireSession();

    await page.reload();

    const signIn = new SignInPage(page);
    await signIn.expectShown();
    await expect(signIn.heading).toHaveText('Your session timed out');
    await signIn.expectAccessible();
    await signIn.signIn('sofia@harbourview.example', seededPassword);
    await learning.expectOpen();
    await expect(page).toHaveURL(/\/learning$/);
  });
});
