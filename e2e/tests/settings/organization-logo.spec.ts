import { test, expect } from '../../fixtures/test';
import { SettingsOrganizationPage } from '../../pages/settings-organization.page';

// Acceptance Test
// Traces to: L2-123 criteria 1 to 5, L2-031, L2-032, L2-035
// Description: An admin uploads, replaces and removes the organization's logo from the Profile card; a file that is not a PNG or JPEG is refused.
const png = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0x0d, 0x49, 0x48, 0x44, 0x52, 0, 0, 0, 1,
  0, 0, 0, 1, 8, 6, 0, 0, 0, 0x1f, 0x15, 0xc4, 0x89,
]);
const pdf = Buffer.from('%PDF-1.7 harbourview flyer');

test.describe('Configure the organization logo', () => {
  test.use({ signedInAs: 'm-tom' });

  test('Given no logo, when Tom chooses a PNG, then the card shows it with a toast and the upload is audited', async ({
    page,
    api,
  }) => {
    const settings = new SettingsOrganizationPage(page);
    await settings.open();
    await expect(settings.logoDropZone).toBeVisible();
    await expect(settings.logoImage).toHaveCount(0);
    await settings.expectAccessible();

    await settings.chooseLogo('harbourview-logo.png', 'image/png', png);

    await expect(settings.toast).toContainText('Logo saved');
    await expect(settings.logoImage).toHaveAttribute('alt', 'Harbourview Youth Collective logo');
    await expect(settings.card('Profile')).toContainText('harbourview-logo.png');
    await expect(settings.card('Profile')).toContainText('Uploaded Thu 5 Nov by Tom Nguyen');
    expect(api.auditOf('OrganizationLogo').at(-1)?.action).toBe('Created');
    await settings.expectAccessible();
  });

  test('Given a PDF chosen as the logo, then it is refused with what to choose instead and nothing changes', async ({
    page,
  }) => {
    const settings = new SettingsOrganizationPage(page);
    await settings.open();

    await settings.chooseLogo('harbourview-flyer.pdf', 'application/pdf', pdf);

    await expect(settings.logoError).toHaveText(
      '“harbourview-flyer.pdf” wasn’t uploaded. Choose a PNG or JPEG of up to 1 MB.',
    );
    await expect(settings.logoImage).toHaveCount(0);
    await settings.expectAccessible();
  });

  test('Given a logo, when Tom removes it, then the initials come back and the removal is audited', async ({
    page,
    api,
  }) => {
    const settings = new SettingsOrganizationPage(page);
    await settings.open();
    await settings.chooseLogo('harbourview-logo.png', 'image/png', png);
    await expect(settings.logoImage).toBeVisible();

    await settings.removeLogo();

    await expect(settings.toast).toContainText('Logo removed');
    await expect(settings.logoImage).toHaveCount(0);
    await expect(settings.logoDropZone).toBeVisible();
    expect(api.auditOf('OrganizationLogo').at(-1)?.action).toBe('Deleted');
  });

  test('Given the upload fails, then the card says so and the logo is unchanged', async ({
    page,
    api,
  }) => {
    const settings = new SettingsOrganizationPage(page);
    await settings.open();
    api.failNext('/api/settings/organization/logo', 500);

    await settings.chooseLogo('harbourview-logo.png', 'image/png', png);

    await expect(settings.logoFailed).toBeVisible();
    await expect(settings.logoImage).toHaveCount(0);
  });
});
