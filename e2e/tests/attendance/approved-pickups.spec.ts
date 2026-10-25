import { test, expect } from '../../fixtures/test';
import { QuickCardPage } from '../../pages/quick-card.page';

// L2-020 criteria 1, 2 and 5 approved pickups by staff, L2-007 roles, L2-035/L2-036 accessibility and phone layout.
test.describe('Manage approved pickups as a site lead', () => {
  test('Given Mateo’s Quick Card, when Jaylen adds Rosa for both children and removes her again, then the list follows', async ({ page }) => {
    const card = new QuickCardPage(page);
    await card.open('/quick-cards/c-mateo');
    await card.addPickupButton.click();
    await card.dialog.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(card.dialog).toContainText('Enter the adult’s full name.');
    await card.expectAccessible();
    await card.dialog.getByRole('button', { name: 'Cancel' }).click();

    await card.addPickup({ name: 'Rosa Alvarez', relationship: 'Aunt', siblings: true });
    await expect(card.pickups).toContainText('Rosa Alvarez');
    await card.expectAccessible();
    await card.expectNoHorizontalScroll();
    await card.removePickup('Rosa Alvarez');

    await expect(card.pickups).not.toContainText('Rosa Alvarez');
  });
});

test.describe('Approved pickups for youth workers', () => {
  test.use({ signedInAs: 'm-aisha' });

  test('Given an approved adult, when Aisha opens the Quick Card, then she sees them but cannot change the list', async ({ page, api }) => {
    api.approvePickup('c-mateo', 'Rosa Alvarez');
    const card = new QuickCardPage(page);

    await card.open('/quick-cards/c-mateo');

    await expect(card.pickups).toContainText('Rosa Alvarez');
    await expect(card.addPickupButton).toHaveCount(0);
    await expect(card.removeButton('Rosa Alvarez')).toHaveCount(0);
  });
});
