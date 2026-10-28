import { test, expect } from '../../fixtures/test';
import type { ModuleId } from '../../fixtures/seed';
import { AssignWorkDialog } from '../../pages/assign-work.page';
import { MentoringPage } from '../../pages/mentoring.page';

// Acceptance test. Traces to: L2-092 criteria 1 to 3, 7 and 8 (a mentor assigns a published lesson, quiz or assignment to chosen youth or a
// whole cohort with a due date and a message; field errors, every youth following the track, the failed and nothing-to-assign states,
// another role refused, a phone), L2-065, L2-007, L2-035, L2-036.
const ALL: ModuleId[] = ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports', 'Learning', 'Mentoring'];
const MESSAGE = 'Read this before Tutoring night next week. Come ready to share one way you served someone.';
const LINE = 'Last in Line · Leading by Serving';

test.describe('Assign work as a mentor', () => {
  test.use({ signedInAs: 'm-daniel' });

  test.beforeEach(({ api }) => {
    api.setModules('org-harbourview', ALL);
    api.curriculumState.youthJourney();
    api.setCohortTeam('p-tutoring', 'm-hana', ['m-daniel']);
  });

  test('Given his youth follow Leadership Foundations, when Daniel assigns Last in Line to Mateo and Yusuf, then a toast says it went to 2 youth and when it is due', async ({
    page,
    api,
  }) => {
    const dashboard = new MentoringPage(page);
    const dialog = new AssignWorkDialog(page);
    await dashboard.open();

    await dashboard.assignWork();
    await dialog.expectOpen();
    await dialog.expectAccessible();
    await dialog.fill({ kind: 'Lesson', item: LINE, who: 'Youth I choose', youth: ['Mateo Rivera', 'Yusuf Haddad'], due: '2026-11-13', message: MESSAGE });
    await dialog.expectAccessible();
    await dialog.assign();

    await dialog.expectClosed();
    await expect(dashboard.toast('Work assigned')).toContainText('Last in Line · 2 youth · Due Fri 13 Nov');
    expect(api.assignedWork.rows.map((r) => r.childId).sort()).toEqual(['c-mateo', 'c-yusuf']);
    expect(api.assignedWork.rows[0]).toMatchObject({ kind: 'Lesson', itemId: 'l-line', dueOn: '2026-11-13', message: MESSAGE, assignedBy: 'Daniel Osei' });
  });

  test('Given the dialog, when he assigns with nothing chosen, then each field says what it needs, and a youth outside the track is named by the server', async ({
    page,
    api,
  }) => {
    api.curriculumState.programTracks.delete('p-sports');
    api.assignYouthMentor('c-kevin', 'm-daniel');
    const dashboard = new MentoringPage(page);
    const dialog = new AssignWorkDialog(page);
    await dashboard.open();
    await dashboard.assignWork();
    await dialog.expectOpen();

    await dialog.assign();

    await expect(dialog.summary).toBeVisible();
    await expect(dialog.error('Choose what to assign.').first()).toBeVisible();
    await expect(dialog.error('Choose who it’s for.').first()).toBeVisible();
    await expect(dialog.error('Choose a due date.').first()).toBeVisible();
    await dialog.expectAccessible();
    expect(api.assignedWork.rows).toHaveLength(0);

    await dialog.fill({ item: LINE, who: 'Youth I choose', youth: ['Kevin Tran'], due: '2026-11-13' });
    await dialog.assign();

    await expect(dialog.error('Kevin Tran doesn’t follow the track this lesson is in.').first()).toBeVisible();
    expect(api.assignedWork.rows).toHaveLength(0);
  });

  test('Given the save fails, then the dialog says so and keeps everything he chose', async ({ page, api }) => {
    api.assignedWork.failSaves = true;
    const dashboard = new MentoringPage(page);
    const dialog = new AssignWorkDialog(page);
    await dashboard.open();
    await dashboard.assignWork();
    await dialog.fill({ item: LINE, who: 'Youth I choose', youth: ['Mateo Rivera'], due: '2026-11-13', message: MESSAGE });

    await dialog.assign();

    await expect(dialog.failed).toBeVisible();
    await expect(dialog.item()).toHaveValue('l-line');
    await expect(dialog.youth('Mateo Rivera')).toBeChecked();
    await expect(dialog.field('Message')).toHaveValue(MESSAGE);
    await dialog.expectAccessible();
  });

  test('Given no track his youth follow has published work, when he opens Assign work, then it says there is nothing to assign yet', async ({ page, api }) => {
    api.curriculumState.tracks.forEach((t) => (t.status = 'Draft'));
    const dashboard = new MentoringPage(page);
    const dialog = new AssignWorkDialog(page);
    await dashboard.open();

    await dashboard.assignWork();

    await expect(dialog.nothingToAssign).toBeVisible();
    await dialog.expectAccessible();
  });

  test('Given a phone, when he assigns work, then the dialog fits the screen and passes axe', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    const dashboard = new MentoringPage(page);
    const dialog = new AssignWorkDialog(page);
    await dashboard.open();
    await dashboard.assignWork();
    await dialog.fill({ who: 'Youth I choose' });

    await dialog.expectNoHorizontalScroll();
    await dialog.expectAccessible();
  });
});

test.describe('Assign work for other roles', () => {
  test.use({ signedInAs: 'm-marisol' });

  test('Given Marisol (Program director), when she calls the assign endpoints, then the server answers 403', async ({ page, api }) => {
    api.setModules('org-harbourview', ALL);
    const dialog = new AssignWorkDialog(page);
    await page.goto('/');

    expect(await dialog.apiStatus()).toBe(403);
    expect(await dialog.assignStatus({ kind: 'Lesson', itemId: 'l-strengths', childIds: ['c-mateo'], dueOn: '2026-11-13' })).toBe(403);
  });
});
