import { test, expect } from '../../fixtures/test';
import { EnrollmentRosterPage } from '../../pages/enrollment-roster.page';
import { TodayPage } from '../../pages/today.page';

// L2-013 criterion 4 review, L2-011 records, L2-007 roles, L2-005 Roster off, L2-035/L2-036 accessibility and phone layout.
test.describe('Review enrollments as an admin', () => {
  test.use({ signedInAs: 'm-tom' });

  test.beforeEach(({ api }) => {
    api.requestEnrollment('p-winter', 'c-kevin');
    api.requestEnrollment('p-winter', 'c-emily');
    api.requestEnrollment('p-winter', 'c-yusuf');
  });

  test('Given three children waiting, when the roster opens, then each waits with their family and the counts', async ({ page }) => {
    const roster = new EnrollmentRosterPage(page);

    await roster.open('p-winter');

    await expect(roster.heading).toHaveText('Roster · Winter Camp 2026');
    await expect(roster.subtitle).toContainText('3 waiting review');
    await expect(roster.list('Waiting review').getByRole('listitem')).toHaveCount(3);
    await expect(roster.row('Waiting review', 'Kevin Tran')).toContainText('Linh Tran');
    await roster.expectAccessible();
    await roster.expectNoHorizontalScroll();
  });

  test('Given Kevin waiting, when he is accepted with a note, then he moves to Enrolled and his guardian is texted', async ({ page }) => {
    const roster = new EnrollmentRosterPage(page);
    await roster.open('p-winter');

    await roster.review('Kevin Tran', 'Accept');
    await roster.expectAccessible();
    await roster.decide('Accept', 'Welcome! Camp starts at 8 am.');

    await expect(page.getByRole('status').filter({ hasText: 'Kevin Tran accepted' })).toContainText('Linh Tran is texted');
    await expect(roster.row('Waiting review', 'Kevin Tran')).toHaveCount(0);
    await roster.tab('Enrolled');
    await expect(roster.row('Enrolled', 'Kevin Tran')).toBeVisible();
  });

  test('Given Emily and Yusuf waiting, when one is waitlisted and the other declined, then the waitlist has a position and declining needs a reason', async ({ page }) => {
    const roster = new EnrollmentRosterPage(page);
    await roster.open('p-winter');

    await roster.review('Emily Tran', 'Waitlist');
    await roster.decide('Waitlist');
    await roster.review('Yusuf Haddad', 'Accept');
    await roster.decide('Decline', '');
    await expect(roster.dialog).toContainText('Write a reason the guardian will read.');
    await roster.decide('Decline', 'Camp is for ages 6 to 12.');

    await expect(roster.row('Waiting review', 'Yusuf Haddad')).toHaveCount(0);
    await roster.tab('Waitlist');
    await expect(roster.row('Waitlist', 'Emily Tran')).toContainText('#1');
  });

  test('Given two children selected, when they are accepted together, then both join the roster', async ({ page }) => {
    const roster = new EnrollmentRosterPage(page);
    await roster.open('p-winter');

    await roster.select('Kevin Tran');
    await roster.select('Emily Tran');
    await expect(roster.bulkBar).toContainText('2 selected');
    await roster.expectAccessible();
    await roster.bulk('Accept');

    await expect(roster.list('Waiting review').getByRole('listitem')).toHaveCount(1);
    await expect(roster.subtitle).toContainText('2 enrolled');
  });

  test('Given a full program, when a child is accepted, then the dialog says to waitlist instead', async ({ page, api }) => {
    api.fillProgram('p-winter');
    const roster = new EnrollmentRosterPage(page);
    await roster.open('p-winter');

    await roster.review('Kevin Tran', 'Accept');
    await roster.decide('Accept');

    await expect(roster.dialog).toContainText('Winter Camp 2026 is full (0 of 0). Waitlist instead.');
  });
});

test.describe('Review for other roles and modules', () => {
  test('Given a site lead, when the roster review opens, then it says who reviews enrollments', async ({ page }) => {
    const roster = new EnrollmentRosterPage(page);

    await roster.open('p-winter');

    await expect(roster.heading).toHaveText('Only admins and program directors review enrollments');
    await roster.expectAccessible();
  });

  test('Given the roster module is off, when the roster review is opened, then Today opens', async ({ page, api }) => {
    api.setModules('org-harbourview', []);

    await page.goto('/programs/p-winter/roster');

    await expect(page).toHaveURL(/\/$/);
    await expect(new TodayPage(page).heading).toBeVisible();
  });
});
