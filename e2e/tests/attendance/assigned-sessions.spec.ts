import { test, expect } from '../../fixtures/test';
import { CheckInPage } from '../../pages/check-in.page';
import { TodayPage } from '../../pages/today.page';

// L2-007 criterion 6 youth workers run only assigned sessions, L2-017 check-in and sign-out, L2-005 Roll Call off, L2-035 accessibility.
test.describe('Record attendance as a youth worker', () => {
  test.use({ signedInAs: 'm-aisha' });

  test('Given a second session tonight she is not on, when Aisha opens Today, then only her session is listed', async ({ page, api }) => {
    api.addSessionTonight('Homework club');
    const today = new TodayPage(page);

    await today.open();

    await expect(today.session('Tutoring night')).toBeVisible();
    await expect(today.session('Homework club')).toHaveCount(0);
    await today.expectAccessible();
  });

  test('Given her session, when she checks Mateo in and signs him out, then it works as for a site lead', async ({ page }) => {
    const checkIn = new CheckInPage(page);
    await checkIn.open();
    await expect(checkIn.heading).toHaveText('Tutoring night');

    await checkIn.checkIn('Mateo Rivera');
    await expect(checkIn.row('Mateo Rivera')).toContainText('Checked in');
    await checkIn.openSignOut('Mateo Rivera');
    await checkIn.pickUpBy('Carmen Rivera');
    await checkIn.confirmSignOut();

    await expect(checkIn.row('Mateo Rivera')).toContainText('Signed out');
    await checkIn.expectAccessible();
  });

  test('Given a session she is not assigned to, when she opens it directly, then she sees she has no access and whom to ask', async ({ page }) => {
    const checkIn = new CheckInPage(page);

    await checkIn.open('/check-in/e-tutoring-yesterday');

    await expect(checkIn.heading).toHaveText('You’re not on this session');
    await expect(checkIn.forbiddenText).toContainText('Ask a site lead to add you');
    await expect(checkIn.roster).toHaveCount(0);
    await checkIn.expectAccessible();
    await checkIn.expectNoHorizontalScroll();
  });

  test('Given Roll Call is off, when check-in is opened directly, then Today opens', async ({ page, api }) => {
    api.setModules('org-harbourview', ['Roster']);

    await page.goto('/check-in');

    await expect(page).toHaveURL(/\/$/);
    await expect(new TodayPage(page).session('Tutoring night')).toHaveCount(0);
  });
});

test.describe('Sessions for a site lead', () => {
  test('Given a second session tonight with no staff, when Jaylen opens check-in, then he can switch to it', async ({ page, api }) => {
    api.addSessionTonight('Homework club');
    const checkIn = new CheckInPage(page);

    await checkIn.open();

    await expect(checkIn.otherSession('Homework club')).toBeVisible();
  });
});
