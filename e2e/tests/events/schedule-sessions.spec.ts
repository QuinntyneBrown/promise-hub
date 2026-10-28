import { test, expect } from '../../fixtures/test';
import { EventsPage } from '../../pages/events.page';

// Acceptance test. Traces to: L2-093 criteria 1, 2 and 5 (Repeat weekly creates a session every week through the program's last day and
// says how many; a start after the last day is refused beside Starts; editing offers no Repeat weekly), L2-012, L2-035.
test.describe('Scheduling weekly sessions as a program director', () => {
  test.use({ signedInAs: 'm-marisol' });

  test('Given the new event form, when Tutoring night is created to repeat weekly, then 33 sessions are scheduled and the first says it repeats', async ({ page }) => {
    const events = new EventsPage(page);
    await events.open();
    await page.getByRole('link', { name: 'New event' }).click();
    await expect(events.repeatWeekly).not.toBeChecked();

    await events.fillEvent({ name: 'Tutoring night', program: 'After-School Tutoring', startsAt: '2026-11-12T16:00', endsAt: '2026-11-12T18:00', place: 'Harbourview Community Centre, Room 2', slip: false });
    await events.repeatWeekly.check();
    await expect(page.getByText('Every Thursday at this time, until the program’s last day.')).toBeVisible();
    await events.expectAccessible();
    await events.submitEvent();

    await expect(events.toast).toContainText('Event created');
    await expect(events.toast).toContainText('Tutoring night · 33 weekly sessions');
    await expect(events.heading).toHaveText('Tutoring night');
    await expect(events.details).toContainText('Weekly · 33 sessions');
    await events.expectAccessible();

    await page.getByRole('link', { name: 'Edit' }).click();
    await expect(events.heading).toHaveText('Edit event');
    await expect(events.repeatWeekly).toHaveCount(0);
  });

  test('Given Repeat weekly, when the start is after the program’s last day, then the error says when the program ends', async ({ page }) => {
    const events = new EventsPage(page);
    await events.open();
    await page.getByRole('link', { name: 'New event' }).click();

    await events.fillEvent({ name: 'Tutoring night', program: 'After-School Tutoring', startsAt: '2027-07-01T16:00', endsAt: '2027-07-01T18:00', slip: false });
    await events.repeatWeekly.check();
    await events.submitEvent();

    await expect(page.getByTestId('startsAt-error')).toHaveText('Start on or before the program’s last day, Thu 24 Jun 2027.');
    await events.expectAccessible();
  });
});
