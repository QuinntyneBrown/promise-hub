import { test, expect } from '../../fixtures/test';
import { GuardianHomePage } from '../../pages/guardian-home.page';
import { QuickCardPage } from '../../pages/quick-card.page';

// L2-011 criterion 7 and L2-026 criterion 6: a verified guardian corrects contact, language and medical details.
test.describe('Update household details as a guardian', () => {
  test.use({ signedInAs: null });

  test('Given Linh verified her phone, when she adds an email and switches to French, then the page follows', async ({ page, api }) => {
    const home = new GuardianHomePage(page);
    await home.open('tok-home-tran');
    await home.verify('905-555-0163', api.guardianCode);
    await expect(home.details).toContainText('905-555-0163');
    await home.expectAccessible();

    await home.updateDetails({ email: 'not-an-email' });
    await expect(home.dialog).toContainText('Enter an email like name@example.com.');
    await home.expectAccessible();
    await home.dialog.getByRole('textbox', { name: /^Email/ }).fill('linh.tran@example.com');
    await home.dialog.getByRole('combobox').selectOption({ label: 'Français' });
    await home.dialog.getByRole('button', { name: 'Save' }).click();

    await expect(home.heading).toHaveText('Bonjour Linh');
    await expect(home.details).toContainText('linh.tran@example.com');
    expect(await home.language).toBe('fr');
  });

  test('Given a new allergy, when Linh updates Kevin’s medical details, then they are saved on the family page', async ({ page, api }) => {
    const home = new GuardianHomePage(page);
    await home.open('tok-home-tran');
    await home.verify('905-555-0163', api.guardianCode);

    await home.updateMedical('Kevin', 'Peanuts (hives)', 'Antihistamine as needed');

    await expect(page.getByRole('main').getByText('Peanuts (hives)')).toBeVisible();
  });

  test('Given Linh changes her mobile, when she saves, then the link stops working and asks for a new one', async ({ page, api }) => {
    const home = new GuardianHomePage(page);
    await home.open('tok-home-tran');
    await home.verify('905-555-0163', api.guardianCode);

    await home.updateDetails({ mobile: '905-555-0188' });

    await expect(home.heading).toHaveText('This link has expired');
  });
});

test.describe('Staff see the guardian’s medical update', () => {
  test('Given Carmen updated Mateo’s allergies on her page, when Jaylen opens his Quick Card, then it shows them', async ({ page, api }) => {
    api.guardianUpdatesMedical('tok-home-rivera', 'c-mateo', 'Peanuts (anaphylaxis); sesame', 'EpiPen 0.3 mg');
    const card = new QuickCardPage(page);

    await card.open('/quick-cards/c-mateo');

    await expect(card.medical).toContainText('sesame');
  });
});
