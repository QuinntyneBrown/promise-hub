import { test, expect } from '../../fixtures/test';
import type { ModuleId } from '../../fixtures/seed';
import { MentorCheckInDialog } from '../../pages/mentor-check-in.page';
import { MentorYouthDetailPage } from '../../pages/mentor-youth-detail.page';

// Acceptance test. Traces to: L2-090 criteria 1, 2, 3, 7, 8 and 9 (logging a mentor check-in from a youth's record, the server's field
// errors, busy and failed, audited without its words, Mentoring off), L2-065, L2-035, L2-036.
const ALL: ModuleId[] = ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports', 'Learning', 'Mentoring'];
const TOPICS = 'Fractions homework and the spelling bee on Friday.';
const PRIVATE = 'Carmen mentioned money is tight this month.';

test.describe('Logging a mentor check-in', () => {
  test.use({ signedInAs: 'm-daniel' });

  test.beforeEach(({ api }) => {
    api.setModules('org-harbourview', ALL);
    api.assignYouthMentor('c-mateo', 'm-daniel');
  });

  test('Given Daniel mentors Mateo, when he logs a mentor check-in from Mateo’s record, then it is saved privately with everything he wrote and a toast confirms it', async ({
    page,
    api,
  }) => {
    const record = new MentorYouthDetailPage(page);
    const dialog = new MentorCheckInDialog(page);
    await record.open('c-mateo');
    await record.expectOpen('Mateo Rivera');

    await record.logCheckIn();

    await dialog.expectOpen();
    await expect(dialog.fixedYouth('Mateo Rivera')).toBeVisible();
    await dialog.fill({
      date: '2026-11-05',
      kind: '1:1',
      went: 'Engaged',
      topics: TOPICS,
      actionItems: 'Practise ten spelling words each night.',
      privateNotes: PRIVATE,
      followUp: '2026-11-12',
      guardianInformed: true,
    });
    await dialog.expectAccessible();
    await dialog.save();

    await expect(dialog.dialog).toBeHidden();
    await expect(dialog.toast('Mentor check-in saved')).toBeVisible();
    expect(api.mentorCheckIns.rows).toHaveLength(1);
    expect(api.mentorCheckIns.rows[0]).toMatchObject({
      childId: 'c-mateo',
      mentorId: 'm-daniel',
      date: '2026-11-05',
      kind: 'OneToOne',
      engagement: 'Engaged',
      topics: TOPICS,
      privateNotes: PRIVATE,
      followUpOn: '2026-11-12',
      shared: false,
      guardianInformed: true,
    });
  });

  test('Given a future date and a follow-up before it, when he saves, then the server’s errors show beside the fields and in a summary and nothing is saved', async ({
    page,
    api,
  }) => {
    const record = new MentorYouthDetailPage(page);
    const dialog = new MentorCheckInDialog(page);
    await record.open('c-mateo');
    await record.logCheckIn();

    await dialog.fill({ date: '2026-11-09', kind: 'Call', went: 'Low', followUp: '2026-11-08' });
    await dialog.save();

    await expect(dialog.summary).toBeVisible();
    await expect(dialog.summary).toContainText('The date can’t be in the future.');
    await expect(dialog.summary).toContainText('The follow-up can’t be before the check-in.');
    await expect(dialog.field('Date')).toHaveAttribute('aria-invalid', 'true');
    expect(api.mentorCheckIns.rows).toHaveLength(0);
    await dialog.expectAccessible();
  });

  test('Given he chooses nothing for how they met or how it went, when he saves, then the dialog asks for both before calling the server', async ({ page, api }) => {
    const record = new MentorYouthDetailPage(page);
    const dialog = new MentorCheckInDialog(page);
    await record.open('c-mateo');
    await record.logCheckIn();

    await dialog.fill({ date: '2026-11-05' });
    await dialog.save();

    await expect(dialog.summary).toContainText('Choose how you met.');
    await expect(dialog.summary).toContainText('Choose how it went.');
    expect(api.mentorCheckIns.rows).toHaveLength(0);
  });

  test('Given the save fails, when he saves, then the dialog says so and keeps everything he wrote', async ({ page, api }) => {
    api.mentorCheckIns.failSaves = true;
    const record = new MentorYouthDetailPage(page);
    const dialog = new MentorCheckInDialog(page);
    await record.open('c-mateo');
    await record.logCheckIn();

    await dialog.fill({ date: '2026-11-05', kind: 'Session', went: 'Thriving', topics: TOPICS });
    await dialog.save();

    await expect(dialog.failed).toBeVisible();
    await expect(dialog.field('What you talked about')).toHaveValue(TOPICS);
    await dialog.expectAccessible();
  });

  test('Given a phone, when he logs a mentor check-in, then the dialog is a bottom sheet with nothing scrolling sideways', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    const record = new MentorYouthDetailPage(page);
    const dialog = new MentorCheckInDialog(page);
    await record.open('c-mateo');
    await record.logCheckIn();

    await dialog.expectOpen();
    await dialog.expectNoHorizontalScroll();
    await dialog.expectAccessible();
  });

  test('Given Mentoring is off, when anyone posts a mentor check-in, then the API answers 404', async ({ page, api }) => {
    api.setModules('org-harbourview', ALL.filter((m) => m !== 'Mentoring'));
    const dialog = new MentorCheckInDialog(page);
    await page.goto('/');

    expect(await dialog.apiStatus()).toBe(404);
  });
});
