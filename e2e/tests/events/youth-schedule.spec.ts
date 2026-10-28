import { test, expect } from '../../fixtures/test';
import { RsvpDialog } from '../../pages/rsvp.page';
import { ShellPage } from '../../pages/shell.page';
import { YouthSchedulePage } from '../../pages/youth-schedule.page';

// Acceptance test. Traces to: L2-094 criteria 1, 2, 3, 5 and 6 (her sessions in the next four weeks by day with her answers; RSVP with a
// note, a toast and Change RSVP; the answer required, a failed send, a closed session; empty, failed and consent-required states; Roster
// off; a phone), L2-056, L2-035, L2-036.
const NOTE = 'Can I bring my inhaler on the bus?';

test.describe('A youth’s schedule and RSVPs', () => {
  test.use({ signedInAs: 'm-sofia' });

  test.beforeEach(({ api }) => {
    api.giveConsent('c-sofia');
    api.addWeeklySessions('p-tutoring', 'Tutoring night', '2026-11-12T21:00:00Z', 'Harbourview Community Centre, Room 2');
  });

  test('Given Sofía is in After-School Tutoring, when she opens Schedule, then her next four weeks show by day, not replied yet', async ({ page }) => {
    const shell = new ShellPage(page);
    const schedule = new YouthSchedulePage(page);
    await page.goto('/learning');

    await shell.primaryNavigation.getByRole('link', { name: 'Schedule' }).click();

    await expect(schedule.heading).toHaveText('Your schedule');
    expect(await schedule.days()).toEqual(['Thursday 12 November', 'Saturday 14 November', 'Thursday 19 November', 'Thursday 26 November', 'Thursday 3 December']);
    expect(await schedule.sessions()).toEqual(['Tutoring night', 'Fall field trip: Royal Botanical Gardens', 'Tutoring night', 'Tutoring night', 'Tutoring night']);
    await expect(schedule.session('Fall field trip: Royal Botanical Gardens', 'Saturday 14 November')).toContainText('Not replied');
    await expect(schedule.session('Fall field trip: Royal Botanical Gardens', 'Saturday 14 November')).toContainText('After-School Tutoring');
    await schedule.expectAccessible();
    await schedule.expectNoHorizontalScroll();
  });

  test('Given the field trip, when she RSVPs going with a note, then a toast says so and the trip shows Going; she can change it', async ({ page }) => {
    const schedule = new YouthSchedulePage(page);
    const dialog = new RsvpDialog(page);
    await schedule.open();

    await schedule.rsvp('Fall field trip: Royal Botanical Gardens', 'Saturday 14 November');
    await dialog.expectOpen();
    await expect(dialog.session).toContainText('Fall field trip: Royal Botanical Gardens');
    await dialog.send();
    await expect(dialog.responseError).toHaveText('Choose whether you’re going.');
    await dialog.expectAccessible();

    await dialog.answer('Yes, I’ll be there').check();
    await dialog.note.fill(NOTE);
    await dialog.send();

    await dialog.expectClosed();
    await expect(schedule.toast).toContainText('RSVP sent');
    await expect(schedule.toast).toContainText('Fall field trip: Royal Botanical Gardens · Going');
    const trip = schedule.session('Fall field trip: Royal Botanical Gardens', 'Saturday 14 November');
    await expect(trip).toContainText('Going');
    await expect(trip).toContainText(`Your note: ${NOTE}`);
    await schedule.expectAccessible();

    await schedule.rsvp('Fall field trip: Royal Botanical Gardens', 'Saturday 14 November');
    await expect(dialog.answer('Yes, I’ll be there')).toBeChecked();
    await expect(dialog.note).toHaveValue(NOTE);
    await dialog.answer('Maybe').check();
    await dialog.send();
    await dialog.expectClosed();
    await expect(trip).toContainText('Maybe');
  });

  test('Given the send fails, when she sends, then the dialog says so and keeps her answer', async ({ page, api }) => {
    const schedule = new YouthSchedulePage(page);
    const dialog = new RsvpDialog(page);
    await schedule.open();
    api.failNext('/api/schedule/e-rbg/rsvp', 500);

    await schedule.rsvp('Fall field trip: Royal Botanical Gardens', 'Saturday 14 November');
    await dialog.answer('Can’t make it').check();
    await dialog.note.fill('Dentist appointment.');
    await dialog.send();

    await expect(dialog.alert).toContainText('That didn’t go through');
    await expect(dialog.answer('Can’t make it')).toBeChecked();
    await expect(dialog.note).toHaveValue('Dentist appointment.');
    await dialog.expectAccessible();
  });

  test('Given the trip is cancelled while the dialog is open, when she sends, then RSVPs are closed and her schedule shows it cancelled', async ({ page, api }) => {
    const schedule = new YouthSchedulePage(page);
    const dialog = new RsvpDialog(page);
    await schedule.open();

    await schedule.rsvp('Fall field trip: Royal Botanical Gardens', 'Saturday 14 November');
    api.cancelSession('e-rbg');
    await dialog.answer('Yes, I’ll be there').check();
    await dialog.send();

    await expect(dialog.alert).toContainText('RSVPs are closed for this session');
    await dialog.close();
    const trip = schedule.session('Fall field trip: Royal Botanical Gardens', 'Saturday 14 November');
    await expect(trip).toContainText('Cancelled');
    await expect(trip.getByRole('button', { name: /RSVP/ })).toHaveCount(0);
  });

  test('Given the schedule fails to load, when she opens it, then it says so and Try again loads it', async ({ page, api }) => {
    api.failNext('/api/schedule', 500);
    const schedule = new YouthSchedulePage(page);
    await schedule.open();

    await expect(schedule.failed).toBeVisible();
    await schedule.expectAccessible();
    api.recover('/api/schedule');
    await schedule.retry();
    await expect.poll(() => schedule.sessions()).toHaveLength(5);
  });

  test('Given Roster is off, when she opens /schedule, then Today opens, Schedule is not offered and the API answers 404', async ({ page, api }) => {
    api.setModules('org-harbourview', []);
    const schedule = new YouthSchedulePage(page);
    const shell = new ShellPage(page);

    await page.goto('/schedule');

    await expect(page).toHaveURL(/\/$/);
    await expect(shell.primaryNavigation.getByRole('link', { name: 'Schedule' })).toHaveCount(0);
    expect(await schedule.apiStatus()).toBe(404);
    expect(await schedule.rsvpStatus('e-rbg', { response: 'Going', note: '' })).toBe(404);
  });
});

