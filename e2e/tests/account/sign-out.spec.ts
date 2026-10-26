import { test, expect } from '../../fixtures/test';
import { CheckInPage } from '../../pages/check-in.page';
import { LearningPage } from '../../pages/learning.page';
import { ShellPage } from '../../pages/shell.page';
import { SignInPage } from '../../pages/sign-in.page';
import { SignedOutPage } from '../../pages/signed-out.page';

// Acceptance Test
// Traces to: L2-048, L2-049, L2-035
// Description: signing out on a shared device ends the session, shows the signed-out page and leaves none of the person's data on the device.
test.describe('Sign out on a shared device', () => {
  test.describe('as a youth', () => {
    test.use({ signedInAs: 'm-sofia' });

    test('Given Sofía on Learning, when she signs out, then the signed-out page shows and offers to sign in again', async ({ page }) => {
      const learning = new LearningPage(page);
      await learning.open();
      await learning.expectOpen();

      await new ShellPage(page).signOut();

      const signedOut = new SignedOutPage(page);
      await signedOut.expectShown();
      await signedOut.expectAccessible();
      await signedOut.expectNoHorizontalScroll();
      await signedOut.signInAgain();
      await new SignInPage(page).expectShown();
    });

    test('Given Sofía signed out, when anyone goes back, then sign-in shows instead of her lessons', async ({ page }) => {
      const learning = new LearningPage(page);
      await learning.open();
      await learning.expectOpen();
      await new ShellPage(page).signOut();
      await new SignedOutPage(page).expectShown();

      await page.goBack();

      await new SignInPage(page).expectShown();
      await expect(learning.emptyState).toBeHidden();
    });

    test('Given the sign-out request fails, when Sofía signs out, then the device still forgets her session', async ({ page, api }) => {
      const learning = new LearningPage(page);
      await learning.open();
      await learning.expectOpen();
      api.failNext('/api/auth/sign-out', 503);

      await new ShellPage(page).signOut();

      await new SignedOutPage(page).expectShown();
    });
  });

  test.describe('as a site lead with tonight’s roster saved for offline', () => {
    test('Given Jaylen opened check-in, when he signs out, then the saved rosters and Quick Cards are removed from the device', async ({ page }) => {
      const checkIn = new CheckInPage(page);
      await checkIn.open();
      await expect(checkIn.heading).toHaveText('Tutoring night');
      const shell = new ShellPage(page);
      expect((await shell.offlineKeys()).length).toBeGreaterThan(0);

      await shell.signOut();

      await new SignedOutPage(page).expectShown();
      expect(await shell.offlineKeys()).toEqual([]);
    });
  });
});
