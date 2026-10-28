import { test, expect } from '../../fixtures/test';
import type { FakeApi } from '../../fixtures/fake-api';
import type { ModuleId } from '../../fixtures/seed';
import { AtRiskFlagsPage } from '../../pages/mentor-flags.page';
import { MentoringPage } from '../../pages/mentoring.page';
import { NotificationsPage } from '../../pages/notifications.page';
import { RaiseFlagDialog } from '../../pages/raise-flag.page';
import { ResolveFlagDialog } from '../../pages/resolve-flag.page';
import { ShellPage } from '../../pages/shell.page';
import { TodayPage } from '../../pages/today.page';

// Acceptance test. Traces to: L2-091 criteria 1, 2, 4, 8 and 9 (a mentor raises an at-risk flag with a severity and a reason, field errors,
// one open flag per youth, his open flags most serious first, the empty, failed and forbidden states, Mentoring off), L2-065, L2-035, L2-036.
const ALL: ModuleId[] = ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports', 'Learning', 'Mentoring'];
const REASON = 'Asked me twice whether he could stay late because nobody is home after school.';

function seedFlags(api: FakeApi): void {
  api.atRiskFlags.seed({
    childId: 'c-jordan',
    youthName: 'Jordan Thompson',
    raisedById: 'm-hana',
    raisedBy: 'Hana Kim',
    severity: 'Medium',
    reason: 'Falling behind on homework and withdrawn at Tutoring night.',
  });
  api.atRiskFlags.seed({
    childId: 'c-yusuf',
    youthName: 'Yusuf Haddad',
    raisedById: 'm-daniel',
    raisedBy: 'Daniel Osei',
    severity: 'High',
    reason: 'Missed three Tutoring nights in a row and stopped answering my messages.',
  });
  api.atRiskFlags.seed({
    childId: 'c-amara',
    youthName: 'Amara Okonkwo',
    raisedById: 'm-hana',
    raisedBy: 'Hana Kim',
    severity: 'High',
    reason: 'Not one of Daniel’s youth.',
  });
}

