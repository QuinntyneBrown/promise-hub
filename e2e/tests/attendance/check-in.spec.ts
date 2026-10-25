import { test, expect } from '../../fixtures/test';
import { CheckInPage } from '../../pages/check-in.page';
import { TodayPage } from '../../pages/today.page';

// L2-017 check-in, L2-007 roles, L2-005 Roll Call off, L2-035/L2-036 accessibility and phone layout.
test.describe('Check children in as a site lead', () => {
  test('Given tonight’s session, when Today opens, then it shows the session and opens check-in', async ({ page }) => {
    const today = new TodayPage(page);
    await today.open();

    await expect(today.session('Tutoring night')).toContainText('0 of 4 checked in');
    await today.expectAccessible();
    await today.session('Tutoring night').getByRole('link', { name: 'Open check-in' }).click();

    const checkIn = new CheckInPage(page);
    await expect(checkIn.heading).toHaveText('Tutoring night');
  });

  test('Given tonight’s roster, when a child is checked in, then the row and totals update and a toast confirms', async ({ page }) => {
    const checkIn = new CheckInPage(page);
    await checkIn.open();
    await expect(checkIn.heading).toHaveText('Tutoring night');
    expect(await checkIn.names()).toEqual(['Jordan Thompson', 'Mateo Rivera', 'Sofía Rivera', 'Yusuf Haddad']);
    await expect(checkIn.total('Not yet')).toHaveText('4');
    await checkIn.expectAccessible();
    await checkIn.expectNoHorizontalScroll();

    await checkIn.checkIn('Jordan Thompson');

    await expect(checkIn.row('Jordan Thompson')).toContainText('Checked in');
    await expect(checkIn.total('Checked in')).toHaveText('1');
    await expect(checkIn.total('Not yet')).toHaveText('3');
    await expect(page.getByTestId('toast').filter({ hasText: 'Jordan Thompson checked in' })).toContainText('1 of 4 now here');
  });

  test('Given the server fails, when a child is checked in, then the row goes back and the failure is named', async ({ page, api }) => {
    api.failNext('/api/sessions/e-tutoring-today/check-ins', 500);
    const checkIn = new CheckInPage(page);
    await checkIn.open();

    await checkIn.checkIn('Mateo Rivera');

    await expect(page.getByTestId('toast').filter({ hasText: 'Mateo Rivera was not checked in' })).toBeVisible();
    await expect(checkIn.row('Mateo Rivera')).toContainText('Not yet here');
    await expect(checkIn.total('Checked in')).toHaveText('0');
  });

  test('Given the check-in sheet, when Mark absent is chosen, then the child is absent', async ({ page }) => {
    const checkIn = new CheckInPage(page);
    await checkIn.open();
    await checkIn.openOptions('Yusuf Haddad');
    await checkIn.expectAccessible();
    await page.keyboard.press('Escape');

    await checkIn.markAbsent('Yusuf Haddad');

    await expect(checkIn.row('Yusuf Haddad')).toContainText('Absent');
    await expect(checkIn.total('Absent')).toHaveText('1');
    await checkIn.filter('Absent');
    await expect.poll(() => checkIn.names()).toEqual(['Yusuf Haddad']);
  });

  test('Given no one matches the search, when Add walk-in is chosen, then the walk-in joins tonight checked in', async ({ page }) => {
    const checkIn = new CheckInPage(page);
    await checkIn.open();

    await checkIn.search('petrov');
    await expect(page.getByRole('heading', { name: 'No “petrov” on tonight’s roster' })).toBeVisible();
    await page.getByRole('button', { name: 'Add walk-in' }).click();
    await expect(checkIn.dialog).toBeVisible();
    await checkIn.expectAccessible();
    await checkIn.dialog.getByRole('button', { name: 'Check in for tonight' }).click();
    await expect(page.getByTestId('childName-error')).toHaveText('Enter the child’s name.');
    await checkIn.addWalkIn({ childName: 'Nikolai Petrov', guardian: 'Elena Petrova · 289-555-0150' });

    await expect(checkIn.row('Nikolai Petrov')).toContainText('Walk-in');
    await expect(checkIn.row('Nikolai Petrov')).toContainText('Checked in');
    await expect(checkIn.total('Checked in')).toHaveText('1');
  });
});

test.describe('Check-in for other roles and organizations', () => {
  test.describe('Volunteer coordinator', () => {
    test.use({ signedInAs: 'm-priya-hyc' });

    test('Given a volunteer coordinator, when check-in opens, then the roster is read-only without medical flags', async ({ page }) => {
      const checkIn = new CheckInPage(page);
      await checkIn.open();
      await expect(checkIn.heading).toHaveText('Tutoring night');

      await expect(checkIn.roster.getByRole('button', { name: /^Check in/ })).toHaveCount(0);
      await expect(checkIn.roster.getByTestId('medical-flag')).toHaveCount(0);
    });
  });

  test.describe('No session today', () => {
    test.use({ signedInAs: 'm-grace' });

    test('Given no session today, when check-in opens, then it says so', async ({ page }) => {
      const checkIn = new CheckInPage(page);
      await checkIn.open();

      await expect(page.getByRole('heading', { name: 'No sessions today' })).toBeVisible();
      await checkIn.expectAccessible();
    });
  });

  test('Given Roll Call is off, when check-in is opened directly, then Today opens without a session card', async ({ page, api }) => {
    api.setModules('org-harbourview', ['Roster']);

    await page.goto('/check-in');

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Welcome, Jaylen');
    await expect(new TodayPage(page).session('Tutoring night')).toHaveCount(0);
  });
});
