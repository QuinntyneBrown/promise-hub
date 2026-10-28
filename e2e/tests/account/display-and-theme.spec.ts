import { test, expect } from '../../fixtures/test';
import { AccountPage } from '../../pages/account.page';
import { DisplayPage } from '../../pages/display.page';
import { ShellPage } from '../../pages/shell.page';
import { SignedOutPage } from '../../pages/signed-out.page';

// Acceptance Test
// Traces to: L2-119, L2-120, L2-035, L2-036
// Description: each person chooses System, Light or Dark, a text size and reduce motion on Display; the choice previews at once,
// is saved with the account, applies after a reload and on the next sign-in, and leaves with sign-out.
test.describe('Choose how the app looks', () => {
  test('Given Jaylen on Your account, when he picks Larger text and Reduce motion and saves, then every page follows, also after a reload', async ({ page, api }) => {
    const account = new AccountPage(page);
    const display = new DisplayPage(page);
    await account.open();
    await expect(account.display).toContainText('System theme · Default text · Motion on');
    await account.changeDisplay();

    await expect(display.theme('System')).toBeChecked();
    await expect(display.textSize('Default')).toBeChecked();
    await expect(display.reduceMotion).not.toBeChecked();
    await display.expectAccessible();
    const before = await display.rootFontSize();

    await display.textSize('Larger').check();
    await display.reduceMotion.check();

    await expect(display.root).toHaveAttribute('data-text-size', 'larger');
    await expect(display.root).toHaveAttribute('data-motion', 'reduce');
    expect(await display.rootFontSize()).toBeCloseTo(before * 1.25, 0);
    await display.expectNoHorizontalScroll();
    await display.save();
    await expect(display.saved).toBeVisible();
    expect(api.displayOf('jaylen@harbourview.example')).toEqual({ theme: 'system', textSize: 'larger', reduceMotion: true });

    await account.open();
    await expect(display.root).toHaveAttribute('data-text-size', 'larger');
    await expect(account.display).toContainText('System theme · Larger text · Motion reduced');
  });

  test('Given Jaylen previews Large text, when he leaves without saving, then the saved choice applies again', async ({ page, api }) => {
    const display = new DisplayPage(page);
    await display.open();

    await display.textSize('Large').check();
    await expect(display.root).toHaveAttribute('data-text-size', 'large');
    await display.cancel();

    await expect(page).toHaveURL(/\/account$/);
    await expect(display.root).not.toHaveAttribute('data-text-size', /.*/);
    expect(api.displayOf('jaylen@harbourview.example').textSize).toBe('default');
  });

  test('Given the save fails, then the choice stays previewed and the page says nothing was saved', async ({ page, api }) => {
    const display = new DisplayPage(page);
    await display.open();
    api.failNext('/api/me/display', 500);

    await display.theme('Dark').check();
    await display.save();

    await expect(display.failed).toContainText('Your display settings weren’t saved. Try again.');
    await expect(display.root).toHaveAttribute('data-theme', 'dark');
    await display.expectAccessible();
  });

  test.describe('as a youth whose device prefers light', () => {
    test.use({ signedInAs: 'm-sofia', colorScheme: 'light' });

    test('Given Sofía picks Dark, Light and System, then the app follows at once; saved Dark stays dark on her next visit; signed out follows the device', async ({ page, api }) => {
      const display = new DisplayPage(page);
      await display.open();

      await display.theme('Dark').check();
      await expect(display.root).toHaveAttribute('data-theme', 'dark');
      await display.expectAccessible();
      await display.theme('Light').check();
      await expect(display.root).toHaveAttribute('data-theme', 'light');
      await display.theme('System').check();
      await expect(display.root).not.toHaveAttribute('data-theme', /.*/);

      await display.theme('Dark').check();
      await display.save();
      await expect(display.saved).toBeVisible();
      expect(api.displayOf('sofia@harbourview.example').theme).toBe('dark');

      await page.reload();
      await expect(display.heading).toBeVisible();
      await expect(display.root).toHaveAttribute('data-theme', 'dark');
      await expect(display.theme('Dark')).toBeChecked();

      await new ShellPage(page).signOut();
      await new SignedOutPage(page).expectShown();
      await expect(display.root).not.toHaveAttribute('data-theme', /.*/);
    });
  });

  test.describe('on a phone', () => {
    test.use({ signedInAs: 'm-daniel', viewport: { width: 360, height: 800 } });

    test('Given Daniel on a phone, then all three themes are visible and nothing scrolls sideways, with Larger text too', async ({ page }) => {
      const display = new DisplayPage(page);
      await display.open();

      for (const name of ['System', 'Light', 'Dark'] as const) await expect(display.theme(name)).toBeVisible();
      await display.textSize('Larger').check();

      await display.expectNoHorizontalScroll();
      await display.expectAccessible();
    });
  });
});