test.describe('A youth with nothing to answer', () => {
  test.use({ signedInAs: 'm-nadia' });

  test('Given Nadia is in no program, when she opens Schedule, then it says nothing is scheduled', async ({ page }) => {
    const schedule = new YouthSchedulePage(page);

    await schedule.open();

    await expect(schedule.empty).toBeVisible();
    await schedule.expectAccessible();
  });
});

test.describe('A youth whose guardian has not agreed', () => {
  test.use({ signedInAs: 'm-sofia' });

  test('Given Sofía has no guardian consent, when she opens Schedule, then the server refuses and the page says a guardian must agree', async ({ page }) => {
    const schedule = new YouthSchedulePage(page);

    await schedule.open();

    await expect(schedule.consentRequired).toBeVisible();
    expect(await schedule.apiStatus()).toBe(403);
    await schedule.expectAccessible();
  });
});

test.describe('Staff and the youth schedule', () => {
  test.use({ signedInAs: 'm-marisol' });

  test('Given Marisol, then Schedule is not in her navigation and the schedule API refuses her', async ({ page }) => {
    const shell = new ShellPage(page);
    const schedule = new YouthSchedulePage(page);
    await page.goto('/');

    await expect(shell.primaryNavigation.getByRole('link', { name: 'Schedule' })).toHaveCount(0);
    expect(await schedule.apiStatus()).toBe(403);
  });
});
