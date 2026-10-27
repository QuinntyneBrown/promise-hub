import { test, expect } from '../../fixtures/test';
import type { ModuleId } from '../../fixtures/seed';
import { MentorCompetencyPage } from '../../pages/mentor-competency.page';
import { MentorYouthDetailPage } from '../../pages/mentor-youth-detail.page';

// Acceptance test. Traces to: L2-082 criteria 1 to 6 (a youth's competencies, setting levels and notes, invalid, failed, none set up, a youth
// who is not his, Mentoring off and Learning off), L2-035.
const ALL: ModuleId[] = ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports', 'Learning', 'Mentoring'];
const FIVE = ['Serves others', 'Speaks up', 'Leads a small group', 'Follows through', 'Works with others'];

test.describe('Assessing competencies', () => {
  test.use({ signedInAs: 'm-daniel' });

  test.beforeEach(({ api }) => {
    api.setModules('org-harbourview', ALL);
    api.assignYouthMentor('c-sofia', 'm-daniel');
  });

  test('Given Sofía’s record, when Daniel opens Competencies, sets two levels with a note and saves, then the count and last-saved line update', async ({ page, api }) => {
    const record = new MentorYouthDetailPage(page);
    const sheet = new MentorCompetencyPage(page);
    await record.open('c-sofia');

    await record.openCompetencies();

    await sheet.expectOpen();
    await expect(sheet.names).toHaveText(FIVE);
    await expect(sheet.summary).toHaveText('0 of 5 proficient or mastered');
    await expect(sheet.level('Serves others', 'Not started')).toHaveAttribute('aria-pressed', 'true');
    await sheet.expectAccessible();
    await sheet.setLevel('Serves others', 'Proficient');
    await sheet.notes('Serves others').fill('Stacked the chairs after tutoring two weeks running.');
    await sheet.setLevel('Speaks up', 'Developing');
    await sheet.save();

    await expect(sheet.toast('Competencies saved')).toBeVisible();
    await expect(sheet.summary).toHaveText('1 of 5 proficient or mastered');
    await expect(sheet.level('Serves others', 'Proficient')).toHaveAttribute('aria-pressed', 'true');
    await expect(sheet.lastSaved).toContainText('by Daniel Osei');
    expect(api.reviews.competencyAssessments.filter((a) => a.childId === 'c-sofia')).toHaveLength(2);
    await sheet.expectNoHorizontalScroll();
  });

  test('Given a note over 2,000 characters, when he saves, then it shows inline and in a summary and nothing is saved', async ({ page, api }) => {
    const sheet = new MentorCompetencyPage(page);
    await sheet.open('c-sofia');
    await sheet.expectOpen();

    await sheet.notes('Speaks up').fill('a'.repeat(2001));
    await sheet.save();

    await expect(sheet.errorSummary).toContainText('Keep the note to 2,000 characters.');
    expect(api.reviews.competencyAssessments).toHaveLength(0);
    await sheet.expectAccessible();
  });

  test('Given the save fails, then his changes stay with a failed alert', async ({ page, api }) => {
    const sheet = new MentorCompetencyPage(page);
    await sheet.open('c-sofia');
    await sheet.setLevel('Follows through', 'Mastered');
    api.failNext('/api/mentoring/youth/c-sofia/competencies', 500);

    await sheet.save();

    await expect(sheet.alert('That didn’t save')).toBeVisible();
    await expect(sheet.level('Follows through', 'Mastered')).toHaveAttribute('aria-pressed', 'true');
  });

  test('Given the organization has no competencies, then the page says so', async ({ page, api }) => {
    api.reviews.competencies = api.reviews.competencies.filter((c) => c.organizationId !== 'org-harbourview');
    const sheet = new MentorCompetencyPage(page);

    await sheet.open('c-sofia');

    await expect(sheet.empty).toBeVisible();
    await sheet.expectAccessible();
  });

  test('Given Amara is not his youth, then the page says so and the API answers 403', async ({ page }) => {
    const sheet = new MentorCompetencyPage(page);

    await sheet.open('c-amara');

    await expect(sheet.forbidden).toBeVisible();
    expect(await sheet.apiStatus('c-amara')).toBe(403);
    await sheet.expectAccessible();
  });

  test('Given Learning is off, competencies still open; given Mentoring is off, the route goes to Today and the API answers 404', async ({ page, api }) => {
    const sheet = new MentorCompetencyPage(page);
    api.setModules('org-harbourview', ALL.filter((m) => m !== 'Learning'));
    await sheet.open('c-sofia');
    await sheet.expectOpen();
    await expect(sheet.names).toHaveText(FIVE);

    api.setModules('org-harbourview', ALL.filter((m) => m !== 'Mentoring'));
    await sheet.open('c-sofia');

    await expect(page).toHaveURL(/\/$/);
    expect(await sheet.apiStatus('c-sofia')).toBe(404);
  });
});
