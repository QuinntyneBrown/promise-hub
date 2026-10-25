import { test, expect } from '../../fixtures/test';
import { seededMfaCode, seededPassword } from '../../fixtures/seed';
import { ShellPage } from '../../pages/shell.page';
import { SignInPage } from '../../pages/sign-in.page';

// L2-006 staff sign-in, L2-007 (role in the account menu), L2-035 accessibility.
test.describe('Sign in', () => {
  test.use({ signedInAs: null });

  test('Given a signed-out site lead, when they open PromiseHub and sign in, then they land on Today', async ({ page }) => {
    const signIn = new SignInPage(page);
    await signIn.open('/');
    await signIn.expectShown();
    await expect(signIn.heading).toHaveText('Sign in to PromiseHub');
    await signIn.expectAccessible();

    await signIn.signIn('jaylen@harbourview.example', seededPassword);

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Welcome, Jaylen');
    await expect(page).toHaveURL(/\/$/);
  });

  test('Given a wrong password, when submitted, then one message explains it and only the password is cleared', async ({ page }) => {
    const signIn = new SignInPage(page);
    await signIn.open('/sign-in');

    await signIn.signIn('jaylen@harbourview.example', 'not-my-password');

    await expect(signIn.passwordError).toHaveText('That email and password don’t match. Try again or reset your password.');
    await expect(signIn.email).toHaveValue('jaylen@harbourview.example');
    await expect(signIn.password).toHaveValue('');
    await expect(signIn.password).toHaveAttribute('aria-invalid', 'true');
    await signIn.expectAccessible();
  });

  test('Given five failed attempts, when a sixth is made, then sign-in is paused and the button is disabled', async ({ page }) => {
    const signIn = new SignInPage(page);
    await signIn.open('/sign-in');
    for (let i = 0; i < 5; i++) {
      await signIn.signIn('priya@harbourview.example', `wrong-${i}`);
      await expect(signIn.passwordError).toBeVisible();
    }

    await signIn.signIn('priya@harbourview.example', seededPassword);

    await expect(signIn.alert).toBeVisible();
    await expect(signIn.submit).toBeDisabled();
    await signIn.expectAccessible();
  });

  test('Given Tom is an admin with MFA, when he signs in, then a six-digit code is required before Today', async ({ page }) => {
    const signIn = new SignInPage(page);
    await signIn.open('/sign-in');

    await signIn.signIn('tom@harbourview.example', seededPassword);
    await expect(signIn.heading).toHaveText('Enter your code');
    await signIn.expectAccessible();
    await signIn.enterCode(seededMfaCode);

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Welcome, Tom');
  });

  test('Given a wrong code, when submitted, then the code is refused and Tom stays on the code step', async ({ page }) => {
    const signIn = new SignInPage(page);
    await signIn.open('/sign-in');
    await signIn.signIn('tom@harbourview.example', seededPassword);

    await signIn.enterCode('000000');

    await expect(signIn.codeError).toHaveText('That code didn’t work. Check your app and try again.');
    await expect(signIn.heading).toHaveText('Enter your code');
  });

  test('Given a signed-out person opens a deep link, when they sign in, then they reach that page', async ({ page }) => {
    const signIn = new SignInPage(page);
    await signIn.open('/maintenance');
    await signIn.expectShown();

    await signIn.signIn('jaylen@harbourview.example', seededPassword);

    await expect(page).toHaveURL(/\/maintenance$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Back soon');
  });
});

test.describe('Session', () => {
  test('Given a session that expires, when the app next asks the server, then sign-in explains the timeout and returns to the page', async ({ page, api }) => {
    const shell = new ShellPage(page);
    await shell.open('/forbidden');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('You don’t have access to this');

    api.expireSession();
    await page.reload();

    const signIn = new SignInPage(page);
    await signIn.expectShown();
    await expect(signIn.heading).toHaveText('Your session timed out');
    await signIn.signIn('jaylen@harbourview.example', seededPassword);
    await expect(page).toHaveURL(/\/forbidden$/);
  });

  test('Given the account menu, when opened, then it names the person, role and organization and offers sign out', async ({ page }) => {
    const shell = new ShellPage(page);
    await shell.open('/');

    await shell.openAccountMenu();

    await expect(shell.accountMenu).toContainText('Jaylen Okafor');
    await expect(shell.accountMenu).toContainText('Site lead · Harbourview Youth Collective');
    await shell.expectAccessible();
  });

  test('Given a signed-in site lead, when they sign out, then sign-in shows and Today needs signing in again', async ({ page }) => {
    const shell = new ShellPage(page);
    await shell.open('/');

    await shell.signOut();

    const signIn = new SignInPage(page);
    await signIn.expectShown();
    await signIn.open('/');
    await signIn.expectShown();
  });
});
