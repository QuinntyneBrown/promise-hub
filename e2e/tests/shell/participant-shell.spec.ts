import { test, expect } from '../../fixtures/test';
import type { ModuleId } from '../../fixtures/seed';
import { ShellPage } from '../../pages/shell.page';
import { TodayPage } from '../../pages/today.page';

// L2-038 criteria 6 to 9: the shell for youth, mentors and volunteers is composed from their own sections whose module is on.
// L2-005 criterion 8: a module that is off disappears from their navigation.
const SUITE: ModuleId[] = ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports'];

test.describe('A youth', () => {
  test.use({ signedInAs: 'm-sofia' });

  test('Given Learning is on, when Sofía signs in, then she sees Today and Learning only, with no search', async ({ page, api }) => {
    api.setModules('org-harbourview', [...SUITE, 'Learning', 'Mentoring']);
    const shell = new ShellPage(page);
    const today = new TodayPage(page);

    await today.open();

    await expect(today.heading).toHaveText('Welcome, Sofía');
    expect(await shell.visibleNavigationLabels()).toEqual(['Today', 'Learning', 'More']);
    await expect(shell.search).toBeHidden();
    expect(await today.yourWork()).toEqual(['Learning']);
    await shell.openMenu();
    expect(await shell.menuLabels()).toEqual(['Today', 'Learning', 'Notifications', 'Your account']);
    await shell.expectAccessible();
    await shell.closeMenuWithEscape();
    await shell.expectNoHorizontalScroll();
  });

  test('Given Learning is off, when Sofía signs in, then Learning is gone and Today says there is nothing to do', async ({ page, api }) => {
    api.setModules('org-harbourview', [...SUITE, 'Mentoring']);
    const shell = new ShellPage(page);
    const today = new TodayPage(page);

    await today.open();

    expect(await shell.visibleNavigationLabels()).toEqual(['Today', 'More']);
    await expect(today.nothingToDo).toBeVisible();
    await shell.openMenu();
    expect(await shell.menuLabels()).toEqual(['Today', 'Notifications', 'Your account']);
    await shell.closeMenuWithEscape();
    await today.expectAccessible();
  });
});

test.describe('A mentor', () => {
  test.use({ signedInAs: 'm-daniel' });

  test('Given Mentoring is on, when Daniel signs in, then he sees Today and Mentoring', async ({ page, api }) => {
    api.setModules('org-harbourview', [...SUITE, 'Learning', 'Mentoring']);
    const shell = new ShellPage(page);
    const today = new TodayPage(page);

    await today.open();

    await expect(today.heading).toHaveText('Welcome, Daniel');
    expect(await shell.visibleNavigationLabels()).toEqual(['Today', 'Mentoring', 'More']);
    expect(await today.yourWork()).toEqual(['Mentoring']);
    await today.expectAccessible();
  });
});

test.describe('A volunteer', () => {
  test.use({ signedInAs: 'm-leo' });

  test('Given Roll Call is on, when Leo signs in, then he sees Today and Check-in with his assigned session', async ({ page, api }) => {
    api.setModules('org-harbourview', SUITE);
    const shell = new ShellPage(page);
    const today = new TodayPage(page);

    await today.open();

    await expect(today.heading).toHaveText('Welcome, Leo');
    expect(await shell.visibleNavigationLabels()).toEqual(['Today', 'Check-in', 'More']);
    expect(await today.yourWork()).toEqual(['Tutoring night']);
    await today.expectAccessible();
  });
});

test.describe('Curriculum in the staff menu', () => {
  test.describe('a program director', () => {
    test.use({ signedInAs: 'm-marisol' });

    test('Given Learning is on, when Marisol opens More, then Curriculum is listed', async ({ page, api }) => {
      api.setModules('org-harbourview', [...SUITE, 'Learning']);
      const shell = new ShellPage(page);
      await new TodayPage(page).open();

      await shell.openMenu();

      expect(await shell.menuLabels()).toContain('Curriculum');
    });

    test('Given Learning is off, when Marisol opens More, then Curriculum is absent', async ({ page, api }) => {
      api.setModules('org-harbourview', SUITE);
      const shell = new ShellPage(page);
      await new TodayPage(page).open();

      await shell.openMenu();

      expect(await shell.menuLabels()).not.toContain('Curriculum');
    });
  });

  test('Given Learning is on, when a site lead opens More, then Curriculum is absent', async ({ page, api }) => {
    api.setModules('org-harbourview', [...SUITE, 'Learning']);
    const shell = new ShellPage(page);
    await new TodayPage(page).open();

    await shell.openMenu();

    expect(await shell.menuLabels()).not.toContain('Curriculum');
  });
});
