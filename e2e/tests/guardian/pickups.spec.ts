import { test, expect } from '../../fixtures/test';
import { GuardianHomePage } from '../../pages/guardian-home.page';

// L2-020 criterion 5 a guardian manages approved pickups on the family page, L2-026 codes, L2-027 language, L2-035 accessibility.
test.describe('Manage approved pickups as a guardian', () => {
  test.use({ signedInAs: null });

  test('Given Linh verified her phone, when she adds her sister for Kevin and removes her again, then the family page lists her and then not', async ({ page, api }) => {
    const home = new GuardianHomePage(page);
    await home.open('tok-home-tran');
    await home.verify('905-555-0163', api.guardianCode);

    await home.addPickup('Kevin', 'Mai Tran', 'Aunt');
    await expect(home.pickups('Kevin')).toContainText('Mai Tran');
    await home.expectAccessible();
    await home.removePickup('Mai Tran');

    await expect(home.pickups('Kevin')).not.toContainText('Mai Tran');
  });
});
