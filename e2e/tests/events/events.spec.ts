import { test, expect } from '../../fixtures/test';
import { EventsPage } from '../../pages/events.page';

// L2-012 events, L2-007 roles, L2-035 accessibility.
test.describe('Events as a program director', () => {
  test.use({ signedInAs: 'm-marisol' });

  test('Given Harbourview events, when Events opens, then upcoming events list with their slip status', async ({ page }) => {
    const events = new EventsPage(page);

    await events.open();

    expect(await events.names()).toEqual(['Tutoring night', 'Saturday Sports', 'Fall field trip: Royal Botanical Gardens']);
    await expect(events.row('Fall field trip: Royal Botanical Gardens')).toContainText('Slip not written yet');
    await expect(events.row('Tutoring night')).toContainText('No slip needed');
    await events.expectAccessible();
    await events.expectNoHorizontalScroll();

    await events.filter('Needs slips');
    await expect.poll(() => events.names()).toEqual(['Fall field trip: Royal Botanical Gardens']);
    await events.filter('Past');
    await expect.poll(() => events.names()).toEqual(['Tutoring night']);
  });

  test('Given the new event form, when an event that needs a slip is created, then it opens saying the slip is not written yet', async ({ page }) => {
    const events = new EventsPage(page);
    await events.open();
    await page.getByRole('link', { name: 'New event' }).click();
    await expect(events.heading).toHaveText('New event');
    await events.expectAccessible();

    await events.submitEvent();
    await expect(page.getByTestId('name-error')).toHaveText('Enter the event name.');

    await events.fillEvent({ name: 'Swim trip: Jimmy Thompson Pool', program: 'Saturday Sports', startsAt: '2026-11-28T10:00', endsAt: '2026-11-28T13:00', place: 'Jimmy Thompson Pool', slip: true });
    await events.submitEvent();

    await expect(events.heading).toHaveText('Swim trip: Jimmy Thompson Pool');
    await expect(events.slipCard).toContainText('Slip not written yet');
    await expect(events.details).toContainText('Saturday Sports');
    await events.expectAccessible();
  });

  test('Given the field trip, when cancelled with a message, then it shows as cancelled by Marisol', async ({ page }) => {
    const events = new EventsPage(page);
    await events.open();
    await events.openEvent('Fall field trip: Royal Botanical Gardens');

    await events.cancel('The RBG trip is cancelled (bus strike). New date soon.');

    await expect(events.cancelledNotice).toBeVisible();
    await expect(events.cancelledNotice).toContainText('Marisol Delgado');
    await events.expectAccessible();
  });
});

test.describe('Events for a site lead', () => {
  test('Given a site lead, when an event opens, then they can edit but not cancel it', async ({ page }) => {
    const events = new EventsPage(page);
    await events.open();
    await events.openEvent('Fall field trip: Royal Botanical Gardens');

    await expect(page.getByRole('link', { name: 'Edit' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'More actions' })).toBeHidden();
  });
});
