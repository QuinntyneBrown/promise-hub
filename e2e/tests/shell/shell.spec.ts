import { test, expect } from '../../fixtures/test';
import { ShellPage } from '../../pages/shell.page';
import { TodayPage } from '../../pages/today.page';

// L2-038 shell navigation and overflow, L2-029 every staff flow on a phone, L2-035 accessibility.
test.describe('Shell', () => {
  test('Given a signed-in site lead, when Today opens, then primary navigation shows the core sections', async ({ page }) => {
    const shell = new ShellPage(page);
    await new TodayPage(page).open();

    const labels = await shell.visibleNavigationLabels();

    expect(labels.slice(0, 4)).toEqual(['Today', 'Check-in', 'Families', 'Events']);
    expect(labels).toContain('More');
    expect(labels).not.toContain('Incidents');
    expect(labels).not.toContain('Settings');
    await shell.expectNoHorizontalScroll();
  });

  test('Given the More menu, when opened, then it lists every section plus Settings, Notifications and the account, and closes on Escape', async ({ page }) => {
    const shell = new ShellPage(page);
    await new TodayPage(page).open();

    await shell.openMenu();

    const labels = await shell.menuLabels();
    expect(labels).toEqual(expect.arrayContaining(['Today', 'Check-in', 'Families', 'Events', 'Incidents', 'Settings', 'Notifications', 'Your account']));
    expect(await shell.menuIdentity()).toBe('Jaylen Okafor Site lead · Harbourview Youth Collective');
    await shell.expectAccessible();
    await shell.closeMenuWithEscape();
  });

  test('Given a signed-in site lead, then the account button names them', async ({ page }) => {
    const shell = new ShellPage(page);
    await new TodayPage(page).open();

    expect(await shell.accountButtonName()).toBe('Account menu for Jaylen Okafor');
  });

  test('Given a keyboard user, when they use the skip link, then focus moves to the main content', async ({ page }) => {
    const shell = new ShellPage(page);
    await new TodayPage(page).open();

    await shell.skipToContent();

    await shell.expectMainFocused();
  });
});

test.describe('Shell for a person in two organizations', () => {
  test.use({ signedInAs: 'm-priya-ngk' });

  test('Given Priya signed in to Northgate, then the menu shows Northgate, never Harbourview', async ({ page }) => {
    const shell = new ShellPage(page);
    await new TodayPage(page).open();

    await shell.openMenu();

    expect(await shell.menuIdentity()).toBe('Priya Raman Volunteer coordinator · Northgate Community Church Kids');
  });
});
