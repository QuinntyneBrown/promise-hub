import { test, expect } from '../../fixtures/test';
import { SettingsNotificationsPage } from '../../pages/settings-notifications.page';

// L2-040 criterion 6 notification settings, L2-007 roles, L2-001 tenants, L2-035/L2-036 accessibility and layout.
test.describe('Configure notifications as an admin', () => {
  test.use({ signedInAs: 'm-tom' });

  test('Given a new organization, when the page opens, then the defaults show with this month’s texts', async ({ page, api }) => {
    api.setSmsUsed('org-harbourview', 1212);
    const settings = new SettingsNotificationsPage(page);

    await settings.open();

    await expect(settings.delay).toHaveValue('15');
    await expect(settings.supervisorEmails).toBeChecked();
    await expect(settings.cap).toHaveValue('2000');
    await expect(settings.used).toContainText('Used: 1,212');
    await settings.expectAccessible();
    await settings.expectNoHorizontalScroll();
  });

  test('Given new values, when saved, then they stay after reload', async ({ page }) => {
    const settings = new SettingsNotificationsPage(page);
    await settings.open();

    await settings.delay.fill('10');
    await settings.supervisorEmails.click();
    await settings.cap.fill('1500');
    await settings.save();

    await expect(settings.toast).toContainText('Notification settings saved');
    await settings.open();
    await expect(settings.delay).toHaveValue('10');
    await expect(settings.supervisorEmails).not.toBeChecked();
    await expect(settings.cap).toHaveValue('1500');
  });

  test('Given a delay out of range and a cap below what is used, when saved, then each is named', async ({ page, api }) => {
    api.setSmsUsed('org-harbourview', 1212);
    const settings = new SettingsNotificationsPage(page);
    await settings.open();

    await settings.delay.fill('2');
    await settings.cap.fill('1000');
    await settings.save();

    await expect(settings.errorSummary).toContainText('Choose between 5 and 60 minutes.');
    await expect(settings.errorSummary).toContainText('Can’t be below 1,212, already used this month.');
    await settings.expectAccessible();
  });

  test('Given the settings fail to load, when the page opens, then it offers to try again', async ({ page, api }) => {
    api.failNext('/api/settings/notifications', 500);
    const settings = new SettingsNotificationsPage(page);

    await settings.open();

    await expect(settings.loadError).toBeVisible();
  });
});

test.describe('Site lead', () => {
  test.use({ signedInAs: 'm-jaylen' });

  test('Given a site lead, when the page opens, then it says who configures notifications', async ({ page }) => {
    const settings = new SettingsNotificationsPage(page);

    await settings.open();

    await expect(settings.forbidden).toBeVisible();
  });
});

test.describe('Another organization', () => {
  test.use({ signedInAs: 'm-grace' });

  test('Given Harbourview changed its delay, when Grace opens hers, then she sees her own defaults', async ({ page }) => {
    const settings = new SettingsNotificationsPage(page);

    await settings.open();

    await expect(settings.delay).toHaveValue('15');
    await expect(settings.cap).toHaveValue('200');
  });
});
