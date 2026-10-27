import { test, expect } from '../../fixtures/test';
import { GuardianConsentPage } from '../../pages/guardian-consent.page';

// Acceptance Test
// Traces to: L2-058 criteria 1, 2 and 7, L2-057 criterion 3, L2-027
// Description: a guardian withdraws consent from the consent link; the record stays and they can consent again.
test.describe('Withdraw guardian consent', () => {
  test.use({ signedInAs: null });

  test('Given Carmen consented, when she confirms Withdraw consent, then consent is withdrawn and the form is offered again', async ({ page, api }) => {
    api.giveConsent('c-sofia');
    const consent = new GuardianConsentPage(page);
    await consent.open('tok-consent-sofia');
    await consent.verify('905-555-0142', api.guardianCode);

    await page.getByRole('button', { name: 'Retirar el consentimiento' }).click();
    await expect(consent.dialog).toContainText('¿Retirar el consentimiento para Sofía?');
    await consent.expectAccessible();
    await consent.dialog.getByRole('button', { name: 'Retirar el consentimiento' }).click();
    await expect(consent.dialog).toBeHidden();

    await expect(consent.heading).toHaveText('Consentimiento retirado');
    await expect(consent.text('Sofía no puede usar Learning ahora')).toBeVisible();
    expect(api.consentOf('c-sofia')).toMatchObject({ withdrawnBy: 'Carmen Rivera' });
    await consent.expectAccessible();
  });

  test('Given Carmen withdrew, when she consents again from the same link, then consent is given again', async ({ page, api }) => {
    api.giveConsent('c-sofia');
    api.withdrawConsent('c-sofia');
    const consent = new GuardianConsentPage(page);
    await consent.open('tok-consent-sofia');
    await consent.verify('905-555-0142', api.guardianCode);
    await expect(consent.heading).toHaveText('Consentimiento retirado');

    await consent.consent('Madre o padre', 'Carmen Rivera');

    await expect(consent.heading).toHaveText('Consentimiento dado. Gracias, Carmen');
  });

  test('Given the withdraw dialog, when Carmen cancels, then consent stays given', async ({ page, api }) => {
    api.giveConsent('c-sofia');
    const consent = new GuardianConsentPage(page);
    await consent.open('tok-consent-sofia');
    await consent.verify('905-555-0142', api.guardianCode);

    await page.getByRole('button', { name: 'Retirar el consentimiento' }).click();
    await consent.dialog.getByRole('button', { name: 'Cancelar' }).click();

    await expect(consent.dialog).toBeHidden();
    await expect(consent.heading).toHaveText('Consentimiento ya dado');
    expect(api.consentOf('c-sofia')?.withdrawnAt).toBeNull();
  });
});