test.describe('At-risk flags for a mentor', () => {
  test.use({ signedInAs: 'm-daniel' });

  test.beforeEach(({ api }) => {
    api.setModules('org-harbourview', ALL);
    api.assignYouthMentor('c-mateo', 'm-daniel');
    api.setCohortTeam('p-tutoring', 'm-hana', ['m-daniel']);
  });

  test('Given open flags on his youth, when Daniel opens At-risk flags from his dashboard, then he sees them most serious first with who raised them', async ({
    page,
    api,
  }) => {
    seedFlags(api);
    const dashboard = new MentoringPage(page);
    const flags = new AtRiskFlagsPage(page);
    await dashboard.open();

    await dashboard.openFlags();

    await flags.expectOpen();
    await expect(flags.items).toHaveCount(2);
    await expect(flags.items.nth(0)).toContainText('Yusuf Haddad');
    await expect(flags.items.nth(0)).toContainText('High');
    await expect(flags.items.nth(0)).toContainText('Missed three Tutoring nights in a row');
    await expect(flags.items.nth(0)).toContainText('Raised by Daniel Osei');
    await expect(flags.items.nth(1)).toContainText('Jordan Thompson');
    await expect(flags.items.nth(1)).toContainText('Medium');
    await expect(flags.items.nth(1)).toContainText('Raised by Hana Kim');
    await expect(flags.tab(/^Open\s+2$/)).toBeVisible();
    await expect(page.getByText('Not one of Daniel’s youth.')).toHaveCount(0);
    await expect(flags.viewRecord('Yusuf Haddad')).toHaveAttribute('href', '/mentoring/youth/c-yusuf');
    await flags.expectNoHorizontalScroll();
    await flags.expectAccessible();
  });

  test('Given no flags, when he raises one on Mateo, then a toast says directors were told and it joins the open list', async ({ page, api }) => {
    const flags = new AtRiskFlagsPage(page);
    const dialog = new RaiseFlagDialog(page);
    await flags.open();
    await expect(flags.empty).toBeVisible();
    await flags.expectAccessible();

    await flags.raise();
    await dialog.expectOpen();
    await expect(dialog.hint).toBeVisible();
    await dialog.expectAccessible();
    await dialog.fill({
      youth: 'Mateo Rivera',
      severity: 'Medium',
      reason: REASON,
    });
    await dialog.save();

    await expect(flags.toast('Flag raised')).toBeVisible();
    await expect(flags.items).toHaveCount(1);
    await expect(flags.items.first()).toContainText('Mateo Rivera');
    await expect(flags.items.first()).toContainText(REASON);
    expect(api.atRiskFlags.rows[0]).toMatchObject({
      childId: 'c-mateo',
      severity: 'Medium',
      raisedById: 'm-daniel',
      status: 'Open',
    });
  });

  test('Given the dialog, when he raises with nothing filled in, then each field says what it needs, and an already flagged youth is refused', async ({
    page,
    api,
  }) => {
    seedFlags(api);
    const flags = new AtRiskFlagsPage(page);
    const dialog = new RaiseFlagDialog(page);
    await flags.open();
    await flags.raise();

    await dialog.save();

    await expect(dialog.summary).toBeVisible();
    await expect(dialog.dialog.getByText('Choose a youth.').first()).toBeVisible();
    await expect(dialog.dialog.getByText('Choose how serious it is.').first()).toBeVisible();
    await expect(dialog.dialog.getByText('Say why you’re worried.').first()).toBeVisible();
    await dialog.expectAccessible();

    await dialog.fill({
      youth: 'Yusuf Haddad',
      severity: 'Low',
      reason: 'Quiet lately.',
    });
    await dialog.save();
    await expect(dialog.alreadyFlagged('Yusuf Haddad')).toBeVisible();
    expect(api.atRiskFlags.rows.filter((r) => r.childId === 'c-yusuf')).toHaveLength(1);
  });

  test('Given the save fails, when he raises, then everything he wrote stays to try again', async ({ page, api }) => {
    api.atRiskFlags.failSaves = true;
    const flags = new AtRiskFlagsPage(page);
    const dialog = new RaiseFlagDialog(page);
    await flags.open();
    await flags.raise();
    await dialog.fill({
      youth: 'Mateo Rivera',
      severity: 'High',
      reason: REASON,
    });

    await dialog.save();

    await expect(dialog.failed).toBeVisible();
    await expect(dialog.field('Why are you worried?')).toHaveValue(REASON);
    expect(api.atRiskFlags.rows).toHaveLength(0);
  });

  test('Given the flags fail to load, when he opens them, then the error state offers Try again and they load', async ({ page, api }) => {
    seedFlags(api);
    api.failNext('/api/mentoring/flags', 500);
    const flags = new AtRiskFlagsPage(page);
    await flags.open();

    await expect(flags.failed).toBeVisible();
    await flags.expectAccessible();
    api.recover('/api/mentoring/flags');
    await flags.retry();

    await expect(flags.items).toHaveCount(2);
  });

  test('Given a phone, when he raises a flag, then nothing scrolls sideways and the dialog is accessible', async ({ page, api }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    seedFlags(api);
    const flags = new AtRiskFlagsPage(page);
    const dialog = new RaiseFlagDialog(page);
    await flags.open();
    await expect(flags.items).toHaveCount(2);
    await flags.expectNoHorizontalScroll();
    await flags.expectAccessible();

    await flags.raise();
    await dialog.expectOpen();
    await dialog.expectAccessible();
  });
});

test.describe('At-risk flags for other roles and with Mentoring off', () => {
  test.describe('a youth worker', () => {
    test.use({ signedInAs: 'm-aisha' });

    test('Given Aisha opens /mentoring/flags, when it loads, then it says flags are for mentors and program directors and the API answers 403', async ({
      page,
    }) => {
      const flags = new AtRiskFlagsPage(page);
      await flags.open();

      await expect(flags.forbidden).toBeVisible();
      expect(await flags.apiStatus()).toBe(403);
      await flags.expectAccessible();
    });
  });

  test.describe('a mentor', () => {
    test.use({ signedInAs: 'm-daniel' });

    test('Given Mentoring is off, when /mentoring/flags is opened, then Today opens and the API answers 404', async ({ page, api }) => {
      api.setModules(
        'org-harbourview',
        ALL.filter((m) => m !== 'Mentoring'),
      );
      const flags = new AtRiskFlagsPage(page);
      await flags.open();

      await expect(page).toHaveURL(/\/$/);
      expect(await flags.apiStatus()).toBe(404);
      expect(await new RaiseFlagDialog(page).apiStatus()).toBe(404);
    });
  });
});

