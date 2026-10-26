import { test, expect } from '../../fixtures/test';
import { CheckInPage } from '../../pages/check-in.page';

// L2-020 criterion 7 confirming an exceptional pickup with the guardian, L2-023 refusal logged, L2-035/L2-036 accessibility.
test.describe('Confirm an exceptional pickup as a site lead', () => {
  test('Given Rosa is not on Mateo’s list, when Jaylen asks Carmen by text and she approves, then Mateo can go with Rosa', async ({ page, api }) => {
    const checkIn = new CheckInPage(page);
    await checkIn.open();
    await checkIn.checkIn('Mateo Rivera');
    await checkIn.openSignOut('Mateo Rivera');

    await checkIn.askGuardian('Rosa Alvarez');
    await expect(checkIn.guardianAnswer).toContainText('Waiting for Carmen Rivera');
    await checkIn.expectAccessible();
    api.guardianDecides(true);

    await expect(checkIn.guardianAnswer).toContainText('Carmen Rivera approved Rosa Alvarez');
    await checkIn.confirmSignOut();
    await expect(page.getByRole('status').filter({ hasText: 'Mateo Rivera signed out' })).toBeVisible();
  });

  test('Given Carmen refuses, when her answer arrives, then Mateo stays, sign-out is off and the refusal is logged', async ({ page, api }) => {
    const checkIn = new CheckInPage(page);
    await checkIn.open();
    await checkIn.checkIn('Mateo Rivera');
    await checkIn.openSignOut('Mateo Rivera');
    await checkIn.askGuardian('Unknown man');

    api.guardianDecides(false);

    await expect(checkIn.guardianAnswer).toContainText('Carmen Rivera refused');
    await expect(checkIn.guardianAnswer).toContainText('logged as an incident');
    await expect(checkIn.signOutConfirm).toBeDisabled();
    await checkIn.expectAccessible();
  });
});
