import { test, expect } from '../../fixtures/test';
import { EnrollmentRosterPage } from '../../pages/enrollment-roster.page';
import { TodayPage } from '../../pages/today.page';

// L2-013 criterion 13 moving waitlisted children in, L2-007 roles, L2-005 Roster off, L2-035/L2-036 accessibility and phone layout.
test.describe('Manage the waitlist as a program director', () => {
  test.use({ signedInAs: 'm-marisol' });

  test.beforeEach(({ api }) => {
    api.decideEnrollment('p-winter', 'c-kevin', 'Waitlisted');
    api.decideEnrollment('p-winter', 'c-emily', 'Waitlisted');
  });

  test('Given places free, when Kevin is moved in, then he is enrolled, his guardian is texted and Emily moves up', async ({ page }) => {
    const roster = new EnrollmentRosterPage(page);
    await roster.open('p-winter');
    await roster.tab('Waitlist');
    await expect(roster.row('Waitlist', 'Kevin Tran')).toContainText('#1');
    await roster.expectAccessible();
    await roster.expectNoHorizontalScroll();

    await roster.moveIn('Kevin Tran', 'A place opened.');

    await expect(page.getByRole('status').filter({ hasText: 'Kevin Tran moved in' })).toContainText('Linh Tran is texted');
    await roster.tab('Waitlist');
    await expect(roster.row('Waitlist', 'Emily Tran')).toContainText('#1');
    await expect(roster.row('Waitlist', 'Kevin Tran')).toHaveCount(0);
    await roster.tab('Enrolled');
    await expect(roster.row('Enrolled', 'Kevin Tran')).toBeVisible();
  });

  test('Given the program is full, when the waitlist opens, then moving in is disabled and says why', async ({ page, api }) => {
    api.fillProgram('p-winter');
    const roster = new EnrollmentRosterPage(page);
    await roster.open('p-winter');
    await roster.tab('Waitlist');

    await expect(roster.moveInButton('Kevin Tran')).toBeDisabled();
    await expect(roster.list('Waitlist')).toBeVisible();
    await expect(page.getByText('The program is full.')).toBeVisible();
  });

  test('Given the Roster module is off, when the roster is opened, then Today opens', async ({ page, api }) => {
    api.setModules('org-harbourview', []);

    await page.goto('/programs/p-winter/roster');

    await expect(new TodayPage(page).heading).toBeVisible();
  });
});
