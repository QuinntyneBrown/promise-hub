import { test, expect } from '../../fixtures/test';
import { GuardianConsentPage } from '../../pages/guardian-consent.page';

// Acceptance Test
// Traces to: L2-055, L2-058 criterion 1, L2-026, L2-027, L2-005
// Description: A guardian verifies a consent link and consents for a youth with a typed signature, in the household's language.
test.describe('Give guardian consent', () => {
  test.use({ signedInAs: null });

  test('Given Sofía’s consent link, when Carmen verifies her phone, then the consent shows in Spanish with the wording to sign', async ({ page, api }) => {
    const consent = new GuardianConsentPage(page);
    await consent.open('tok-consent-sofia');

    await consent.verify('905-555-0142', api.guardianCode);

    await expect(consent.heading).toHaveText('Consentimiento para Sofía');
    expect(await consent.language).toBe('es');
    await expect(consent.wording).toContainText('I consent to my child taking part in lessons, mentoring and program activities at Harbourview Youth Collective');
    await expect(consent.text('El texto en inglés es el que firma.')).toBeVisible();
    await consent.expectAccessible();
    await consent.expectNoHorizontalScroll();
  });

  test('Given the consent, when Carmen chooses Madre o padre, ticks the box and types her name, then consent is given with a reference', async ({ page, api }) => {
    const consent = new GuardianConsentPage(page);
    await consent.open('tok-consent-sofia');
    await consent.verify('905-555-0142', api.guardianCode);

    await consent.consent('Madre o padre', 'carmen rivera');

    await expect(consent.heading).toHaveText('Consentimiento dado. Gracias, Carmen');
    await expect(consent.record).toContainText('Carmen Rivera');
    await expect(consent.record).toContainText('GC-4F7A2C');
    expect(api.consentOf('c-sofia')).toMatchObject({ signedBy: 'Carmen Rivera', relationship: 'Parent' });
    await consent.expectAccessible();
  });

  test('Given an unticked box and a name that is no guardian of Sofía, when sent, then each field says why and nothing is recorded', async ({ page, api }) => {
    const consent = new GuardianConsentPage(page);
    await consent.open('tok-consent-sofia');
    await consent.verify('905-555-0142', api.guardianCode);

    await consent.consent('Madre o padre', 'Luis Rivera', false);

    await expect(consent.fieldError('agree')).toHaveText('Tick the box to give consent.');
    await expect(consent.fieldError('name')).toHaveText('That name doesn’t match a guardian of Sofía.');
    expect(api.consentOf('c-sofia')).toBeNull();
    await consent.expectAccessible();
  });

  test('Given Carmen already consented, when she opens the link again, then the record shows read-only', async ({ page, api }) => {
    api.giveConsent('c-sofia');
    const consent = new GuardianConsentPage(page);
    await consent.open('tok-consent-sofia');
    await consent.verify('905-555-0142', api.guardianCode);

    await expect(consent.heading).toHaveText('Consentimiento ya dado');
    await expect(consent.record).toContainText('Carmen Rivera');
    await expect(consent.record).toContainText('Madre o padre');
  });

  test('Given a link over 30 days old, when Carmen opens it, then it has expired and offers a call', async ({ page }) => {
    const consent = new GuardianConsentPage(page);

    await consent.open('tok-consent-expired');

    await expect(consent.heading).toHaveText('This link has expired');
    await expect(consent.callButton).toBeVisible();
    await consent.expectAccessible();
  });

  test('Given Roster is off for Harbourview, when the link is opened, then the page is not available', async ({ page, api }) => {
    api.setModules('org-harbourview', []);
    const consent = new GuardianConsentPage(page);

    await consent.open('tok-consent-sofia');

    await expect(consent.heading).toHaveText(/isn’t available|no está disponible/);
  });
});
