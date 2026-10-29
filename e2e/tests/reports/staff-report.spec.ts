import { test, expect } from '../../fixtures/test';
import { learningReports } from '../../fixtures/report-data';
import { ReportsPage } from '../../pages/reports.page';
import { StaffReportPage } from '../../pages/report-staff.page';

// Acceptance test. Traces to: L2-128 criteria 1 to 5 (each mentor's cohorts, caseload, check-ins, reviews and load; the period; the
// overloaded warning; no mentors; Mentoring and Reports off; roles), L2-035, L2-036.
test.describe('Report on staff activity as a program director', () => {
  test.use({ signedInAs: 'm-marisol' });

  test('Given Daniel and Hana mentor, when Marisol opens Staff activity, then each mentor’s caseload, check-ins and load show', async ({ page, api }) => {
    learningReports(api);
    api.setCohortTeam('p-tutoring', 'm-hana', ['m-daniel']);
    const reports = new ReportsPage(page);
    const staff = new StaffReportPage(page);
    await reports.open();

    await reports.openDetailed('Staff activity');

    await staff.expectOpen();
    await expect(staff.stat('Active mentors')).toHaveText('2');
    await expect(staff.mentorRow('Daniel Osei')).toContainText('2');
    await expect(staff.mentorRow('Daniel Osei')).toContainText('Underloaded');
    await expect(staff.mentorRow('Hana Kim')).toContainText('After-School Tutoring (lead)');
    await expect(staff.warning).toHaveCount(0);
    await staff.expectAccessible();
    await staff.expectNoHorizontalScroll();
  });

  test('Given Daniel has nine youth, then the page warns that he is overloaded', async ({ page, api }) => {
    learningReports(api);
    for (const child of ['c-mateo', 'c-jordan', 'c-kevin', 'c-emily', 'c-yusuf', 'c-amara', 'c-extra-1']) api.assignYouthMentor(child, 'm-daniel');
    const staff = new StaffReportPage(page);

    await staff.open();

    await expect(staff.warning).toHaveText('Daniel Osei has 9 youth');
    await expect(staff.mentorRow('Daniel Osei')).toContainText('Overloaded');
    await staff.expectAccessible();
  });

  test('Given the last 30 days, then older check-ins are not counted', async ({ page, api }) => {
    learningReports(api);
    api.mentorCheckIns.seed({ childId: 'c-sofia', youthName: 'Sofía Rivera', mentorId: 'm-daniel', date: '2026-09-20', kind: 'Call', engagement: 'Steady' });
    const staff = new StaffReportPage(page);
    await staff.open();
    await expect(staff.stat('Check-ins logged')).toHaveText('2');

    await staff.choosePeriod('Last 30 days');

    await expect(staff.stat('Check-ins logged')).toHaveText('1');
  });

  test('Given Export CSV, then one row per mentor for the period is offered', async ({ page, api }) => {
    learningReports(api);
    const staff = new StaffReportPage(page);
    await staff.open();

    await staff.exportCsv();

    await expect(staff.download).toBeVisible();
    expect(api.lastExportCsv().split('\n')[0]).toBe('Mentor,Cohorts,Youth,Check-ins,Reviews,Load');
    await staff.expectAccessible();
  });

  test('Given no mentors, then it says so', async ({ page, api }) => {
    learningReports(api);
    api.removeMembership('m-daniel');
    api.removeMembership('m-hana');
    const staff = new StaffReportPage(page);

    await staff.open();

    await expect(staff.empty).toBeVisible();
    await staff.expectAccessible();
  });

  test('Given the report fails, then it offers Try again', async ({ page, api }) => {
    learningReports(api);
    api.failNext('/api/reports/staff', 500);
    const staff = new StaffReportPage(page);

    await page.goto('/reports/staff');

    await expect(staff.loadError).toBeVisible();
  });

  test('Given Mentoring is off, then Staff activity is not listed, its route redirects to Today and the API answers 404', async ({ page, api }) => {
    api.setModules('org-harbourview', ['Roster', 'RollCall', 'Reports', 'Learning']);
    const reports = new ReportsPage(page);
    await reports.open();
    await expect(reports.detailed.getByRole('link', { name: /^Staff activity/ })).toHaveCount(0);

    await page.goto('/reports/staff');

    await expect(page).toHaveURL(/\/$/);
    expect(await reports.apiStatus('/reports/staff')).toBe(404);
  });
});

test.describe('Report on staff activity as a youth worker', () => {
  test.use({ signedInAs: 'm-aisha' });

  test('Given Aisha, then the staff report says who reads reports', async ({ page }) => {
    const staff = new StaffReportPage(page);

    await page.goto('/reports/staff');

    await expect(staff.forbidden).toBeVisible();
  });
});
