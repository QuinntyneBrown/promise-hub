import { test, expect } from '../../fixtures/test';
import { ApplicationPage } from '../../pages/application.page';

// Acceptance Test
// Traces to: L2-072 (reviewing and placing applicants) criteria 6, 7 and 10; L2-013 waitlist and decline, L2-035 accessibility.
test.describe('Waitlist or decline an applicant', () => {
  test.use({ signedInAs: 'm-tom' });

  test('Given Zoe’s referral, when Tom waitlists her, then she is next on the waitlist and can still be placed or declined', async ({ page, api }) => {
    const id = api.referZoe('p-tutoring');
    const application = new ApplicationPage(page);
    await application.open(id);

    await application.action('Waitlist').click();
    await expect(application.dialog.getByRole('radio', { name: /^Accept/ })).toHaveCount(0);
    await application.expectAccessible();
    await application.dialog.getByRole('button', { name: 'Cancel' }).click();
    await application.decide('Waitlist');

    await expect(page.getByRole('status').filter({ hasText: 'Zoe Campbell waitlisted' })).toBeVisible();
    await expect(application.fact('status')).toContainText('Waitlisted, #1');
    await expect(application.action('Waitlist')).toHaveCount(0);
    await expect(application.action('Place')).toBeVisible();
    await expect(application.action('Decline')).toBeVisible();
  });

  test('Given Zoe’s referral, when Tom declines without a reason and then with one, then the reason is required and the application is read only with what Tanya read', async ({ page, api }) => {
    const id = api.referZoe('p-tutoring');
    const application = new ApplicationPage(page);
    await application.open(id);

    await application.decide('Decline', '');
    await expect(application.dialog).toContainText('Write a reason the guardian will read.');
    await application.dialog.getByRole('textbox').fill('Tutoring is full this term; we’ll call you in January.');
    await application.dialog.getByRole('button', { name: /^Decline and text / }).click();

    await expect(application.outcome).toContainText('Declined');
    await expect(application.outcome).toContainText('Tanya Campbell read: “Tutoring is full this term; we’ll call you in January.”');
    await expect(application.action('Place')).toHaveCount(0);
    await expect(application.action('Decline')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Add note' })).toBeVisible();
    await application.expectAccessible();
  });
});
