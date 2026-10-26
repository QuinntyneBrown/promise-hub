import { test, expect } from '../../fixtures/test';
import type { ModuleId } from '../../fixtures/seed';
import { MentoringPage } from '../../pages/mentoring.page';
import { ShellPage } from '../../pages/shell.page';
import { TodayPage } from '../../pages/today.page';

// L2-005 criteria 6 and 8, L2-007 criterion 10: Mentoring opens only while its module is on; a mentor sees only assigned youth.
const SUITE: ModuleId[] = ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports'];

test.describe('Mentoring', () => {
  test.use({ signedInAs: 'm-daniel' });

  test('Given Mentoring is on, when Daniel follows Mentoring, then it says no youth are assigned yet', async ({ page, api }) => {
    api.setModules('org-harbourview', [...SUITE, 'Mentoring']);
    const mentoring = new MentoringPage(page);
    await new TodayPage(page).open();

    await new ShellPage(page).primaryNavigation.getByRole('link', { name: 'Mentoring' }).click();

    await mentoring.expectOpen();
    await expect(mentoring.emptyState).toBeVisible();
    await mentoring.expectAccessible();
  });

  test('Given Mentoring is off, when /mentoring is opened directly, then Today opens and the API answers 404', async ({ page, api }) => {
    api.setModules('org-harbourview', SUITE);
    const mentoring = new MentoringPage(page);

    await mentoring.open();

    await expect(page).toHaveURL(/\/$/);
    expect(await mentoring.apiStatus()).toBe(404);
  });
});

test.describe('Mentoring in another organization', () => {
  test.use({ signedInAs: 'm-samuel' });

  test('Given Mentoring is on for Harbourview only, when Samuel at Northgate calls it, then the API answers 404', async ({ page, api }) => {
    api.setModules('org-harbourview', [...SUITE, 'Mentoring']);
    const mentoring = new MentoringPage(page);
    await new TodayPage(page).open();

    expect(await mentoring.apiStatus()).toBe(404);
  });
});
