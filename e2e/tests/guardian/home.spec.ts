import { test, expect } from '../../fixtures/test';
import { GuardianHomePage } from '../../pages/guardian-home.page';

// L2-013 criterion 12 enrollment status on the guardian home, L2-026 codes, L2-027 language, L2-005 Roster off, L2-035/L2-036 accessibility and phone layout.
test.describe('Track enrollment status as a guardian', () => {
  test.use({ signedInAs: null });

  test('Given Kevin accepted and Emily waitlisted, when Linh opens the link from the text and verifies, then each child shows where they stand', async ({ page, api }) => {
    api.decideEnrollment('p-winter', 'c-kevin', 'Accepted', 'Welcome! Camp starts at 8 am.');
    api.decideEnrollment('p-winter', 'c-emily', 'Waitlisted');
    const home = new GuardianHomePage(page);

    await home.open('tok-home-tran');
    await home.expectAccessible();
    await home.verify('905-555-0163', api.guardianCode);

    await expect(home.heading).toHaveText('Hi Linh');
    await expect(home.row('Kevin Tran', 'Winter Camp 2026')).toContainText('Enrolled');
    await expect(home.row('Kevin Tran', 'Winter Camp 2026')).toContainText('Welcome! Camp starts at 8 am.');
    await expect(home.row('Emily Tran', 'Winter Camp 2026')).toContainText('Waitlist #1');
    await expect(home.row('Emily Tran', 'Winter Camp 2026')).toContainText('We’ll text you first if a place opens.');
    await home.expectAccessible();
    await home.expectNoHorizontalScroll();
  });

  test('Given an enrollment waiting and one declined, when the home opens, then waiting says what happens next and declined shows the reason', async ({ page, api }) => {
    api.requestEnrollment('p-winter', 'c-kevin');
    api.decideEnrollment('p-winter', 'c-emily', 'Declined', 'Camp is for ages 6 to 12.');
    const home = new GuardianHomePage(page);
    await home.open('tok-home-tran');
    await home.verify('905-555-0163', api.guardianCode);

    await expect(home.row('Kevin Tran', 'Winter Camp 2026')).toContainText('Waiting for review');
    await expect(home.row('Emily Tran', 'Winter Camp 2026')).toContainText('Not enrolled: Camp is for ages 6 to 12.');
  });

  test('Given a Spanish-speaking household, when Carmen opens her home, then it is in Spanish', async ({ page, api }) => {
    api.decideEnrollment('p-winter', 'c-sofia', 'Waitlisted');
    const home = new GuardianHomePage(page);
    await home.open('tok-home-rivera');
    await home.verify('905-555-0142', api.guardianCode);

    await expect(home.heading).toHaveText('Hola, Carmen');
    await expect(home.row('Sofía Rivera', 'Winter Camp 2026')).toContainText('Lista de espera #1');
    expect(await home.language).toBe('es');
  });

  test('Given a household with nothing enrolled, when the home opens, then it says so', async ({ page, api }) => {
    api.unenrollHousehold('hh-tran');
    const home = new GuardianHomePage(page);
    await home.open('tok-home-tran');
    await home.verify('905-555-0163', api.guardianCode);

    await expect(home.text('No enrollments yet.')).toBeVisible();
  });

  test('Given an unknown link, when it opens, then it says the link has expired', async ({ page }) => {
    const home = new GuardianHomePage(page);

    await home.open('not-a-real-token');

    await expect(home.heading).toHaveText('This link has expired');
  });

  test('Given the Roster module is off, when the home opens, then it is not available', async ({ page, api }) => {
    api.setModules('org-harbourview', []);
    const home = new GuardianHomePage(page);

    await home.open('tok-home-tran');

    await expect(home.heading).toHaveText('This page isn’t available');
  });
});
