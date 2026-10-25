import { test, expect } from '../../fixtures/test';
import { CheckInPage } from '../../pages/check-in.page';
import { GuardianHomePage } from '../../pages/guardian-home.page';

// L2-018 criterion 8 answering a no-show text on the guardian home, L2-026 codes, L2-035/L2-036 accessibility and phone layout.
test.describe('Respond to an absence alert as a guardian', () => {
  test.use({ signedInAs: null });

  test('Given Kevin and Emily were not checked in, when Linh opens the link and answers absent, then the roster shows it', async ({ page, api }) => {
    api.noShowAlert('e-tutoring-today', 'c-kevin');
    api.noShowAlert('e-tutoring-today', 'c-emily');
    const home = new GuardianHomePage(page);
    await home.open('tok-home-tran');
    await home.verify('905-555-0163', api.guardianCode);

    await expect(home.noShowAlert).toContainText('Emily and Kevin aren’t checked in at Tutoring night yet');
    await home.expectAccessible();
    await home.expectNoHorizontalScroll();
    await home.answer('Absent tonight');

    await expect(home.answered).toContainText('Staff can see');
    await expect(home.noShowAlert).toHaveCount(0);
  });

  test('Given the alert, when Linh answers on the way, then the site lead sees it on the roster', async ({ page, api }) => {
    api.noShowAlert('e-tutoring-today', 'c-kevin');
    const home = new GuardianHomePage(page);
    await home.open('tok-home-tran');
    await home.verify('905-555-0163', api.guardianCode);

    await home.answer('On the way');

    await expect(home.answered).toBeVisible();
  });
});

test.describe('The roster after a page answer', () => {
  test('Given Sofía’s family answered absent on the page, when Jaylen opens the roster, then her row says so', async ({ page, api }) => {
    api.noShowAlert('e-tutoring-today', 'c-sofia', 'Absent');
    const checkIn = new CheckInPage(page);

    await checkIn.open();

    await expect(checkIn.noShowNote('Sofía Rivera')).toHaveText(/^Absent · guardian replied/);
  });
});
