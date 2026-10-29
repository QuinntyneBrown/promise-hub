import { test, expect } from '../../fixtures/test';
import { learningReports, northgateReports } from '../../fixtures/report-data';
import { CohortReportPage } from '../../pages/report-cohort.page';
import { YouthReportPage } from '../../pages/report-youth.page';

// Acceptance test. Traces to: L2-127 criteria 3 to 7 (the youth report from a name on the cohort report: learning, attendance and mentoring
// while their modules are on, no youth account, not found, roles, Reports off, error), L2-035, L2-036.
test.describe('Report on one youth as a program director', () => {
  test.use({ signedInAs: 'm-marisol' });

  test('Given the cohort report, when Marisol chooses Nadia, then her learning, attendance and mentoring show without her mentor’s notes', async ({ page, api }) => {
    learningReports(api);
    const cohort = new CohortReportPage(page);
    const youth = new YouthReportPage(page);
    await cohort.openFor('p-tutoring', 'After-School Tutoring');

    await cohort.openYouth('Nadia Haddad');

    await youth.expectYouth('Nadia Haddad');
    await expect(youth.stat('Lessons done')).toHaveText('2 of 2');
    await expect(youth.moduleRow('Knowing Yourself')).toContainText('Done');
    await expect(youth.section('Mentoring')).toContainText('Daniel Osei');
    await expect(youth.section('Mentoring')).toContainText('Engaged');
    await expect(youth.section('Mentoring')).toContainText('Open');
    await expect(youth.section('Attendance')).toBeVisible();
    await youth.expectAccessible();
    await youth.expectNoHorizontalScroll();
  });

  test('Given Mateo has no youth account, then the report says so and still shows his attendance', async ({ page, api }) => {
    learningReports(api);
    const youth = new YouthReportPage(page);

    await youth.openFor('c-mateo', 'Mateo Rivera');

    await expect(youth.noAccount).toHaveText('Mateo has no youth account');
    await expect(youth.stat('Attendance')).toHaveText('100%');
    await expect(youth.section('Learning')).toHaveCount(0);
    await youth.expectAccessible();
  });

  test('Given the report fails, then it offers Try again', async ({ page, api }) => {
    learningReports(api);
    api.failNext('/api/reports/youth/c-nadia', 500);
    const youth = new YouthReportPage(page);
    await page.goto('/reports/youth/c-nadia');
    await expect(youth.loadError).toBeVisible();
    api.recover('/api/reports/youth/c-nadia');

    await youth.retry();

    await youth.expectYouth('Nadia Haddad');
  });

  test('Given another organization’s child, then it is not found', async ({ page, api }) => {
    learningReports(api);
    const youth = new YouthReportPage(page);

    await page.goto('/reports/youth/c-ng-lucia');

    await expect(youth.notFound).toBeVisible();
    expect(await youth.apiStatus('/reports/youth/c-ng-lucia')).toBe(404);
  });

  test('Given Reports is off, then the youth report redirects to Today and the API answers 404', async ({ page, api }) => {
    api.setModules('org-harbourview', ['Roster', 'RollCall', 'Learning', 'Mentoring']);

    await page.goto('/reports/youth/c-nadia');

    await expect(page).toHaveURL(/\/$/);
    expect(await new YouthReportPage(page).apiStatus('/reports/youth/c-nadia')).toBe(404);
  });
});

test.describe('Report on one youth where Learning and Mentoring are off', () => {
  test.use({ signedInAs: 'm-grace' });

  test('Given Lucía at Northgate, then only attendance shows', async ({ page, api }) => {
    northgateReports(api);
    const youth = new YouthReportPage(page);

    await youth.openFor('c-ng-lucia', 'Lucía Rivera');

    await expect(youth.section('Attendance')).toBeVisible();
    await expect(youth.section('Learning')).toHaveCount(0);
    await expect(youth.section('Mentoring')).toHaveCount(0);
    await expect(youth.noAccount).toHaveCount(0);
    await youth.expectAccessible();
  });
});

test.describe('Report on one youth as a youth worker', () => {
  test.use({ signedInAs: 'm-aisha' });

  test('Given Aisha, then the youth report says who reads reports', async ({ page }) => {
    const youth = new YouthReportPage(page);

    await page.goto('/reports/youth/c-mateo');

    await expect(youth.forbidden).toBeVisible();
  });
});
