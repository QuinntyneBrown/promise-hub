import { test, expect } from '../../fixtures/test';
import type { FakeApi } from '../../fixtures/fake-api';
import type { ModuleId } from '../../fixtures/seed';
import { MentorCheckInDialog } from '../../pages/mentor-check-in.page';
import { MentorCheckInsPage } from '../../pages/mentor-check-ins.page';
import { MentorYouthDetailPage } from '../../pages/mentor-youth-detail.page';
import { MentoringPage } from '../../pages/mentoring.page';

// Acceptance test. Traces to: L2-090 criteria 4, 5, 8 and 9 (his mentor check-ins newest first with filters, on the history page and the
// youth's record, never another mentor's, the empty, no-results, failed and forbidden states, Mentoring off), L2-065, L2-035, L2-036.
const ALL: ModuleId[] = ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports', 'Learning', 'Mentoring'];

function seedHistory(api: FakeApi): void {
  api.mentorCheckIns.seed({
    childId: 'c-jordan',
    youthName: 'Jordan Thompson',
    mentorId: 'm-daniel',
    date: '2026-10-29',
    kind: 'OneToOne',
    engagement: 'Steady',
    topics: 'Science fair project: a water filter from a plastic bottle.',
    followUpOn: '2026-11-03',
  });
  api.mentorCheckIns.seed({
    childId: 'c-mateo',
    youthName: 'Mateo Rivera',
    mentorId: 'm-daniel',
    date: '2026-11-05',
    kind: 'OneToOne',
    engagement: 'Engaged',
    topics: 'Fractions homework and the spelling bee on Friday.',
    actionItems: 'Practise ten spelling words each night.',
    privateNotes: 'Carmen mentioned money is tight this month.',
    followUpOn: '2026-11-12',
    shared: true,
    guardianInformed: true,
  });
  api.mentorCheckIns.seed({
    childId: 'c-yusuf',
    youthName: 'Yusuf Haddad',
    mentorId: 'm-daniel',
    date: '2026-11-04',
    kind: 'Call',
    engagement: 'Low',
    topics: 'Missed Tutoring night: football practice moved to Wednesdays.',
  });
  api.mentorCheckIns.seed({ childId: 'c-mateo', youthName: 'Mateo Rivera', mentorId: 'm-hana', date: '2026-11-05', kind: 'Call', engagement: 'Steady', topics: 'Hana’s own words.' });
}

test.describe('Mentor check-ins history', () => {
  test.use({ signedInAs: 'm-daniel' });

  test.beforeEach(({ api }) => {
    api.setModules('org-harbourview', ALL);
    api.assignYouthMentor('c-mateo', 'm-daniel');
    api.setCohortTeam('p-tutoring', 'm-hana', ['m-daniel']);
  });

  test('Given Daniel has logged mentor check-ins, when he opens Mentor check-ins from his dashboard, then he sees only his, newest first, with every detail', async ({
    page,
    api,
  }) => {
    seedHistory(api);
    const dashboard = new MentoringPage(page);
    const history = new MentorCheckInsPage(page);
    await dashboard.open();

    await dashboard.openCheckIns();

    await history.expectOpen();
    await expect(history.items).toHaveCount(3);
    await expect(history.items.nth(0)).toContainText('Mateo Rivera');
    await expect(history.items.nth(0)).toContainText('1:1 · Thu 5 Nov · Went engaged');
    await expect(history.items.nth(0)).toContainText('Fractions homework and the spelling bee on Friday.');
    await expect(history.items.nth(0)).toContainText('Action items: Practise ten spelling words each night.');
    await expect(history.items.nth(0)).toContainText('Follow-up Thu 12 Nov');
    await expect(history.items.nth(0)).toContainText('Guardian informed');
    await expect(history.items.nth(0)).toContainText('Private notes: Carmen mentioned money is tight this month.');
    await expect(history.items.nth(0)).toContainText('Shared');
    await expect(history.items.nth(1)).toContainText('Yusuf Haddad');
    await expect(history.items.nth(1)).toContainText('Private');
    await expect(history.items.nth(2)).toContainText('Jordan Thompson');
    await expect(page.getByText('Hana’s own words.')).toHaveCount(0);
    await history.expectNoHorizontalScroll();
    await history.expectAccessible();
  });

  test('Given his history, when he filters by youth and by type, then the list narrows and a filter nothing matches offers Clear filters', async ({ page, api }) => {
    seedHistory(api);
    const history = new MentorCheckInsPage(page);
    await history.open();

    await history.filterYouth('Mateo Rivera');
    await expect(history.items).toHaveCount(1);
    await history.filterType('Session');
    await expect(history.noResults).toBeVisible();
    await history.expectAccessible();
    await history.clearFilters();

    await expect(history.items).toHaveCount(3);
    await history.filterType('Call');
    await expect(history.items).toHaveCount(1);
    await expect(history.items.first()).toContainText('Yusuf Haddad');
  });

  test('Given no mentor check-ins yet, when he logs one from the history for Sofía, then it tops the list with a toast', async ({ page, api }) => {
    const history = new MentorCheckInsPage(page);
    const dialog = new MentorCheckInDialog(page);
    await history.open();
    await expect(history.empty).toBeVisible();
    await history.expectAccessible();

    await history.logCheckIn();
    await dialog.fill({ youth: 'Sofía Rivera', date: '2026-11-05', kind: 'Session', went: 'Thriving', topics: 'Led the group reflection.', share: true });
    await dialog.save();

    await expect(history.toast('Mentor check-in saved')).toBeVisible();
    await expect(history.items).toHaveCount(1);
    await expect(history.items.first()).toContainText('Sofía Rivera');
    await expect(history.items.first()).toContainText('Shared');
    expect(api.mentorCheckIns.rows[0]).toMatchObject({ childId: 'c-sofia', shared: true });
  });

  test('Given the history fails to load, when he opens it, then the error state offers Try again and it loads', async ({ page, api }) => {
    seedHistory(api);
    api.failNext('/api/mentoring/check-ins', 500);
    const history = new MentorCheckInsPage(page);
    await history.open();

    await expect(history.failed).toBeVisible();
    await history.expectAccessible();
    api.recover('/api/mentoring/check-ins');
    await history.retry();

    await expect(history.items).toHaveCount(3);
  });
});

