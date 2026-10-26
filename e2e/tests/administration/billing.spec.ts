import { test, expect } from '../../fixtures/test';
import { BillingPage } from '../../pages/billing.page';

// L2-037 plans and metering, L2-022 SMS cap, L2-007 roles, L2-001 tenants, L2-035/L2-036.
test.describe('Manage billing as an admin', () => {
  test.use({ signedInAs: 'm-tom' });

  test('Given Harbourview on Standard, when Billing opens, then the plan and usage against its limits show', async ({ page, api }) => {
    api.setSmsUsed('org-harbourview', 1212);
    const billing = new BillingPage(page);

    await billing.open();

    await expect(billing.subtitle).toHaveText('Standard plan · $89/month');
    await expect(billing.meter('Active children')).toHaveAttribute('aria-valuenow', '6');
    await expect(billing.meter('Text segments this month')).toHaveAttribute('aria-valuenow', '1212');
    await billing.expectAccessible();
    await billing.expectNoHorizontalScroll();
  });

  test('Given an upgrade, when Plus is chosen, then the prorated charge is confirmed and the plan changes', async ({ page }) => {
    const billing = new BillingPage(page);
    await billing.open();

    await billing.changeTo('Plus');

    await expect(billing.toast).toContainText('$52.00 is added to this month’s invoice.');
    await expect(billing.subtitle).toHaveText('Plus plan · $149/month');
  });

  test('Given the current plan, when it is chosen again, then the dialog says so', async ({ page }) => {
    const billing = new BillingPage(page);
    await billing.open();

    await billing.changeTo('Standard');

    await expect(billing.dialog).toContainText('You’re already on Standard.');
    await billing.expectAccessible();
  });

  test('Given a failed payment, when Billing opens, then the grace period is explained', async ({ page, api }) => {
    api.failPayment('org-harbourview');
    const billing = new BillingPage(page);

    await billing.open();

    await expect(billing.alert('Payment didn’t go through')).toBeVisible();
  });

  test('Given the grace period has passed, when Billing opens, then it says the account is suspended', async ({ page, api }) => {
    api.failPayment('org-harbourview', '2026-10-01T12:00:00Z');
    const billing = new BillingPage(page);

    await billing.open();

    await expect(billing.alert('Your account is suspended')).toBeVisible();
  });
});

test.describe('Free plan', () => {
  test.use({ signedInAs: 'm-grace' });

  test('Given Northgate on Free, when Billing opens, then its limit of 50 children shows', async ({ page }) => {
    const billing = new BillingPage(page);

    await billing.open();

    await expect(billing.subtitle).toHaveText('Free plan · no charge');
    await expect(billing.meter('Active children')).toHaveAttribute('aria-valuemax', '50');
  });
});

test.describe('Program director', () => {
  test.use({ signedInAs: 'm-marisol' });

  test('Given a director, when Billing opens, then it says admins manage billing', async ({ page }) => {
    const billing = new BillingPage(page);

    await billing.open();

    await expect(billing.forbidden).toBeVisible();
  });
});
