import { test, expect } from '../../fixtures/test';
import { CheckInPage } from '../../pages/check-in.page';
import { ShellPage } from '../../pages/shell.page';
import { TodayPage } from '../../pages/today.page';

// Acceptance Test
// Traces to: L2-095 criteria 2, 3, 5 and 6
// Description: a mentor takes attendance for his cohort's session in Roll Call; anyone running a session marks the rest present in one go.
test.describe('A mentor takes attendance for his cohort’s session', () => {
  test.use({ signedInAs: 'm-daniel' });

  test('Given Daniel is on After‑School Tutoring’s team, when he opens Check-in from Today, then he runs Tutoring night without medical flags, Quick Cards or sign-out', async ({ page, api }) => {
    api.setCohortTeam('p-tutoring', 'm-hana', ['m-daniel']);
    const today = new TodayPage(page);
    await today.open();
    expect(await today.yourWork()).toEqual(['Mentoring', 'Check-in']);
    await today.card('Your work').getByRole('link', { name: /Check-in/ }).click();

    const checkIn = new CheckInPage(page);
    await expect(checkIn.heading).toHaveText('Tutoring night');
    expect(await checkIn.names()).toEqual(['Jordan Thompson', 'Mateo Rivera', 'Sofía Rivera', 'Yusuf Haddad']);
    await expect(checkIn.roster.getByTestId('medical-flag')).toHaveCount(0);
    await expect(checkIn.roster.getByRole('link')).toHaveCount(0);
    await checkIn.expectAccessible();
    await checkIn.expectNoHorizontalScroll();

    await checkIn.openOptions('Jordan Thompson');
    await checkIn.mark('Late');
    await checkIn.openOptions('Sofía Rivera');
    await checkIn.mark('Excused');

    await expect(checkIn.row('Jordan Thompson')).toContainText('Late · checked in');
    await expect(checkIn.signOutButton('Jordan Thompson')).toHaveCount(0);
    await expect(checkIn.markRestPresentButton).toHaveAccessibleName('Mark the rest present, 2 not yet here');

    await checkIn.markRestPresent();

    await expect(page.getByTestId('toast').filter({ hasText: '2 marked present' })).toContainText('Everyone on the roster is marked.');
    await expect(checkIn.total('Checked in')).toHaveText('3');
    await expect(checkIn.total('Not yet')).toHaveText('0');
    await expect(checkIn.markRestPresentButton).toHaveCount(0);
    expect(api.attendanceRecord('e-tutoring-today', 'c-yusuf')?.status).toBe('Present');
    expect(api.attendanceRecord('e-tutoring-today', 'c-sofia')).toMatchObject({ status: 'Absent', excused: true });
    await checkIn.expectAccessible();
  });

  test('Given Daniel is only on Saturday Sports’ team, when he opens Check-in, then there is no session for him today', async ({ page, api }) => {
    api.setCohortTeam('p-sports', 'm-daniel');
    const checkIn = new CheckInPage(page);
    await checkIn.open();

    await expect(page.getByRole('heading', { name: 'No sessions today' })).toBeVisible();
  });

  test('Given Roll Call is off, when Daniel opens Check-in, then he lands on Today and Check-in is not offered', async ({ page, api }) => {
    api.setCohortTeam('p-tutoring', 'm-daniel');
    api.setModules('org-harbourview', ['Roster', 'Learning', 'Mentoring']);

    await page.goto('/check-in');

    await expect(page).toHaveURL(/\/$/);
    const shell = new ShellPage(page);
    expect(await shell.visibleNavigationLabels()).toEqual(['Today', 'Mentoring', 'More']);
    expect(await new TodayPage(page).yourWork()).toEqual(['Mentoring']);
  });
});

test.describe('Mark the rest present as a site lead', () => {
  test('Given one child is checked in, when Jaylen marks the rest present, then the other three are checked in and one toast says so', async ({ page, api }) => {
    const checkIn = new CheckInPage(page);
    await checkIn.open();
    await checkIn.checkIn('Mateo Rivera');

    await checkIn.markRestPresent();

    await expect(page.getByTestId('toast').filter({ hasText: '3 marked present' })).toBeVisible();
    await expect(checkIn.total('Checked in')).toHaveText('4');
    expect(['c-jordan', 'c-sofia', 'c-yusuf'].map((c) => api.attendanceRecord('e-tutoring-today', c)?.status)).toEqual(['Present', 'Present', 'Present']);
  });
});
