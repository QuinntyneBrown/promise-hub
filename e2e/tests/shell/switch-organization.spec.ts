import { test, expect } from '../../fixtures/test';
import { FamiliesPage } from '../../pages/families.page';
import { ShellPage } from '../../pages/shell.page';
import { TodayPage } from '../../pages/today.page';

// L2-002 active organization and switching, L2-001 tenants, L2-035/L2-036.
test.describe('Switch organizations as a volunteer coordinator', () => {
  test.use({ signedInAs: 'm-priya-hyc' });

  test('Given Priya in two organizations, when Today opens, then the switcher shows Harbourview active and lists both', async ({ page }) => {
    const shell = new ShellPage(page);
    const today = new TodayPage(page);
    await today.open();

    await expect(shell.organizationSwitcher).toHaveAccessibleName('Organization: Harbourview Youth Collective. Switch organization');
    await shell.organizationSwitcher.click();

    await expect(shell.organizationMenu.getByRole('menuitemradio')).toHaveCount(2);
    await expect(shell.organizationMenu.getByRole('menuitemradio', { name: /Harbourview/ })).toHaveAttribute('aria-checked', 'true');
    await today.expectAccessible();
  });

  test('Given the switcher, when she picks Northgate, then the app reloads with Northgate’s data', async ({ page }) => {
    const shell = new ShellPage(page);
    const today = new TodayPage(page);
    const families = new FamiliesPage(page);
    await today.open();

    await shell.switchTo('Northgate');

    await expect(today.subtitle).toContainText('Northgate Community Church Kids');
    await families.open();
    expect(await families.householdNames()).toEqual(['Rivera']);
    await expect(families.row('Rivera')).toContainText('Ana Rivera');
  });

  test('Given her Harbourview membership is removed, when she opens the switcher, then only Northgate remains', async ({ page, api }) => {
    const shell = new ShellPage(page);
    const today = new TodayPage(page);
    await today.open();
    await shell.switchTo('Northgate');
    await expect(today.subtitle).toContainText('Northgate');
    api.removeMembership('m-priya-hyc');

    await page.reload();

    await expect(shell.organizationSwitcher).toHaveCount(0);
  });
});

test.describe('One organization', () => {
  test.use({ signedInAs: 'm-aisha' });

  test('Given Aisha belongs to one organization, when Today opens, then no switcher is shown', async ({ page }) => {
    const shell = new ShellPage(page);
    await new TodayPage(page).open();

    await expect(shell.organizationSwitcher).toHaveCount(0);
  });
});
