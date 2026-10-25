import { test, expect } from '../../fixtures/test';
import { CheckInPage } from '../../pages/check-in.page';
import { SignOnTabletPage } from '../../pages/sign-on-tablet.page';
import { SlipEditorPage } from '../../pages/slip-editor.page';
import { TodayPage } from '../../pages/today.page';

// L2-016 reminders and day-of status, L2-007 roles, L2-005 Slips off, L2-035/L2-036 accessibility and phone layout.
test.describe('Resolve missing slips as a site lead', () => {
  test.beforeEach(({ api }) => {
    api.sendSlip('e-rbg');
    api.answerSlip('e-rbg', 'c-mateo', 'Signed');
    api.answerSlip('e-rbg', 'c-jordan', 'Declined', 'Dana Thompson');
  });

  test('Given the trip’s slip with two still missing, when check-in opens, then the missing children come first with the counts', async ({ page }) => {
    const checkIn = new CheckInPage(page);

    await checkIn.open('/check-in/e-rbg');

    await expect(checkIn.clearanceTotal('Cleared')).toHaveText('1');
    await expect(checkIn.clearanceTotal('Missing slip')).toHaveText('2');
    await expect(checkIn.clearanceTotal('Declined')).toHaveText('1');
    await expect(checkIn.clearanceWarning).toBeVisible();
    expect((await checkIn.names()).slice(0, 2)).toEqual(['Sofía Rivera', 'Yusuf Haddad']);
    await expect(checkIn.row('Sofía Rivera')).toContainText('Slip missing');
    await checkIn.expectAccessible();
    await checkIn.expectNoHorizontalScroll();
  });

  test('Given Carmen at the bus door, when she signs on the tablet, then Sofía is cleared at once', async ({ page }) => {
    const checkIn = new CheckInPage(page);
    await checkIn.open('/check-in/e-rbg');

    await checkIn.signOnTablet('Sofía Rivera').click();
    const tablet = new SignOnTabletPage(page);
    await tablet.expectShown();
    await expect(tablet.handTo).toContainText('Hand the tablet to Carmen Rivera');
    await tablet.expectAccessible();
    await tablet.sign('Linh Tran');
    await expect(tablet.nameError).toHaveText('That name doesn’t match a guardian of this family.');
    await tablet.sign('Carmen Rivera');

    await expect(page.getByRole('status').filter({ hasText: 'Sofía is cleared' })).toBeVisible();
    await expect(checkIn.clearanceTotal('Cleared')).toHaveText('2');
    await expect(checkIn.row('Sofía Rivera')).toContainText('Cleared');
  });

  test.describe('as a program director', () => {
    test.use({ signedInAs: 'm-marisol' });

    test('Given two families still to sign, when a reminder is sent, then the unreachable family is flagged and the link placeholder is required', async ({ page, api }) => {
      api.makeUnreachable('hh-haddad');
      const slip = new SlipEditorPage(page);
      await slip.open('e-rbg');

      await slip.openReminder();
      await expect(slip.reminderFamily('Rivera')).toContainText('Sofía');
      await expect(slip.reminderFamily('Haddad')).toContainText('Can’t reach');
      await slip.expectAccessible();
      await slip.remind('Reminder: sign {child}’s slip.');
      await expect(slip.dialog).toContainText('Keep {link} in the message.');
      await slip.remind('Reminder: sign {child}’s slip: {link}');

      await expect(page.getByRole('status').filter({ hasText: 'Reminder sent' })).toContainText('1 family');
    });
  });
});

test.describe('Day-of for other roles and modules', () => {
  test.describe('as a volunteer coordinator', () => {
    test.use({ signedInAs: 'm-priya-hyc' });

    test('Given the trip’s check-in, when she opens it, then she sees the counts but cannot sign on the tablet', async ({ page, api }) => {
      api.sendSlip('e-rbg');
      const checkIn = new CheckInPage(page);

      await checkIn.open('/check-in/e-rbg');

      await expect(checkIn.clearanceTotal('Missing slip')).toHaveText('4');
      await expect(checkIn.signOnTablet('Sofía Rivera')).toHaveCount(0);
    });
  });

  test('Given Permission slips is off, when the trip’s check-in opens, then there are no slip counts and the tablet page redirects to Today', async ({ page, api }) => {
    api.sendSlip('e-rbg');
    api.setModules('org-harbourview', ['Roster', 'RollCall', 'QuickCards']);
    const checkIn = new CheckInPage(page);

    await checkIn.open('/check-in/e-rbg');
    await expect(checkIn.heading).toHaveText('Fall field trip: Royal Botanical Gardens');
    await expect(checkIn.clearanceWarning).toHaveCount(0);

    await page.goto('/check-in/e-rbg/sign-on-tablet/hh-rivera');
    await expect(page).toHaveURL(/\/$/);
    await expect(new TodayPage(page).heading).toBeVisible();
  });
});
