import { test, expect } from '../../fixtures/test';
import { SettingsModulesPage } from '../../pages/settings-modules.page';
import { ShellPage } from '../../pages/shell.page';

// L2-004 module configuration, L2-005 modules that are off are unreachable, L2-038 navigation.
test.describe('Settings › Modules', () => {
  test.use({ signedInAs: 'm-tom' });

  test('Given an admin, when Settings › Modules opens, then every module is listed with the whole suite on', async ({ page }) => {
    const modules = new SettingsModulesPage(page);

    await modules.open();

    expect(await modules.moduleNames()).toEqual([
      'Roster',
      'Permission slips',
      'Roll Call',
      'Quick Cards',
      'Pickup',
      'Messages',
      'Incident log',
      'Reports',
    ]);
    await expect(modules.summary).toHaveText('8 of 8 modules on');
    await expect(modules.toggle('Reports')).toBeChecked();
    await modules.expectAccessible();
    await modules.expectNoHorizontalScroll();
  });

  test('Given the whole suite, when every module but Roll Call is turned off and saved, then two stay on and navigation shrinks', async ({ page }) => {
    const modules = new SettingsModulesPage(page);
    const shell = new ShellPage(page);
    await modules.open();

    for (const name of ['Permission slips', 'Quick Cards', 'Pickup', 'Messages', 'Incident log', 'Reports']) {
      await modules.set(name, false);
    }
    await modules.save();

    await expect(modules.toast).toContainText('Modules saved');
    await expect(modules.toast).toContainText('2 on');
    await expect(modules.summary).toHaveText('2 of 8 modules on');
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Welcome, Tom');
    expect(await shell.visibleNavigationLabels()).toEqual(['Today', 'Check-in', 'Families', 'More']);
  });

  test('Given Roll Call is off, when Pickup is turned on and saved, then the save is rejected with the reason beside Pickup', async ({ page }) => {
    const modules = new SettingsModulesPage(page);
    await modules.open();

    await modules.set('Roll Call', false);
    await modules.save();

    await expect(modules.error('Pickup')).toHaveText('Pickup needs Roll Call.');
    await expect(modules.toast).toBeHidden();
    await modules.expectAccessible();
  });

  test('Given the Just check-in preset, when chosen, then Roster, Roll Call and Quick Cards are on and the rest off', async ({ page }) => {
    const modules = new SettingsModulesPage(page);
    await modules.open();

    await modules.preset('Just check-in');

    await expect(modules.toggle('Roster')).toBeChecked();
    await expect(modules.toggle('Roll Call')).toBeChecked();
    await expect(modules.toggle('Quick Cards')).toBeChecked();
    await expect(modules.toggle('Permission slips')).not.toBeChecked();
    await expect(modules.toggle('Reports')).not.toBeChecked();
    await expect(modules.summary).toHaveText('3 of 8 modules on');
  });
});

test.describe('Modules for other roles and organizations', () => {
  test('Given a site lead, when they open Settings › Modules, then they see who configures modules', async ({ page }) => {
    const modules = new SettingsModulesPage(page);

    await modules.open();

    await expect(modules.forbidden).toBeVisible();
    await expect(modules.list).toBeHidden();
    await modules.expectAccessible();
  });

  test.describe('Northgate runs check-in only', () => {
    test.use({ signedInAs: 'm-priya-ngk' });

    test('Given only Roster, Roll Call and Quick Cards are on, then navigation shows only their sections', async ({ page }) => {
      const shell = new ShellPage(page);
      await shell.open('/');
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Welcome, Priya');

      expect(await shell.visibleNavigationLabels()).toEqual(['Today', 'Check-in', 'Families', 'More']);
      await shell.openMenu();
      const menu = await shell.menuLabels();
      expect(menu).not.toContain('Permission slips');
      expect(menu).not.toContain('Messages');
      expect(menu).not.toContain('Incidents');
      expect(menu).not.toContain('Reports');
      expect(menu).toContain('Settings');
    });

    for (const path of ['/slips', '/messages', '/reports', '/incidents', '/events']) {
      test(`Given its module is off, when ${path} is opened directly, then Today opens instead`, async ({ page }) => {
        await page.goto(path);

        await expect(page).toHaveURL(/\/$/);
        await expect(page.getByRole('heading', { level: 1 })).toHaveText('Welcome, Priya');
      });
    }
  });
});
