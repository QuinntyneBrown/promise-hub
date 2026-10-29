import { test, expect } from '../../fixtures/test';
import type { ModuleId } from '../../fixtures/seed';
import { SiteGetInvolvedPage } from '../../pages/site-get-involved.page';

// Acceptance Test
// Traces to: L2-134 criteria 3 and 4, L2-132 criterion 5
// Description: Give monthly opens a dialog for $20, $50 or $100 a month with a name and an email; continuing starts a checkout with the
// payment provider and offers Open secure payment in a new tab; without a provider it says online giving isn’t available yet.
const SUITE: ModuleId[] = ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports'];

test.describe('Public website: give monthly', () => {
  test.use({ signedInAs: null });

  test.beforeEach(({ api }) => {
    api.setModules('org-harbourview', [...SUITE, 'PublicWebsite']);
  });

  test('Given Give monthly, when Dana chooses $50 and continues, then her pledge is saved and Open secure payment hands over to the provider', async ({
    page,
    api,
  }) => {
    const involved = new SiteGetInvolvedPage(page);
    await involved.open();

    await involved.openDonation();
    await expect(involved.dialog).toBeVisible();
    await involved.expectAccessible();
    await involved.fillDonation({ amount: '$50', name: 'Dana Thompson', email: 'dana.t@example.com' });
    await involved.continueToPayment();

    await expect(involved.dialogText('You’re giving $50 a month.')).toBeVisible();
    await expect(involved.openPayment).toHaveAttribute('href', 'https://checkout.example/pay/chk_001');
    await expect(involved.openPayment).toHaveAttribute('target', '_blank');
    expect(api.websiteRequests('org-harbourview', 'donation')).toEqual([
      expect.objectContaining({ email: 'dana.t@example.com', monthlyAmount: 50, providerReference: 'chk_001' }),
    ]);
    await involved.expectAccessible();
  });

  test('Given no amount and no name, then the dialog shows the errors with a summary and no checkout starts', async ({ page, api }) => {
    const involved = new SiteGetInvolvedPage(page);
    await involved.open();
    await involved.openDonation();

    await involved.fillDonation({ name: '', email: 'dana.t@example.com' });
    await involved.continueToPayment();

    await expect(involved.dialogText('Fix these to continue')).toBeVisible();
    await expect(involved.dialogText('Choose a monthly amount.').last()).toBeVisible();
    await expect(involved.dialogError('don-name')).toHaveText('Enter your name.');
    expect(api.websiteRequests('org-harbourview', 'donation')).toEqual([]);
  });

  test('Given the organization has no payment provider, then the dialog says online giving isn’t available yet and nothing is saved', async ({
    page,
    api,
  }) => {
    api.setPaymentProvider(false);
    const involved = new SiteGetInvolvedPage(page);
    await involved.open();
    await involved.openDonation();

    await involved.fillDonation({ amount: '$20', name: 'Dana Thompson', email: 'dana.t@example.com' });
    await involved.continueToPayment();

    await expect(involved.dialogText('Online giving isn’t available yet')).toBeVisible();
    expect(api.websiteRequests('org-harbourview', 'donation')).toEqual([]);
  });

  test('Given starting the payment fails, then nothing is charged and her choice is kept', async ({ page, api }) => {
    api.failNext('/api/website/harbourview/donations', 500);
    const involved = new SiteGetInvolvedPage(page);
    await involved.open();
    await involved.openDonation();

    await involved.fillDonation({ amount: '$100', name: 'Dana Thompson', email: 'dana.t@example.com' });
    await involved.continueToPayment();

    await expect(involved.dialogText('We couldn’t start your payment')).toBeVisible();
    await expect(involved.dialog.getByRole('radio', { name: /^\$100 a month/ })).toBeChecked();
  });
});
