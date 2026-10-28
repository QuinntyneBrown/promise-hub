import { test, expect } from '../../fixtures/test';
import { AccountPage } from '../../pages/account.page';
import { NotificationPreferencesPage } from '../../pages/notification-preferences.page';

// Acceptance Test
// Traces to: L2-121, L2-111, L2-005
// Description: notification choices sit with the other personal settings; a module that is off has no choices and its kinds answer 404.
test.describe('Notification preferences from personal settings', () => {
  test.use({ signedInAs: 'm-sofia' });

  test('Given Your account, when Sofía chooses notifications, then her choices open with Your account in the breadcrumb', async ({ page }) => {
    const account = new AccountPage(page);
    const preferences = new NotificationPreferencesPage(page);
    await account.open();

    await account.chooseNotifications();

    await expect(preferences.heading).toBeVisible();
    await expect(preferences.breadcrumb.getByRole('link', { name: 'Your account' })).toBeVisible();
    await expect(preferences.choice('Messages')).toBeVisible();
    await preferences.expectAccessible();
  });

  test('Given Messages is off, then Messages and Announcements are not offered and saving either answers 404; Incidents answers 422', async ({ page, api }) => {
    api.setModules('org-harbourview', ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Incidents', 'Reports', 'Learning', 'Mentoring']);
    const preferences = new NotificationPreferencesPage(page);
    await preferences.open();

    await expect(preferences.choice('Grades and badges')).toBeVisible();
    await expect(preferences.choice('Messages')).toHaveCount(0);
    await expect(preferences.choice('Announcements')).toHaveCount(0);

    expect(await preferences.saveStatus('messages', false)).toBe(404);
    expect(await preferences.saveStatus('announcements', false)).toBe(404);
    expect(await preferences.saveStatus('incidents', false)).toBe(422);
    await preferences.expectAccessible();
  });
});

test.describe('Notification preferences at Northgate', () => {
  test.use({ signedInAs: 'm-samuel' });

  test('Given Samuel at Northgate, where Messages and Mentoring are off, then nothing is offered and saving messages answers 404', async ({ page }) => {
    const preferences = new NotificationPreferencesPage(page);
    await preferences.open();

    await expect(preferences.empty).toBeVisible();
    expect(await preferences.saveStatus('messages', false)).toBe(404);
  });
});