test.describe('Mentor check-ins on the youth record', () => {
  test.use({ signedInAs: 'm-daniel' });

  test.beforeEach(({ api }) => {
    api.setModules('org-harbourview', ALL);
    api.assignYouthMentor('c-mateo', 'm-daniel');
  });

  test('Given Daniel logged a mentor check-in with Mateo, when he opens Mateo’s record, then the card lists only Mateo’s and leads to all of them', async ({
    page,
    api,
  }) => {
    seedHistory(api);
    const record = new MentorYouthDetailPage(page);
    await record.open('c-mateo');

    await expect(record.checkIns).toHaveCount(1);
    await expect(record.checkIns.first()).toContainText('1:1 · Thu 5 Nov');
    await expect(record.checkIns.first()).toContainText('Fractions homework');
    await record.expectAccessible();
    await record.openAllCheckIns();

    await new MentorCheckInsPage(page).expectOpen();
  });

  test('Given no mentor check-ins with Mateo, when he logs one from the record, then the empty card fills with it', async ({ page }) => {
    const record = new MentorYouthDetailPage(page);
    const dialog = new MentorCheckInDialog(page);
    await record.open('c-mateo');
    await expect(record.noCheckIns).toBeVisible();

    await record.logCheckIn();
    await dialog.fill({ date: '2026-11-05', kind: 'Call', went: 'Steady', topics: 'Checked in about the spelling bee.' });
    await dialog.save();

    await expect(record.checkIns).toHaveCount(1);
    await expect(record.checkIns.first()).toContainText('Checked in about the spelling bee.');
  });
});

test.describe('Mentor check-ins for other roles and with Mentoring off', () => {
  test.describe('a program director', () => {
    test.use({ signedInAs: 'm-marisol' });

    test('Given Marisol opens /mentoring/check-ins, when it loads, then it says Mentoring is for mentors and the API answers 403', async ({ page }) => {
      const history = new MentorCheckInsPage(page);
      await history.open();

      await expect(history.forbidden).toBeVisible();
      expect(await history.apiStatus()).toBe(403);
      await history.expectAccessible();
    });
  });

  test.describe('a mentor', () => {
    test.use({ signedInAs: 'm-daniel' });

    test('Given Mentoring is off, when /mentoring/check-ins is opened, then Today opens and the API answers 404', async ({ page, api }) => {
      api.setModules('org-harbourview', ALL.filter((m) => m !== 'Mentoring'));
      const history = new MentorCheckInsPage(page);
      await history.open();

      await expect(page).toHaveURL(/\/$/);
      expect(await history.apiStatus()).toBe(404);
    });
  });
});
