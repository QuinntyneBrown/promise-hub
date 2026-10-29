import { test, expect } from '../../fixtures/test';
import { learningReports } from '../../fixtures/report-data';
import { ProgressBoardPage } from '../../pages/progress-board.page';
import { ReportsPage } from '../../pages/reports.page';

// Acceptance test. Traces to: L2-131 criteria 1, 2, 4 and 5 (every youth by every module with the cohort average; the matrix scrolls in its
// own region on a phone; no track; empty; Learning and Reports off; roles), L2-035, L2-036.
test.describe('Read the progress board as a program director', () => {
  test.use({ signedInAs: 'm-marisol' });

  test('Given After-School Tutoring, when Marisol opens the progress board, then each youth’s modules, quiz average and overall show with the cohort average', async ({
    page,
    api,
  }) => {
    learningReports(api);
    const reports = new ReportsPage(page);
    const board = new ProgressBoardPage(page);
    await reports.open();

    await reports.openDetailed('Progress board');

    await board.expectOpen();
    expect(await board.row('Nadia Haddad')).toEqual(['Done', '—', '100%']);
    expect(await board.row('Sofía Rivera')).toEqual(['Not started', '—', '0%']);
    expect(await board.row('Mateo Rivera')).toEqual(['No account', '—', '—']);
    expect(await board.average()).toEqual(['Cohort average', '50%', '—', '50%']);
    await board.expectAccessible();
    await board.expectNoHorizontalScroll();
  });

  test('Given Export CSV, then the board exports for the chosen cohort with the cohort average', async ({ page, api }) => {
    learningReports(api);
    const board = new ProgressBoardPage(page);
    await board.open();

    await board.exportCsv();

    await expect(board.download).toBeVisible();
    const csv = api.lastExportCsv();
    expect(csv.split('\n')[0]).toBe('Youth,Knowing Yourself,Quiz average (%),Overall (%)');
    expect(csv.trim().split('\n').at(-1)).toBe('Cohort average,50,,50');
  });

  test('Given a cohort that follows no track, then the board says so', async ({ page, api }) => {
    learningReports(api);
    api.curriculumState.programTracks.delete('p-sports');
    const board = new ProgressBoardPage(page);
    await board.open();

    await board.chooseCohort('Saturday Sports');

    await expect(board.noTrack).toBeVisible();
    await expect(page).toHaveURL(/programId=p-sports/);
    await board.expectAccessible();
  });

  test('Given a cohort with no one enrolled, then the board says so', async ({ page, api }) => {
    learningReports(api);
    const board = new ProgressBoardPage(page);

    await page.goto('/reports/progress?programId=p-winter');

    await expect(board.empty).toBeVisible();
  });

  test('Given the board fails, then it offers Try again', async ({ page, api }) => {
    learningReports(api);
    api.failNext('/api/reports/progress/p-tutoring', 500);
    const board = new ProgressBoardPage(page);

    await page.goto('/reports/progress');

    await expect(board.loadError).toBeVisible();
  });

  test('Given Learning is off, then the board is not listed, its route redirects to Today and the API answers 404', async ({ page, api }) => {
    api.setModules('org-harbourview', ['Roster', 'RollCall', 'Reports', 'Mentoring']);
    const reports = new ReportsPage(page);
    await reports.open();
    await expect(reports.detailed.getByRole('link', { name: /^Progress board/ })).toHaveCount(0);

    await page.goto('/reports/progress');

    await expect(page).toHaveURL(/\/$/);
    expect(await reports.apiStatus('/reports/progress/p-tutoring')).toBe(404);
  });
});

test.describe('Read the progress board as a youth worker', () => {
  test.use({ signedInAs: 'm-aisha' });

  test('Given Aisha, then the board says who reads reports', async ({ page }) => {
    const board = new ProgressBoardPage(page);

    await page.goto('/reports/progress');

    await expect(board.forbidden).toBeVisible();
  });
});
