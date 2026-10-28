import { test, expect } from '../../fixtures/test';
import type { ModuleId } from '../../fixtures/seed';
import { CheckInPage } from '../../pages/check-in.page';
import { TodayPage } from '../../pages/today.page';

const SUITE: ModuleId[] = ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports'];

// Acceptance Test
// Traces to: L2-100 criteria 1, 2, 6 and 7
// Description: a volunteer's Today shows the session he is assigned to today, with how many youth are on its roster, and Take attendance.
test.describe('A volunteer’s Today', () => {
  test.use({ signedInAs: 'm-leo' });

  test('Given Leo is assigned to tonight’s Tutoring night, when he opens Today, then he sees his session with its roster count and takes attendance from it', async ({ page }) => {
    const today = new TodayPage(page);
    await today.open();

    await expect(today.heading).toHaveText('Welcome, Leo');
    const card = today.volunteerSession('Tutoring night');
    await expect(card).toContainText('Your session today');
    await expect(card).toContainText('Harbourview Community Centre, Room 2');
    await expect(card).toContainText('4 youth on the roster');
    await expect(card).toContainText('0 of 4 checked in');
    expect(await today.yourWork()).toEqual(['Your schedule']);
    await expect(page.getByText('Mateo Rivera')).toHaveCount(0);
    await today.expectAccessible();
    await today.expectNoHorizontalScroll();

    await today.takeAttendance('Tutoring night');

    const checkIn = new CheckInPage(page);
    await expect(checkIn.heading).toHaveText('Tutoring night');
    await expect(page).toHaveURL(/\/check-in\/e-tutoring-today$/);
  });

  test('Given Leo is not assigned to any session today, when he opens Today, then it says so and points to his schedule', async ({ page, api }) => {
    api.setSessionStaff('e-tutoring-today', ['m-jaylen', 'm-aisha']);
    const today = new TodayPage(page);
    await today.open();

    await expect(today.noSessionToday).toBeVisible();
    await expect(page.getByText('You’re not assigned to a session today. Your schedule shows what’s next.')).toBeVisible();
    await expect(today.emptyStateAction('See your schedule')).toHaveAttribute('href', '/my-schedule');
    await today.expectAccessible();
  });

  test('Given his sessions fail to load, when he opens Today, then the card offers Try again and loads them again', async ({ page, api }) => {
    api.failNext('/api/sessions/today', 500);
    const today = new TodayPage(page);
    await today.open();

    await expect(today.sessionFailed).toBeVisible();
    await today.expectAccessible();
    api.recover('/api/sessions/today');

    await today.tryAgain();

    await expect(today.volunteerSession('Tutoring night')).toContainText('4 youth on the roster');
  });

  test('Given Roll Call is off, when Leo opens Today, then no session is shown or requested', async ({ page, api }) => {
    api.setModules('org-harbourview', SUITE.filter((m) => m !== 'RollCall' && m !== 'Pickup'));
    const today = new TodayPage(page);
    const paths = today.recordApiPaths();
    await today.open();

    await expect(today.nothingToDo).toBeVisible();
    await expect(today.volunteerSession('Tutoring night')).toHaveCount(0);
    expect(paths.filter((p) => p.startsWith('/api/sessions'))).toEqual([]);
  });
});
