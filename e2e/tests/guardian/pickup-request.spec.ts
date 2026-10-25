import { test, expect } from '../../fixtures/test';
import { GuardianHomePage } from '../../pages/guardian-home.page';

// L2-020 criterion 7 the guardian approves or refuses an exceptional pickup, L2-026 codes, L2-027 language, L2-035 accessibility.
test.describe('Confirm an exceptional pickup as a guardian', () => {
  test.use({ signedInAs: null });

  test('Given someone is waiting to collect Emily, when Linh opens the link and approves, then the request is answered', async ({ page, api }) => {
    api.waitingPickup('e-tutoring-today', 'c-emily', 'Mai Tran');
    const home = new GuardianHomePage(page);
    await home.open('tok-home-tran');
    await home.verify('905-555-0163', api.guardianCode);

    await expect(home.pickupRequest).toContainText('Mai Tran is waiting to collect Emily');
    await home.expectAccessible();
    await home.decidePickup(true);

    await expect(home.pickupRequest).toHaveCount(0);
    await expect(page.getByRole('main').getByRole('status').filter({ hasText: 'Staff can see your answer' })).toBeVisible();
  });
});
