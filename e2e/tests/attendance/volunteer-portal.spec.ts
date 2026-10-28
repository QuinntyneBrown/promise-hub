import { test, expect } from '../../fixtures/test';
import type { ModuleId } from '../../fixtures/seed';
import { CheckInPage } from '../../pages/check-in.page';
import { MySchedulePage } from '../../pages/my-schedule.page';
import { ShellPage } from '../../pages/shell.page';
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

// Acceptance Test
// Traces to: L2-101 criteria 1 to 6, L2-038
// Description: a volunteer reads the sessions he is assigned to in the next four weeks, from Schedule in his navigation.
test.describe('A volunteer’s schedule', () => {
  test.use({ signedInAs: 'm-leo' });

  test('Given Leo is assigned to tonight and to Saturday Sports, when he opens Schedule, then he sees both by day with their status and takes attendance tonight', async ({ page }) => {
    const shell = new ShellPage(page);
    const today = new TodayPage(page);
    await today.open();
    expect(await shell.visibleNavigationLabels()).toEqual(['Today', 'Check-in', 'Schedule', 'More']);
    await shell.openSection('Schedule');

    const schedule = new MySchedulePage(page);
    await expect(schedule.heading).toHaveText('Your schedule');
    await expect.poll(() => schedule.days()).toEqual(['Thursday 5 November', 'Saturday 7 November']);
    const tonight = schedule.session('Tutoring night', 'Thursday 5 November');
    await expect(tonight).toContainText('Harbourview Community Centre, Room 2 · After-School Tutoring · 4 youth');
    await expect(tonight).toContainText('Today');
    const saturday = schedule.session('Saturday Sports', 'Saturday 7 November');
    await expect(saturday).toContainText('Bennetto School gym · Saturday Sports · 2 youth');
    await expect(saturday).toContainText('Assigned');
    await expect(saturday.getByRole('link', { name: /Take attendance/ })).toHaveCount(0);
    await schedule.expectAccessible();
    await schedule.expectNoHorizontalScroll();

    await schedule.takeAttendance('Tutoring night', 'Thursday 5 November');

    await expect(new CheckInPage(page).heading).toHaveText('Tutoring night');
  });

  test('Given Saturday Sports was cancelled, when Leo opens Schedule, then it stays there marked Cancelled', async ({ page, api }) => {
    api.cancelSession('e-sports');
    const schedule = new MySchedulePage(page);
    await schedule.open();

    await expect(schedule.session('Saturday Sports', 'Saturday 7 November')).toContainText('Cancelled');
    await schedule.expectAccessible();
  });

  test('Given Leo is assigned to nothing, when he opens Schedule, then it says so and who assigns him', async ({ page, api }) => {
    api.setSessionStaff('e-tutoring-today', ['m-jaylen', 'm-aisha']);
    api.setSessionStaff('e-sports', []);
    const schedule = new MySchedulePage(page);
    await schedule.open();

    await expect(schedule.empty).toBeVisible();
    await expect(page.getByText('Your volunteer coordinator will add you.')).toBeVisible();
    await schedule.expectAccessible();
  });

  test('Given the schedule fails to load, when Leo opens it, then Try again loads it', async ({ page, api }) => {
    api.failNext('/api/sessions/mine', 500);
    const schedule = new MySchedulePage(page);
    await schedule.open();

    await expect(schedule.failed).toBeVisible();
    await schedule.expectAccessible();
    api.recover('/api/sessions/mine');
    await schedule.tryAgain();

    await expect.poll(() => schedule.days()).toEqual(['Thursday 5 November', 'Saturday 7 November']);
  });

  test('Given Roll Call is off, when Leo opens Schedule, then he lands on Today and Schedule is not offered', async ({ page, api }) => {
    api.setModules('org-harbourview', SUITE.filter((m) => m !== 'RollCall' && m !== 'Pickup'));
    const shell = new ShellPage(page);

    await page.goto('/my-schedule');

    await expect(page).toHaveURL(/\/$/);
    expect(await shell.visibleNavigationLabels()).toEqual(['Today', 'More']);
  });
});

test.describe('A youth on a volunteer’s schedule', () => {
  test.use({ signedInAs: 'm-sofia' });

  test('Given Sofía opens /my-schedule, when the server answers 403, then the page says the schedule is for people who run sessions', async ({ page }) => {
    const schedule = new MySchedulePage(page);
    await schedule.open();

    await expect(schedule.forbidden).toBeVisible();
    await schedule.expectAccessible();
  });
});
