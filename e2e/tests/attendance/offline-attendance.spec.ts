import { test, expect } from '../../fixtures/test';
import { CheckInPage } from '../../pages/check-in.page';
import { ShellPage } from '../../pages/shell.page';

// Acceptance Test
// Traces to: L2-096 criteria 1 and 2, L2-098 criteria 1 and 3, L2-099 criteria 1 to 3
// Description: late and excused marks made without signal wait on the phone, show as queued, and sync in order with their flags.
test.describe('Take attendance offline as a mentor', () => {
  test.use({ signedInAs: 'm-daniel' });

  test('Given the roster opened online, when the signal drops and Daniel marks Yusuf late and Sofía excused, then both wait on the phone and sync with their flags when it returns', async ({ page, api }) => {
    api.setCohortTeam('p-tutoring', 'm-daniel');
    const checkIn = new CheckInPage(page);
    await checkIn.open();
    await expect(checkIn.row('Yusuf Haddad')).toBeVisible();

    api.setOffline(true);
    await new ShellPage(page).openSection('Today');
    await checkIn.openFromNavigation();
    await expect(checkIn.offlineBanner).toContainText('Roster saved');
    await checkIn.openOptions('Yusuf Haddad');
    await checkIn.mark('Late');
    await checkIn.openOptions('Sofía Rivera');
    await checkIn.mark('Excused');

    await expect(checkIn.row('Yusuf Haddad')).toContainText('waiting to sync');
    await expect(checkIn.row('Sofía Rivera')).toContainText('waiting to sync');
    await expect(checkIn.syncChip).toHaveText('2 queued');
    await expect(checkIn.offlineBanner).toContainText('2 waiting to sync.');
    await expect(page.getByTestId('toast').filter({ hasText: 'Yusuf Haddad saved on this phone' })).toBeVisible();
    await checkIn.expectAccessible();

    api.setOffline(false);
    await checkIn.connectionReturns();

    await expect(page.getByRole('status').filter({ hasText: '2 check-ins synced' })).toBeVisible();
    await expect(checkIn.syncChip).toHaveCount(0);
    await expect(checkIn.offlineBanner).toHaveCount(0);
    await expect(checkIn.row('Yusuf Haddad')).toContainText('Late · checked in');
    await expect(checkIn.row('Sofía Rivera')).toContainText('Excused');
    expect(api.attendanceRecord('e-tutoring-today', 'c-yusuf')).toMatchObject({ status: 'Present', late: true });
    expect(api.attendanceRecord('e-tutoring-today', 'c-sofia')).toMatchObject({ status: 'Absent', excused: true });
  });

  test('Given a queued late mark the server refuses, when it syncs, then it leaves the queue and the server’s roster stands', async ({ page, api }) => {
    api.setCohortTeam('p-tutoring', 'm-daniel');
    const checkIn = new CheckInPage(page);
    await checkIn.open();
    await expect(checkIn.row('Yusuf Haddad')).toBeVisible();

    api.setOffline(true);
    await checkIn.openOptions('Yusuf Haddad');
    await checkIn.mark('Late');
    await expect(checkIn.syncChip).toHaveText('1 queued');

    api.setOffline(false);
    api.failNext('/api/sessions/e-tutoring-today/check-ins', 422);
    await checkIn.connectionReturns();

    await expect(checkIn.syncChip).toHaveCount(0);
    await expect(checkIn.row('Yusuf Haddad')).toContainText('Not yet here');
    expect(api.attendanceRecord('e-tutoring-today', 'c-yusuf')).toBeUndefined();
  });
});
