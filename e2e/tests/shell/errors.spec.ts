import { test, expect } from '../../fixtures/test';
import { ErrorPage } from '../../pages/error.page';

// Full-page errors from the components library's error page (L2-035, L2-036).
const pages = [
  { path: '/no-such-page', heading: 'We can’t find that page', action: 'Go to Today' },
  { path: '/forbidden', heading: 'You don’t have access to this', action: 'Go to Today' },
  { path: '/server-error', heading: 'Something went wrong on our side', action: 'Try again' },
  { path: '/offline', heading: 'You’re offline', action: 'Try again' },
  { path: '/maintenance', heading: 'Back soon', action: 'Try again' },
];

test.describe('Error pages', () => {
  for (const { path, heading, action } of pages) {
    test(`Given ${path}, when it opens, then it explains the problem and offers a way on`, async ({ page }) => {
      const errorPage = new ErrorPage(page);

      await errorPage.open(path);

      await expect(errorPage.heading).toHaveText(heading);
      await expect(errorPage.message).toBeVisible();
      await expect(errorPage.action(action)).toBeVisible();
      await errorPage.expectAccessible();
      await errorPage.expectNoHorizontalScroll();
    });
  }

  test('Given the API fails while loading the session, when Today opens, then the server error page is shown', async ({ page, api }) => {
    api.failNext('/api/me', 500);
    const errorPage = new ErrorPage(page);

    await errorPage.open('/');

    await expect(errorPage.heading).toHaveText('Something went wrong on our side');
  });

  test('Given the not-found page, when Go to Today is chosen, then Today opens', async ({ page }) => {
    const errorPage = new ErrorPage(page);
    await errorPage.open('/no-such-page');

    await errorPage.action('Go to Today').click();

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Welcome, Jaylen');
  });
});
