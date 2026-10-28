import { test, expect } from '../../fixtures/test';
import { AttendanceHistoryPage } from '../../pages/attendance-history.page';
import { CheckInPage } from '../../pages/check-in.page';
import type { FakeApi } from '../../fixtures/fake-api';

// Acceptance Test
// Traces to: L2-097 criteria 1 to 7
// Description: a cohort's attendance by session and by youth with rates, for directors, site leads and mentors.

/** Last night's Tutoring night: Mateo present, Jordan late, Sofía excused, Yusuf absent; tonight Mateo is in. */
function markedSessions(api: FakeApi): void {
  api.recordAttendance('e-tutoring-yesterday', 'c-mateo', 'Present', '2026-11-04T21:02:00Z');
  api.recordAttendance('e-tutoring-yesterday', 'c-jordan', 'Present', '2026-11-04T21:20:00Z', { late: true });
  api.recordAttendance('e-tutoring-yesterday', 'c-sofia', 'Absent', null, { excused: true });
  api.recordAttendance('e-tutoring-yesterday', 'c-yusuf', 'Absent', null);
  api.recordAttendance('e-tutoring-today', 'c-mateo', 'Present', '2026-11-05T21:03:00Z');
}

test.describe('Review attendance as a program director', () => {
  test.use({ signedInAs: 'm-marisol' });

  test('Given two sessions marked, when Marisol opens Attendance history from Check-in, then she sees each session’s marks and rate, and each youth with those below 70% flagged', async ({ page, api }) => {
    markedSessions(api);
    await new CheckInPage(page).open();
    await page.getByRole('link', { name: 'Attendance history' }).click();
    const history = new AttendanceHistoryPage(page);

    await expect(history.heading).toHaveText('Attendance history');
    await expect(history.cohort).toHaveValue('p-tutoring');
    await expect(history.stat('Attendance rate')).toHaveText('60%');
    await expect(history.stat('Sessions recorded')).toHaveText('2 of 2');
    await expect(history.stat('Below 70%')).toHaveText('2');
    expect(await history.row(history.sessions, 'Wed 4 Nov')).toEqual(['Wed 4 Nov', 'Tutoring night', '1', '1', '1', '1', '50%', 'Recorded', 'Correct']);
    expect(await history.row(history.sessions, 'Thu 5 Nov')).toEqual(['Thu 5 Nov', 'Tutoring night', '1', '0', '0', '0', '100%', 'In progress', 'Correct']);
    await history.expectAccessible();
    await history.expectNoHorizontalScroll();

    await history.showBy('By youth');

    expect(await history.row(history.youth, 'Mateo Rivera')).toEqual(['Mateo Rivera', '2 / 2', '0', '0', '0', '100%']);
    expect(await history.row(history.youth, 'Sofía Rivera')).toEqual(['Sofía Rivera Below 70%', '0 / 1', '0', '1', '0', '0%']);
    await history.expectAccessible();
  });

  test('Given a session nobody marked, when the history opens, then it is Not recorded and a warning names it', async ({ page }) => {
    const history = new AttendanceHistoryPage(page);
    await history.open();

    expect(await history.row(history.sessions, 'Wed 4 Nov')).toEqual(['Wed 4 Nov', 'Tutoring night', '0', '0', '0', '0', '—', 'Not recorded', 'Correct']);
    await expect(history.unrecorded).toContainText('Wed 4 Nov has no attendance');
  });

  test('Given Saturday Sports has not met yet, when Marisol chooses it, then the history says nothing is recorded yet', async ({ page }) => {
    const history = new AttendanceHistoryPage(page);
    await history.open();

    await history.chooseCohort('Saturday Sports');

    await expect(history.emptyState).toBeVisible();
    await expect(page).toHaveURL(/programId=p-sports/);
    await history.expectAccessible();
  });

  test('Given the history fails to load, then it says so and Try again loads it', async ({ page, api }) => {
    api.failNext('/api/attendance', 500);
    const history = new AttendanceHistoryPage(page);
    await history.open();

    await expect(history.failed).toBeVisible();
    await history.expectAccessible();
    api.recover('/api/attendance');
    await page.getByRole('button', { name: 'Try again' }).click();
    await expect(history.sessions).toBeVisible();
  });

  test('Given Roll Call is off, when the history is opened directly, then Today opens', async ({ page, api }) => {
    api.setModules('org-harbourview', ['Roster']);

    await page.goto('/check-in/history');

    await expect(page).toHaveURL(/\/$/);
  });
});

