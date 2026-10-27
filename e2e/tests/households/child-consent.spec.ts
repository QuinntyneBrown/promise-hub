import { test, expect } from '../../fixtures/test';
import { ChildPage } from '../../pages/child.page';

// Acceptance Test
// Traces to: L2-058 criteria 3 to 7, L2-056 criterion 3, L2-007, L2-001, L2-005
// Description: staff see a youth's guardian consent on the child record; admins and program directors send a consent link.
test.describe('Guardian consent on the child record', () => {
  test.use({ signedInAs: 'm-tom' });

  test('Given Sofía (12) has a youth account and no consent, when Tom sends the consent link, then the card says who got it', async ({ page, api }) => {
    const child = new ChildPage(page);
    await child.open('/families/hh-rivera/children/c-sofia');
    await expect(child.consent).toContainText('Needed before Sofía can use Learning');
    await expect(child.consent).toContainText('Needed');
    await child.expectAccessible();
    await child.expectNoHorizontalScroll();

    await child.sendConsentLink();

    await expect(child.toast).toContainText('Consent link sent');
    await expect(child.toast).toContainText('•••-•••-0142');
    await expect(child.consent).toContainText('Link sent');
    expect(api.consentLinksSent.has('c-sofia')).toBe(true);
  });

  test('Given Carmen consented, when Tom opens Sofía’s record, then the card names her, the relationship and the reference', async ({ page, api }) => {
    api.giveConsent('c-sofia');
    const child = new ChildPage(page);

    await child.open('/families/hh-rivera/children/c-sofia');

    await expect(child.consent).toContainText('Given by Carmen Rivera (Parent)');
    await expect(child.consent).toContainText('GC-4F7A2C');
    await expect(child.consent.getByRole('button', { name: 'Send consent link' })).toHaveCount(0);
  });

  test('Given Carmen withdrew, when Tom opens Sofía’s record, then the card says who withdrew and offers a new link', async ({ page, api }) => {
    api.giveConsent('c-sofia');
    api.withdrawConsent('c-sofia');
    const child = new ChildPage(page);

    await child.open('/families/hh-rivera/children/c-sofia');

    await expect(child.consent).toContainText('Withdrawn by Carmen Rivera');
    await expect(child.consent.getByRole('button', { name: 'Send consent link' })).toBeVisible();
  });

  test('Given Mateo has no youth account, when his record opens, then no consent card is rendered', async ({ page }) => {
    const child = new ChildPage(page);

    await child.open('/families/hh-rivera/children/c-mateo');

    await expect(child.heading).toHaveText('Mateo Rivera');
    await expect(child.medical).toBeVisible();
    await expect(child.consent).toHaveCount(0);
  });

  test('Given Roster is off, when the consent endpoints are called, then they answer 404', async ({ page, api }) => {
    const child = new ChildPage(page);
    await child.open('/families/hh-rivera/children/c-sofia');
    await expect(child.consent).toBeVisible();
    api.setModules('org-harbourview', []);

    expect(await child.consentApiStatus('c-sofia')).toBe(404);
  });
});

test.describe('A site lead on the child record', () => {
  test.use({ signedInAs: 'm-jaylen' });

  test('Given Jaylen, when Sofía’s record opens, then he reads the status but cannot send a link', async ({ page }) => {
    const child = new ChildPage(page);

    await child.open('/families/hh-rivera/children/c-sofia');

    await expect(child.consent).toContainText('Needed');
    await expect(child.consent.getByRole('button', { name: 'Send consent link' })).toHaveCount(0);
  });
});

test.describe('Another organization', () => {
  test.use({ signedInAs: 'm-grace' });

  test('Given Grace at Northgate, when she asks for Sofía’s consent, then the API answers 404', async ({ page }) => {
    const child = new ChildPage(page);
    await child.open('/');

    expect(await child.consentApiStatus('c-sofia')).toBe(404);
  });
});
