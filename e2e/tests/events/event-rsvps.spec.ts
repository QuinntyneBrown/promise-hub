import { test, expect } from '../../fixtures/test';
import { EventsPage } from '../../pages/events.page';

// Acceptance test. Traces to: L2-094 criteria 4 and 6 (staff read how many are going, maybe, can't make it and have not replied, and each
// answer with its note; with no answers the card says who can RSVP), L2-035.
test.describe('RSVPs on the event for a program director', () => {
  test.use({ signedInAs: 'm-marisol' });

  test('Given Sofía is going and Nadia maybe, when Marisol opens the field trip, then the RSVPs card counts them and shows each note', async ({ page, api }) => {
    api.placeInProgram('c-nadia', 'p-tutoring');
    api.seedRsvp({ eventId: 'e-rbg', childId: 'c-sofia', response: 'Going', note: 'Can I bring my inhaler on the bus?' });
    api.seedRsvp({ eventId: 'e-rbg', childId: 'c-nadia', response: 'Maybe', note: 'I might have a shift at work.', answeredAt: '2026-11-04T20:00:00Z' });
    const events = new EventsPage(page);
    await events.open();

    await events.openEvent('Fall field trip: Royal Botanical Gardens');

    await expect(events.rsvpCount('Going')).toHaveText('1');
    await expect(events.rsvpCount('Maybe')).toHaveText('1');
    await expect(events.rsvpCount('Can’t make it')).toHaveText('0');
    await expect(events.rsvpCount('No reply')).toHaveText('0');
    await expect(events.rsvpAnswer('Sofía Rivera')).toContainText('Going');
    await expect(events.rsvpAnswer('Sofía Rivera')).toContainText('Can I bring my inhaler on the bus?');
    await expect(events.rsvpAnswer('Nadia Haddad')).toContainText('Maybe');
    await events.expectAccessible();
    await events.expectNoHorizontalScroll();
  });

  test('Given nobody has answered, when Marisol opens the field trip, then the counts are zero and the card says who can RSVP', async ({ page }) => {
    const events = new EventsPage(page);
    await events.open();

    await events.openEvent('Fall field trip: Royal Botanical Gardens');

    await expect(events.rsvpCount('Going')).toHaveText('0');
    await expect(events.rsvpCount('No reply')).toHaveText('1');
    await expect(events.rsvps).toContainText('Nobody has replied yet. Youth on the roster who sign in can RSVP from their schedule.');
    await events.expectAccessible();
  });
});
