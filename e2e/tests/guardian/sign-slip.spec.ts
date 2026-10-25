import { test, expect } from '../../fixtures/test';
import { GuardianSlipPage } from '../../pages/guardian-slip.page';

// L2-015 signing a slip, L2-026 guardian links and codes, L2-027 language, L2-005 Slips off, L2-035/L2-036 accessibility and phone layout.
test.describe('Sign a permission slip as a guardian', () => {
  test.use({ signedInAs: null });

  test.beforeEach(({ api }) => {
    api.sendSlip('e-rbg', 'We’re taking the After-School Tutoring group to the Royal Botanical Gardens.');
  });

  test('Given Carmen opens Mateo’s link on a new phone, when she verifies with the texted code, then the slip opens in Spanish with Mateo’s details', async ({ page, api }) => {
    const slip = new GuardianSlipPage(page);
    await slip.open('tok-mateo');
    expect(await slip.language).toBe('es');
    await slip.expectAccessible();

    await slip.identify('905-555-0142', 'Su número de celular o correo');
    await slip.enterCode(api.guardianCode, 'Código de seis dígitos');

    await expect(slip.heading).toHaveText('Autorización para Mateo');
    await expect(slip.text('Peanuts (anaphylaxis); tree nuts (hives)')).toBeVisible();
    await expect(slip.text('jueves 12 de noviembre')).toBeVisible();
    await expect(slip.footer).toContainText('905-555-0100');
    await slip.expectAccessible();
    await slip.expectNoHorizontalScroll();
  });

  test('Given a verified phone, when Dana signs with her typed name, then she gets a receipt and the link shows it signed', async ({ page, api }) => {
    api.trustGuardianDevice('hh-thompson');
    const slip = new GuardianSlipPage(page);
    await slip.open('tok-jordan');
    await expect(slip.heading).toHaveText('Permission slip for Jordan');
    expect(await slip.language).toBe('en');

    await slip.sign('dana thompson');

    await expect(slip.heading).toHaveText('Signed. Thank you, Dana');
    await slip.expectAccessible();
    await slip.open('tok-jordan');
    await expect(slip.heading).toHaveText('Already signed');
  });

  test('Given a name that is not one of the child’s guardians, when Sign is pressed, then it is refused inline', async ({ page, api }) => {
    api.trustGuardianDevice('hh-thompson');
    const slip = new GuardianSlipPage(page);
    await slip.open('tok-jordan');

    await slip.sign('');
    await expect(slip.fieldError('name')).toHaveText('Type your full name to sign.');
    await slip.sign('Carmen Rivera');

    await expect(slip.fieldError('name')).toHaveText('That name doesn’t match a guardian of Jordan.');
    await slip.expectAccessible();
  });

  test('Given Jordan can’t go, when Dana declines with a reason, then the slip shows it declined', async ({ page, api }) => {
    api.trustGuardianDevice('hh-thompson');
    const slip = new GuardianSlipPage(page);
    await slip.open('tok-jordan');

    await slip.decline('Family trip that weekend', 'Jordan');

    await expect(slip.heading).toHaveText('Jordan won’t go');
    await slip.expectAccessible();
  });

  test('Given three wrong codes, when another is tried, then the link is paused for 15 minutes', async ({ page }) => {
    const slip = new GuardianSlipPage(page);
    await slip.open('tok-jordan');
    await slip.identify('905-555-0117');

    for (const code of ['111111', '222222', '333333']) await slip.enterCode(code);
    await expect(slip.fieldError('code')).toHaveText('That code didn’t work. Check the latest text or email.');
    await slip.enterCode('444444');

    await expect(slip.text('Too many tries. Try again in 15 minutes.')).toBeVisible();
  });

  test('Given an old link, when it is opened, then it says so and offers the organization’s number', async ({ page }) => {
    const slip = new GuardianSlipPage(page);

    await slip.open('tok-expired');

    await expect(slip.heading).toHaveText('This link has expired');
    await expect(slip.callButton).toHaveAttribute('href', 'tel:905-555-0100');
    await slip.expectAccessible();
  });

  test('Given Permission slips is off, when a slip link is opened, then the page is not available', async ({ page, api }) => {
    api.trustGuardianDevice('hh-thompson');
    api.setModules('org-harbourview', ['Roster', 'RollCall', 'QuickCards']);
    const slip = new GuardianSlipPage(page);

    await slip.open('tok-jordan');

    await expect(slip.heading).toHaveText('This page isn’t available');
  });
});
