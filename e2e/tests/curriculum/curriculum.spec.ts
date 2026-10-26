import { test, expect } from '../../fixtures/test';
import type { ModuleId } from '../../fixtures/seed';
import { CurriculumPage } from '../../pages/curriculum.page';
import { ShellPage } from '../../pages/shell.page';
import { TodayPage } from '../../pages/today.page';

// L2-005 criteria 6 and 8, L2-007 criterion 12: Curriculum follows Learning and opens for authors only.
const SUITE: ModuleId[] = ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports'];

test.describe('Curriculum', () => {
  test.use({ signedInAs: 'm-marisol' });

  test('Given Learning is on, when Marisol opens Curriculum from More, then it says no tracks are written yet', async ({ page, api }) => {
    api.setModules('org-harbourview', [...SUITE, 'Learning']);
    const curriculum = new CurriculumPage(page);
    const shell = new ShellPage(page);
    await new TodayPage(page).open();

    await shell.openMenu();
    await shell.goToFromMenu('Curriculum');

    await curriculum.expectOpen();
    await expect(curriculum.emptyState).toBeVisible();
    await curriculum.expectAccessible();
  });

  test('Given Learning is off, when /curriculum is opened directly, then Today opens and the API answers 404', async ({ page, api }) => {
    api.setModules('org-harbourview', SUITE);
    const curriculum = new CurriculumPage(page);

    await curriculum.open();

    await expect(page).toHaveURL(/\/$/);
    expect(await curriculum.apiStatus()).toBe(404);
  });
});

test.describe('Curriculum for a site lead', () => {
  test('Given Learning is on, when a site lead opens /curriculum, then the API refuses them', async ({ page, api }) => {
    api.setModules('org-harbourview', [...SUITE, 'Learning']);
    const curriculum = new CurriculumPage(page);
    await new TodayPage(page).open();

    expect(await curriculum.apiStatus()).toBe(403);
  });
});