test.describe('Correct attendance as a program director', () => {
  test.use({ signedInAs: 'm-marisol' });

  test('Given Yusuf was marked absent last night, when Marisol corrects him to Excused with a reason, then the session recounts and a toast says it is in the audit log', async ({ page, api }) => {
    markedSessions(api);
    const history = new AttendanceHistoryPage(page);
    await history.open();

    await history.openCorrect('Wed 4 Nov');
    await expect(history.dialog.getByLabel('Youth')).toContainText('Yusuf Haddad · Absent');
    await history.expectAccessible();
    await history.correct({ youth: 'Yusuf Haddad · Absent', mark: 'Excused', reason: 'Nour Haddad emailed on Wednesday morning that Yusuf had a dentist appointment.' });

    await expect(history.dialog).toBeHidden();
    await expect(page.getByTestId('toast').filter({ hasText: 'Attendance corrected' })).toContainText('Yusuf Haddad · Wed 4 Nov · Excused. The change is in the audit log.');
    await expect.poll(() => history.row(history.sessions, 'Wed 4 Nov')).toEqual(['Wed 4 Nov', 'Tutoring night', '1', '1', '2', '0', '50%', 'Recorded', 'Correct']);
    expect(api.attendanceRecord('e-tutoring-yesterday', 'c-yusuf')).toMatchObject({ status: 'Absent', excused: true });
  });

  test('Given the correction dialog, when Marisol saves without a reason, then it asks why beside the field and in a summary', async ({ page, api }) => {
    markedSessions(api);
    const history = new AttendanceHistoryPage(page);
    await history.open();
    await history.openCorrect('Wed 4 Nov');

    await history.correct({ youth: 'Yusuf Haddad · Absent', mark: 'Excused', reason: '' });

    await expect(history.dialog.getByTestId('correct-reason-error')).toHaveText('Say why you’re correcting it.');
    await expect(history.dialog.getByRole('link', { name: 'Say why you’re correcting it.' })).toBeVisible();
    await history.expectAccessible();
  });

  test('Given the server fails, when Marisol saves a correction, then her choice and reason stay to try again', async ({ page, api }) => {
    markedSessions(api);
    api.failNext('/api/sessions/e-tutoring-yesterday/attendance/c-yusuf', 500);
    const history = new AttendanceHistoryPage(page);
    await history.open();
    await history.openCorrect('Wed 4 Nov');

    await history.correct({ youth: 'Yusuf Haddad · Absent', mark: 'Excused', reason: 'Dentist.' });

    await expect(history.dialog.getByText('That didn’t go through')).toBeVisible();
    await expect(history.dialog.getByLabel('Why are you correcting it?')).toHaveValue('Dentist.');
    expect(api.attendanceRecord('e-tutoring-yesterday', 'c-yusuf')?.excused).toBe(false);
  });
});

test.describe('Review attendance as a mentor', () => {
  test.use({ signedInAs: 'm-daniel' });

  test('Given Daniel leads After‑School Tutoring, when he opens the history, then he sees only his cohort and cannot correct', async ({ page, api }) => {
    api.setCohortTeam('p-tutoring', 'm-daniel');
    markedSessions(api);
    const history = new AttendanceHistoryPage(page);
    await history.open();

    await expect(history.cohort.locator('option')).toHaveText(['After-School Tutoring']);
    await expect(history.stat('Attendance rate')).toHaveText('60%');
    await expect(history.correctButtons()).toHaveCount(0);
    await history.expectAccessible();
  });
});

test.describe('Attendance history for a youth worker', () => {
  test.use({ signedInAs: 'm-aisha' });

  test('Given Aisha, when she opens the history, then it says who it is for', async ({ page }) => {
    const history = new AttendanceHistoryPage(page);
    await history.open();

    await expect(history.forbidden).toBeVisible();
    await history.expectAccessible();
  });
});