// Acceptance test. Traces to: L2-091 criteria 3 and 4 (admins and program directors are notified of a new flag, read every flag of the
// organization from More or the notification, and cannot raise one; nothing while Mentoring is off), L2-040.
test.describe('At-risk flags for a program director', () => {
  test.use({ signedInAs: 'm-marisol' });

  test.beforeEach(({ api }) => {
    api.setModules('org-harbourview', ALL);
  });

  test('Given Daniel raised a flag on Mateo, when Marisol opens her notification, then At-risk flags lists every flag and she cannot raise one', async ({ page, api }) => {
    api.seedRaisedFlag({ childId: 'c-mateo', youthName: 'Mateo Rivera', raisedById: 'm-daniel', raisedBy: 'Daniel Osei', severity: 'Medium', reason: REASON });
    api.atRiskFlags.seed({ childId: 'c-amara', youthName: 'Amara Okonkwo', raisedById: 'm-hana', raisedBy: 'Hana Kim', severity: 'High', reason: 'Not at the last two Saturdays.' });
    const notifications = new NotificationsPage(page);
    const flags = new AtRiskFlagsPage(page);
    await notifications.open();

    await notifications.openItem('Daniel Osei flagged Mateo Rivera as at risk (Medium).');

    await flags.expectOpen();
    await expect(flags.items).toHaveCount(2);
    await expect(flags.items.nth(0)).toContainText('Amara Okonkwo');
    await expect(flags.items.nth(1)).toContainText('Mateo Rivera');
    await expect(flags.raiseButton).toHaveCount(0);
    await expect(flags.viewRecord('Mateo Rivera')).toHaveCount(0);
    await flags.expectNoHorizontalScroll();
    await flags.expectAccessible();
  });

  test('Given Mentoring is on, when Marisol opens More, then At-risk flags is listed and leads to the page', async ({ page }) => {
    const shell = new ShellPage(page);
    await new TodayPage(page).open();

    await shell.openMenu();
    expect(await shell.menuLabels()).toContain('At-risk flags');
    await shell.goToFromMenu('At-risk flags');

    await new AtRiskFlagsPage(page).expectOpen();
  });

  test('Given Mentoring is off, when Marisol opens More and her notifications, then neither mentions at-risk flags', async ({ page, api }) => {
    api.seedRaisedFlag({ childId: 'c-mateo', youthName: 'Mateo Rivera', raisedById: 'm-daniel', raisedBy: 'Daniel Osei', severity: 'Medium', reason: REASON });
    api.setModules('org-harbourview', ALL.filter((m) => m !== 'Mentoring'));
    const shell = new ShellPage(page);
    const notifications = new NotificationsPage(page);
    await new TodayPage(page).open();

    await shell.openMenu();
    expect(await shell.menuLabels()).not.toContain('At-risk flags');
    await shell.closeMenuWithEscape();
    await notifications.open();

    await expect(page.getByText('flagged Mateo Rivera as at risk')).toHaveCount(0);
  });
});

test.describe('At-risk flags in the menu of a site lead', () => {
  test.use({ signedInAs: 'm-jaylen' });

  test('Given Mentoring is on, when Jaylen opens More, then At-risk flags is absent', async ({ page, api }) => {
    api.setModules('org-harbourview', ALL);
    const shell = new ShellPage(page);
    await new TodayPage(page).open();

    await shell.openMenu();

    expect(await shell.menuLabels()).not.toContain('At-risk flags');
  });
});

