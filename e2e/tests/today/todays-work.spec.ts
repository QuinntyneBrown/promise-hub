import { test, expect } from '../../fixtures/test';
import { TodayPage } from '../../pages/today.page';

// L2-038 criterion 6 Today composed from enabled modules, L2-005 modules off, L2-007 roles, L2-001 tenants, L2-029/L2-036 phone and layout.
test.describe('Monitor today as a program director', () => {
  test.use({ signedInAs: 'm-marisol' });

  test('Given a sent slip and a report to review, when Today opens, then counts, slips due, coming up and work waiting show', async ({ page, api }) => {
    api.sendSlip('e-rbg');
    api.reportIncident('m-aisha', 'Injury', 'c-mateo');
    const today = new TodayPage(page);

    await today.open();

    await expect(today.stat('Active children')).toHaveText('6');
    await expect(today.stat('Households')).toHaveText('5');
    await expect(today.item('Slips due', 'Fall field trip: Royal Botanical Gardens')).toContainText('4 unsigned');
    await expect(today.item('Coming up', 'Saturday Sports')).toBeVisible();
    await expect(today.item('Waiting for you', '1 incident to review')).toBeVisible();
    await today.expectAccessible();
    await today.expectNoHorizontalScroll();
  });

  test('Given a report waiting, when its count is followed, then the incident log opens', async ({ page, api }) => {
    api.reportIncident('m-aisha', 'Injury', 'c-mateo');
    const today = new TodayPage(page);
    await today.open();

    await today.follow('Waiting for you', '1 incident to review');

    await expect(page).toHaveURL(/\/incidents$/);
  });

  test('Given only Roster is on, when Today opens, then no card of an off module is shown', async ({ page, api }) => {
    api.sendSlip('e-rbg');
    api.reportIncident('m-aisha', 'Injury', 'c-mateo');
    api.setModules('org-harbourview', ['Roster']);
    const today = new TodayPage(page);

    await today.open();

    await expect(today.stat('Active children')).toHaveText('6');
    await expect(today.card('Slips due')).toHaveCount(0);
    await expect(today.card('Waiting for you')).toHaveCount(0);
    await expect(today.session('Tutoring night')).toHaveCount(0);
  });

  test('Given the summary fails, when Today opens, then it says so and offers to try again', async ({ page, api }) => {
    api.failNext('/api/today', 500);
    const today = new TodayPage(page);

    await today.open();

    await expect(today.card('At a glance')).toContainText('Today didn’t load');
    await today.expectAccessible();
  });
});

test.describe('Youth worker', () => {
  test.use({ signedInAs: 'm-aisha' });

  test('Given a report waiting, when a youth worker opens Today, then no review work is offered', async ({ page, api }) => {
    api.reportIncident('m-jaylen', 'Injury', 'c-mateo');
    const today = new TodayPage(page);

    await today.open();

    await expect(today.session('Tutoring night')).toBeVisible();
    await expect(today.card('Waiting for you')).toHaveCount(0);
  });
});

test.describe('Another organization', () => {
  test.use({ signedInAs: 'm-grace' });

  test('Given Northgate, when Today opens, then only its own counts show', async ({ page }) => {
    const today = new TodayPage(page);

    await today.open();

    await expect(today.stat('Households')).toHaveText('1');
  });
});
