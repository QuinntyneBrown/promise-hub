import { test, expect } from '../../fixtures/test';
import type { ModuleId } from '../../fixtures/seed';
import { MentorYouthDetailPage } from '../../pages/mentor-youth-detail.page';

// Acceptance test. Traces to: L2-089 criteria 5, 6 and 8 (a mentor reads only the reflections his youth shared, on her record; nothing while
// Learning is off), L2-035, L2-036.
const ALL: ModuleId[] = ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports', 'Learning', 'Mentoring'];
const WORDS = 'My little brother Mateo cleared the table after dinner without anyone asking. I want to be the one who notices first.';

test.describe('Shared reflections on the youth record', () => {
  test.use({ signedInAs: 'm-daniel' });

  test.beforeEach(({ api }) => {
    api.setModules('org-harbourview', ALL);
    api.curriculumState.youthJourney();
    api.assignYouthMentor('c-sofia', 'm-daniel');
  });

  test('Given Sofía shared Pick Up the Towel and kept Your Strengths private, when Daniel opens her record, then he reads only the shared one', async ({
    page,
    api,
  }) => {
    api.reflectionsState.seed({ organizationId: 'org-harbourview', membershipId: 'm-sofia', lessonId: 'l-strengths', mood: 'Unsure', text: 'Only mine to read.', action: null, shared: false });
    api.reflectionsState.seed({
      organizationId: 'org-harbourview',
      membershipId: 'm-sofia',
      lessonId: 'l-towel',
      mood: 'Thoughtful',
      text: WORDS,
      action: 'Pack my own lunch on Thursday.',
      shared: true,
      savedAt: '2026-11-05T21:12:00Z',
    });
    const record = new MentorYouthDetailPage(page);

    await record.open('c-sofia');

    await record.expectOpen('Sofía Rivera');
    await expect(record.sharedReflections).toHaveCount(1);
    await expect(record.sharedReflections.first()).toContainText('Pick Up the Towel');
    await expect(record.sharedReflections.first()).toContainText('Leading by Serving');
    await expect(record.sharedReflections.first()).toContainText('Feeling thoughtful');
    await expect(record.sharedReflections.first()).toContainText(WORDS);
    await expect(record.sharedReflections.first()).toContainText('One thing I’ll do this week: Pack my own lunch on Thursday.');
    expect(await record.text()).not.toContain('Only mine to read.');
    await record.expectNoHorizontalScroll();
    await record.expectAccessible();
  });

  test('Given Sofía has shared nothing, when Daniel opens her record, then the card says so without hinting at private reflections', async ({ page, api }) => {
    api.reflectionsState.seed({ organizationId: 'org-harbourview', membershipId: 'm-sofia', lessonId: 'l-towel', mood: 'Hopeful', text: 'Private.', action: null, shared: false });
    const record = new MentorYouthDetailPage(page);

    await record.open('c-sofia');

    await expect(record.noSharedReflections).toBeVisible();
    await record.expectAccessible();
  });

  test('Given Learning is off, when Daniel opens her record, then there is no reflections card and nothing is fetched', async ({ page, api }) => {
    api.setModules('org-harbourview', ALL.filter((m) => m !== 'Learning'));
    const record = new MentorYouthDetailPage(page);
    const paths = record.recordApiPaths();

    await record.open('c-sofia');

    await record.expectOpen('Sofía Rivera');
    await expect(record.sharedReflectionsCard).toHaveCount(0);
    expect(paths.filter((p) => p.endsWith('/reflections'))).toEqual([]);
    expect(await page.evaluate(async () => (await fetch('/api/mentoring/youth/c-sofia/reflections')).status)).toBe(404);
  });
});
