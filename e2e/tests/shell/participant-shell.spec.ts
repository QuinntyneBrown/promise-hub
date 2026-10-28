import { test, expect } from '../../fixtures/test';
import type { ModuleId } from '../../fixtures/seed';
import { ShellPage } from '../../pages/shell.page';
import { TodayPage } from '../../pages/today.page';

// L2-038 criteria 6 to 9: the shell for youth, mentors and volunteers is composed from their own sections whose module is on.
// L2-101 criterion 1: Schedule is a volunteer section while Roll Call is on. L2-105 criterion 5: Announcements serves youth and mentors while Messages is on; L2-106: Messages while Messages and Mentoring are on.
// L2-005 criterion 8: a module that is off disappears from their navigation. L2-094 criterion 1: Schedule is a youth section while Roster is on.
const SUITE: ModuleId[] = ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports'];

test.describe('A youth', () => {
  test.use({ signedInAs: 'm-sofia' });

  test('Given Learning is on, when Sofía signs in, then she sees Today, Learning, Schedule and Messages only, with no search', async ({ page, api }) => {
    api.setModules('org-harbourview', [...SUITE, 'Learning', 'Mentoring']);
    const shell = new ShellPage(page);
    const today = new TodayPage(page);

    await today.open();

    await expect(today.heading).toHaveText('Welcome, Sofía');
    expect(await shell.visibleNavigationLabels()).toEqual(['Today', 'Learning', 'Schedule', 'Messages', 'More']);
    await expect(shell.search).toBeHidden();
    expect(await today.yourWork()).toEqual(['Learning']);
    await shell.openMenu();
    expect(await shell.menuLabels()).toEqual(['Today', 'Learning', 'Schedule', 'Messages', 'Announcements', 'Notifications', 'Your account']);
    await shell.expectAccessible();
    await shell.closeMenuWithEscape();
    await shell.expectNoHorizontalScroll();
  });

  test('Given Learning is off, when Sofía signs in, then Learning is gone, Schedule stays and Today says there is nothing to do', async ({ page, api }) => {
    api.setModules('org-harbourview', [...SUITE, 'Mentoring']);
    const shell = new ShellPage(page);
    const today = new TodayPage(page);

    await today.open();

    expect(await shell.visibleNavigationLabels()).toEqual(['Today', 'Schedule', 'Messages', 'More']);
    await expect(today.nothingToDo).toBeVisible();
    await shell.openMenu();
    expect(await shell.menuLabels()).toEqual(['Today', 'Schedule', 'Messages', 'Announcements', 'Notifications', 'Your account']);
    await shell.closeMenuWithEscape();
    await today.expectAccessible();
  });
});

test.describe('A mentor', () => {
  test.use({ signedInAs: 'm-daniel' });

  // L2-095 criterion 2: mentors take attendance in Roll Call, so Check-in serves them while it is on.
  test('Given Mentoring and Roll Call are on, when Daniel signs in, then he sees Today, Mentoring, Check-in and Messages', async ({ page, api }) => {
    api.setModules('org-harbourview', [...SUITE, 'Learning', 'Mentoring']);
    const shell = new ShellPage(page);
    const today = new TodayPage(page);

    await today.open();

    await expect(today.heading).toHaveText('Welcome, Daniel');
    expect(await shell.visibleNavigationLabels()).toEqual(['Today', 'Mentoring', 'Check-in', 'Messages', 'More']);
    expect(await today.yourWork()).toEqual(['Mentoring', 'Check-in']);
    await today.expectAccessible();
  });
});

test.describe('A volunteer', () => {
  test.use({ signedInAs: 'm-leo' });

  test('Given Roll Call is on, when Leo signs in, then he sees Today, Check-in and Schedule with his assigned session', async ({ page, api }) => {
    api.setModules('org-harbourview', SUITE);
    const shell = new ShellPage(page);
    const today = new TodayPage(page);

    await today.open();

    await expect(today.heading).toHaveText('Welcome, Leo');
    expect(await shell.visibleNavigationLabels()).toEqual(['Today', 'Check-in', 'Schedule', 'More']);
    await shell.openMenu();
    expect(await shell.menuLabels()).toEqual(['Today', 'Check-in', 'Schedule', 'Notifications', 'Your account']);
    await shell.closeMenuWithEscape();
    await expect(today.volunteerSession('Tutoring night')).toContainText('Take attendance');
    expect(await today.yourWork()).toEqual(['Your schedule']);
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