// Acceptance test. Traces to: L2-091 criteria 5 and 9 (a mentor of the youth or a program director resolves an open flag with an outcome and
// an optional note; the resolved tab; no outcome, already resolved and failed), L2-035.
test.describe('Resolving at-risk flags', () => {
  test.describe('as a mentor', () => {
    test.use({ signedInAs: 'm-daniel' });

    test.beforeEach(({ api }) => {
      api.setModules('org-harbourview', ALL);
      api.assignYouthMentor('c-mateo', 'm-daniel');
      api.setCohortTeam('p-tutoring', 'm-hana', ['m-daniel']);
      seedFlags(api);
    });

    test('Given Yusuf’s open flag, when Daniel resolves it as reconnected with a note, then it leaves the open list and shows under Resolved', async ({
      page,
      api,
    }) => {
      const flags = new AtRiskFlagsPage(page);
      const dialog = new ResolveFlagDialog(page);
      await flags.open();

      await flags.resolve('Yusuf Haddad');
      await dialog.expectOpen();
      await expect(dialog.fact('Yusuf Haddad')).toBeVisible();
      await expect(dialog.fact('High · Raised by Daniel Osei')).toBeVisible();
      await dialog.expectAccessible();
      await dialog.fill('Reconnected, back on track', 'Moved to Tuesday nights; his neighbour drives him.');
      await dialog.save();

      await expect(flags.toast('Flag resolved')).toBeVisible();
      await expect(flags.items).toHaveCount(1);
      await expect(flags.item('Yusuf Haddad')).toHaveCount(0);
      expect(api.atRiskFlags.rows.find((f) => f.childId === 'c-yusuf')).toMatchObject({ status: 'Resolved', outcome: 'Reconnected', resolvedBy: 'Daniel Osei' });
      await flags.showResolved();
      await expect(flags.items).toHaveCount(1);
      await expect(flags.items.first()).toContainText('Yusuf Haddad');
      await expect(flags.items.first()).toContainText('Reconnected, back on track · Resolved by Daniel Osei');
      await expect(flags.items.first()).toContainText('Moved to Tuesday nights; his neighbour drives him.');
      await expect(flags.items.first().getByRole('button', { name: 'Resolve' })).toHaveCount(0);
      await flags.expectAccessible();
    });

    test('Given the dialog, when he resolves without an outcome, then it asks for one; a flag resolved meanwhile says so; a failed save keeps his note', async ({
      page,
      api,
    }) => {
      const flags = new AtRiskFlagsPage(page);
      const dialog = new ResolveFlagDialog(page);
      await flags.open();
      await flags.resolve('Jordan Thompson');

      await dialog.save();
      await expect(dialog.summary).toBeVisible();
      await expect(dialog.dialog.getByText('Choose how it was resolved.').first()).toBeVisible();
      await dialog.expectAccessible();

      api.atRiskFlags.failSaves = true;
      await dialog.fill('Flagged in error', 'He was tired after a tournament.');
      await dialog.save();
      await expect(dialog.failed).toBeVisible();
      await expect(dialog.dialog.getByLabel('Note')).toHaveValue('He was tired after a tournament.');

      api.atRiskFlags.failSaves = false;
      api.atRiskFlags.rows.find((f) => f.childId === 'c-jordan')!.status = 'Resolved';
      await dialog.save();
      await expect(dialog.alreadyResolved).toBeVisible();
      await dialog.close();
      await expect(flags.item('Jordan Thompson')).toHaveCount(0);
    });
  });

  test.describe('as a program director', () => {
    test.use({ signedInAs: 'm-marisol' });

    test('Given an open flag, when Marisol resolves it as handed to her, then it moves to Resolved with her name', async ({ page, api }) => {
      api.setModules('org-harbourview', ALL);
      seedFlags(api);
      const flags = new AtRiskFlagsPage(page);
      const dialog = new ResolveFlagDialog(page);
      await flags.open();

      await flags.resolve('Amara Okonkwo');
      await dialog.fill('Handed to the program director');
      await dialog.save();

      await expect(flags.toast('Flag resolved')).toBeVisible();
      await flags.showResolved();
      await expect(flags.items.first()).toContainText('Handed to the program director · Resolved by Marisol Delgado');
    });
  });
});
