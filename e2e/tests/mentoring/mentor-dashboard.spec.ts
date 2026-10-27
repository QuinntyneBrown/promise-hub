import { test, expect } from '../../fixtures/test';
import type { ModuleId } from '../../fixtures/seed';
import type { FakeApi } from '../../fixtures/fake-api';
import { MentoringPage } from '../../pages/mentoring.page';
import { MentorYouthPage } from '../../pages/mentor-youth.page';

// Acceptance tests. Traces to: L2-063 (mentor dashboard and roster), L2-065 criterion 4.
// Daniel mentors Mateo directly, leads Saturday Sports and supports After-School Tutoring (Hana leads it).
const ALL: ModuleId[] = ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports', 'Learning', 'Mentoring'];
const SIX = ['Emily Tran', 'Jordan Thompson', 'Kevin Tran', 'Mateo Rivera', 'Sofía Rivera', 'Yusuf Haddad'];

function assignDaniel(api: FakeApi): void {
  api.assignYouthMentor('c-mateo', 'm-daniel');
  api.setCohortTeam('p-sports', 'm-daniel');
  api.setCohortTeam('p-tutoring', 'm-hana', ['m-daniel']);
}

test.describe('The mentor dashboard', () => {
  test.use({ signedInAs: 'm-daniel' });

  test('Given Daniel’s assignments, when he opens Mentoring, then he sees his numbers, his first five youth and his cohorts', async ({ page, api }) => {
    assignDaniel(api);
    api.recordAttendance('e-tutoring-today', 'c-mateo', 'Present', '2026-11-05T21:02:00Z');
    const mentoring = new MentoringPage(page);

    await mentoring.open();

    await mentoring.expectOpen();
    await expect(mentoring.stat('My youth')).toHaveText('6');
    await expect(mentoring.stat('My cohorts')).toHaveText('2');
    await expect(mentoring.stat('Checked in this week')).toHaveText('1');
    await expect(mentoring.youth).toHaveText(SIX.slice(0, 5));
    await expect(mentoring.cohorts).toHaveText(['After-School Tutoring', 'Saturday Sports']);
    await mentoring.expectAccessible();
  });

  test('Given Roll Call is on, when the dashboard loads, then recent activity lists his youth’s latest attendance, newest first', async ({ page, api }) => {
    assignDaniel(api);
    api.recordAttendance('e-tutoring-yesterday', 'c-yusuf', 'Absent', null);
    api.recordAttendance('e-tutoring-today', 'c-mateo', 'Present', '2026-11-05T21:02:00Z');
    api.recordAttendance('e-tutoring-today', 'c-amara', 'Present', '2026-11-05T21:03:00Z');
    const mentoring = new MentoringPage(page);

    await mentoring.open();

    await expect(mentoring.activity).toHaveCount(2);
    await expect(mentoring.activity.first()).toContainText('Mateo Rivera checked in to Tutoring night');
    await expect(mentoring.activity.nth(1)).toContainText('Yusuf Haddad was marked absent from Tutoring night');
  });

  test('Given Roll Call is off, when the dashboard loads, then nothing about attendance renders', async ({ page, api }) => {
    assignDaniel(api);
    api.setModules('org-harbourview', ['Roster', 'Slips', 'QuickCards', 'Messages', 'Incidents', 'Reports', 'Learning', 'Mentoring']);
    const mentoring = new MentoringPage(page);

    await mentoring.open();

    await expect(mentoring.stat('My youth')).toHaveText('6');
    await expect(mentoring.statLabels).toHaveText(['My youth', 'My cohorts']);
    await expect(mentoring.activityHeading).toHaveCount(0);
  });

  test('Given the dashboard fails to load, when Daniel tries again, then it loads', async ({ page, api }) => {
    assignDaniel(api);
    api.failNext('/api/mentoring/dashboard', 500);
    const mentoring = new MentoringPage(page);

    await mentoring.open();
    await expect(mentoring.failed).toBeVisible();
    await mentoring.expectAccessible();
    api.recover('/api/mentoring/dashboard');
    await mentoring.retry();

    await expect(mentoring.stat('My youth')).toHaveText('6');
  });

  test('Given View all, when Daniel searches My youth, then the list narrows and a search with no match can be cleared', async ({ page, api }) => {
    assignDaniel(api);
    const mentoring = new MentoringPage(page);
    const myYouth = new MentorYouthPage(page);
    await mentoring.open();

    await mentoring.viewAll();

    await myYouth.expectOpen();
    await expect(myYouth.youth).toHaveText(SIX);
    await expect(myYouth.row('Kevin Tran')).toContainText('Age 8 · Saturday Sports');
    await myYouth.search('tran');
    await expect(myYouth.youth).toHaveText(['Emily Tran', 'Kevin Tran']);
    await myYouth.search('zed');
    await expect(myYouth.noResults).toHaveText('No youth match “zed”');
    await myYouth.expectAccessible();
    await myYouth.clearSearch();
    await expect(myYouth.youth).toHaveText(SIX);
  });
});

test.describe('A mentor with no assignments', () => {
  test.use({ signedInAs: 'm-hana' });

  test('Given Hana has no youth, when she opens Mentoring and My youth, then each says no youth are assigned yet', async ({ page }) => {
    const mentoring = new MentoringPage(page);
    const myYouth = new MentorYouthPage(page);

    await mentoring.open();
    await expect(mentoring.emptyState).toBeVisible();
    await mentoring.expectAccessible();

    await myYouth.open();
    await expect(myYouth.emptyState).toBeVisible();
    await myYouth.expectAccessible();
  });
});

test.describe('The dashboard for other roles', () => {
  test.use({ signedInAs: 'm-marisol' });

  test('Given a program director opens /mentoring directly, when it loads, then it says Mentoring is for mentors and the API answers 403', async ({ page }) => {
    const mentoring = new MentoringPage(page);

    await mentoring.open();

    await expect(mentoring.forbidden).toBeVisible();
    expect(await mentoring.apiStatus('/api/mentoring/dashboard')).toBe(403);
    await mentoring.expectAccessible();
  });
});

test.describe('The dashboard with Mentoring off', () => {
  test.use({ signedInAs: 'm-daniel' });

  test('Given Mentoring is off, when /mentoring/youth is opened, then Today opens and the dashboard answers 404', async ({ page, api }) => {
    assignDaniel(api);
    api.setModules('org-harbourview', ALL.filter((m) => m !== 'Mentoring'));
    const myYouth = new MentorYouthPage(page);

    await myYouth.open();

    await expect(page).toHaveURL(/\/$/);
    expect(await new MentoringPage(page).apiStatus('/api/mentoring/dashboard')).toBe(404);
  });
});

test.describe('The dashboard in another organization', () => {
  test.use({ signedInAs: 'm-samuel' });

  test('Given Samuel at Northgate with Mentoring on, when he opens Mentoring, then no Harbourview youth appears', async ({ page, api }) => {
    assignDaniel(api);
    api.setModules('org-northgate', ['Roster', 'RollCall', 'QuickCards', 'Mentoring']);
    const mentoring = new MentoringPage(page);

    await mentoring.open();

    await expect(mentoring.emptyState).toBeVisible();
  });
});
