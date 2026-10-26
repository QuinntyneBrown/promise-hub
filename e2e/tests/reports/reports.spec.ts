import { test, expect } from '../../fixtures/test';
import { ReportsPage } from '../../pages/reports.page';

// L2-024 report numbers and filters, L2-025 exports, L2-007 roles, L2-005 Reports off, L2-001 tenants, L2-035/L2-036.
test.describe('Produce grant reports as a program director', () => {
  test.use({ signedInAs: 'm-marisol' });

  test('Given Harbourview this season, when Reports opens, then children served, ages and attendance by program show', async ({ page }) => {
    const reports = new ReportsPage(page);

    await reports.open();

    await expect(reports.stat('Children served')).toHaveText('6');
    await expect(reports.ageCount('9–11')).toHaveText('3');
    await expect(reports.programRate('After-School Tutoring')).toBeVisible();
    await reports.expectAccessible();
    await reports.expectNoHorizontalScroll();
  });

  test('Given the program filter, when Tutoring is chosen, then the numbers narrow to it', async ({ page }) => {
    const reports = new ReportsPage(page);
    await reports.open();

    await reports.filterProgram('After-School Tutoring');

    await expect(reports.stat('Children served')).toHaveText('4');
  });

  test('Given an export, when CSV is chosen, then a download link that expires in seven days is offered', async ({ page }) => {
    const reports = new ReportsPage(page);
    await reports.open();

    await reports.exportCsv();

    await expect(reports.download).toHaveAttribute('href', /\/api\/reports\/exports\/export-/);
    await expect(reports.dialog).toContainText('The link works for 7 days');
    await reports.expectAccessible();
  });

  test('Given the report fails, when Reports opens, then it offers to try again', async ({ page, api }) => {
    api.failNext('/api/reports', 500);
    const reports = new ReportsPage(page);

    await reports.open();

    await expect(reports.loadError).toBeVisible();
  });

  test('Given Reports is off, when Reports is opened directly, then Today opens instead', async ({ page, api }) => {
    api.setModules('org-harbourview', ['Roster']);

    await page.goto('/reports');

    await expect(page).toHaveURL(/\/$/);
  });
});

test.describe('Site lead', () => {
  test.use({ signedInAs: 'm-jaylen' });

  test('Given a site lead, when Reports opens, then counts under five are masked', async ({ page }) => {
    const reports = new ReportsPage(page);

    await reports.open();

    await expect(reports.ageCount('9–11')).toHaveText('<5');
    await expect(reports.maskNote).toBeVisible();
  });
});

test.describe('Youth worker', () => {
  test.use({ signedInAs: 'm-aisha' });

  test('Given a youth worker, when Reports is opened, then it says who reads reports', async ({ page }) => {
    const reports = new ReportsPage(page);

    await reports.open();

    await expect(reports.forbidden).toBeVisible();
  });
});
