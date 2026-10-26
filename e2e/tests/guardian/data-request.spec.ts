import { test, expect } from '../../fixtures/test';
import { GuardianHomePage } from '../../pages/guardian-home.page';
import { SettingsPrivacyPage } from '../../pages/settings-privacy.page';

// L2-030 criterion 4 guardian data requests, L2-026 verified links, L2-027 language, L2-035/L2-036.
test.describe('Request household data as a guardian', () => {
  test.use({ signedInAs: null });

  test('Given a verified family page, when Carmen asks for a copy, then it is received', async ({ page, api }) => {
    api.trustGuardianDevice('hh-rivera');
    const home = new GuardianHomePage(page);
    await home.open('tok-home-rivera');

    await home.askForData('Preguntar por sus datos', 'Una copia de nuestros datos', 'Enviar solicitud');

    await expect(home.text('Solicitud recibida. Le escribiremos en 30 días.')).toBeVisible();
    await home.expectAccessible();
  });

  test('Given no email, when the request is sent, then it asks for one', async ({ page, api }) => {
    api.trustGuardianDevice('hh-rivera');
    const home = new GuardianHomePage(page);
    await home.open('tok-home-rivera');

    await home.askForData('Preguntar por sus datos', 'Una copia de nuestros datos', 'Enviar solicitud', '');

    await expect(home.dialog).toContainText('Enter an email.');
  });
});

test.describe('Fulfil data requests as an admin', () => {
  test.use({ signedInAs: 'm-tom' });

  test('Given a request for a copy, when Tom sends it, then it is done and can be downloaded', async ({ page, api }) => {
    api.askedForData('hh-rivera', 'Export');
    const privacy = new SettingsPrivacyPage(page);
    await privacy.open();

    await privacy.fulfil('Rivera');

    await expect(privacy.toast).toContainText('Copy sent to carmen.rivera@example.com');
    await expect(privacy.request('Rivera').getByRole('link', { name: 'Download' })).toBeVisible();
    await privacy.expectAccessible();
  });

  test('Given a request to delete, when Tom deletes, then the household is gone', async ({ page, api }) => {
    api.askedForData('hh-tran', 'Delete');
    const privacy = new SettingsPrivacyPage(page);
    await privacy.open();

    await privacy.fulfil('Tran');

    await expect(privacy.toast).toContainText('Tran household deleted');
    await expect(privacy.request('Tran')).toContainText('done by Tom Nguyen');
  });
});
