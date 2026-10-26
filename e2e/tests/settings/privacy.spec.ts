import { test, expect } from '../../fixtures/test';
import { SettingsPrivacyPage } from '../../pages/settings-privacy.page';

// L2-030 privacy settings and data residency, L2-007 roles, L2-001 tenants, L2-035/L2-036.
test.describe('Configure privacy as an admin', () => {
  test.use({ signedInAs: 'm-tom' });

  test('Given Harbourview, when Privacy opens, then the region and the 7-year retention show', async ({ page }) => {
    const privacy = new SettingsPrivacyPage(page);

    await privacy.open();

    await expect(privacy.region).toContainText('Canada (Toronto region)');
    await expect(privacy.retention('7 years after the event')).toBeChecked();
    await privacy.expectAccessible();
    await privacy.expectNoHorizontalScroll();
  });

  test('Given 3 years chosen, when saved, then it stays after reload', async ({ page }) => {
    const privacy = new SettingsPrivacyPage(page);
    await privacy.open();

    await privacy.retention('3 years after the event').check();
    await privacy.save();

    await expect(privacy.toast).toContainText('Retention saved');
    await privacy.open();
    await expect(privacy.retention('3 years after the event')).toBeChecked();
  });

  test('Given the settings fail to load, when Privacy opens, then it offers to try again', async ({ page, api }) => {
    api.failNext('/api/settings/privacy', 500);
    const privacy = new SettingsPrivacyPage(page);

    await privacy.open();

    await expect(privacy.loadError).toBeVisible();
  });
});

test.describe('Site lead', () => {
  test.use({ signedInAs: 'm-jaylen' });

  test('Given a site lead, when Privacy opens, then it says admins set privacy', async ({ page }) => {
    const privacy = new SettingsPrivacyPage(page);

    await privacy.open();

    await expect(privacy.forbidden).toBeVisible();
  });
});

test.describe('Another organization', () => {
  test.use({ signedInAs: 'm-grace' });

  test('Given Northgate, when Privacy opens, then its own retention shows', async ({ page }) => {
    const privacy = new SettingsPrivacyPage(page);

    await privacy.open();

    await expect(privacy.retention('7 years after the event')).toBeChecked();
  });
});
