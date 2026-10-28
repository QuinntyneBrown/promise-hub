import { test, expect } from '../../fixtures/test';
import { EventsCalendarPage } from '../../pages/events-calendar.page';
import { EventsPage } from '../../pages/events.page';

// Acceptance test. Traces to: L2-093 criteria 3, 4 and 5 (the month's sessions by day with today marked and cancelled ones said in words,
// month navigation kept in the address, the program filter, empty and failed states; Roster off; the phone agenda), L2-005, L2-035, L2-036.
test.describe('The events calendar for a program director', () => {
  test.use({ signedInAs: 'm-marisol' });

  test('Given Harbourview’s November, when Calendar opens from Events, then every session shows on its day and opens its event', async ({ page }) => {
    const events = new EventsPage(page);
    const calendar = new EventsCalendarPage(page);
    await events.open();

    await page.getByRole('link', { name: 'Calendar' }).click();

    await expect(calendar.heading).toHaveText('Calendar');
    await expect(calendar.month).toHaveText('November 2026');
    await expect.poll(() => calendar.entries()).toEqual([
      expect.stringContaining('Tutoring night'),
      expect.stringContaining('Tutoring night'),
      expect.stringContaining('Saturday Sports'),
      expect.stringContaining('Fall field trip: Royal Botanical Gardens'),
    ]);
    if (!calendar.isPhone) await expect(calendar.today).toContainText('5');
    await calendar.expectAccessible();
    await calendar.expectNoHorizontalScroll();

    await calendar.entry('Fall field trip').click();
    await expect(events.heading).toHaveText('Fall field trip: Royal Botanical Gardens');
  });

  test('Given the calendar, when the month changes, then the address keeps it and an empty month says so', async ({ page }) => {
    const calendar = new EventsCalendarPage(page);
    await calendar.open();

    await calendar.next();
    await expect(calendar.month).toHaveText('December 2026');
    await expect(page).toHaveURL(/month=2026-12/);
    await expect(calendar.empty).toHaveText('Nothing scheduled in December 2026');
    await expect(page.getByRole('link', { name: 'New event' }).last()).toBeVisible();
    await calendar.expectAccessible();

    await calendar.previous();
    await calendar.previous();
    await expect(calendar.month).toHaveText('October 2026');
    await calendar.thisMonth();
    await expect(calendar.month).toHaveText('November 2026');

    await page.goto('/events/calendar?month=2026-12');
    await expect(calendar.month).toHaveText('December 2026');
  });

  test('Given a program, when the calendar is narrowed to it, then only its sessions show; a cancelled session says Cancelled', async ({ page, api }) => {
    api.cancelSession('e-sports');
    const calendar = new EventsCalendarPage(page);
    await calendar.open();

    await expect(calendar.entry('Saturday Sports')).toContainText('Cancelled');
    await calendar.program('Saturday Sports');

    await expect.poll(() => calendar.entries()).toEqual([expect.stringContaining('Saturday Sports')]);
    await expect(page).toHaveURL(/programId=p-sports/);
    await calendar.expectAccessible();
  });

  test('Given the calendar fails to load, when it opens, then it says so and Try again loads it', async ({ page, api }) => {
    api.failNext('/api/events/calendar', 500);
    const calendar = new EventsCalendarPage(page);
    await calendar.open();

    await expect(calendar.failed).toBeVisible();
    await calendar.expectAccessible();
    api.recover('/api/events/calendar');
    await calendar.retry();
    await expect(calendar.month).toHaveText('November 2026');
  });

  test('Given Roster is off, when /events/calendar opens, then Today opens and the API answers 404', async ({ page, api }) => {
    api.setModules('org-harbourview', []);
    const calendar = new EventsCalendarPage(page);

    await page.goto('/events/calendar');

    await expect(page).toHaveURL(/\/$/);
    expect(await calendar.apiStatus()).toBe(404);
  });
});

test.describe('The events calendar at Northgate', () => {
  test.use({ signedInAs: 'm-grace' });

  test('Given Northgate’s admin, when the calendar opens, then only Northgate’s sessions show', async ({ page, api }) => {
    api.setModules('org-northgate', ['Roster', 'Slips', 'RollCall', 'QuickCards']);
    const calendar = new EventsCalendarPage(page);

    await calendar.open('2026-11');

    await expect.poll(() => calendar.entries()).toEqual([expect.stringContaining('Kids Club night')]);
  });
});
