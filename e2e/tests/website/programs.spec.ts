import { test, expect } from '../../fixtures/test';
import type { ModuleId } from '../../fixtures/seed';
import { SiteProgramsPage } from '../../pages/site-programs.page';

// Acceptance Test
// Traces to: L2-133 criteria 1 to 3 and 6, L2-132 criteria 3 and 5, L2-005
// Description: the programs page lists the current programs with when, who, the dates, a status and Apply through the enrollment link while
// open; while Learning is on, published tracks and modules with their badge; while Mentoring is on, the mentorship model and lead mentors.
const SUITE: ModuleId[] = ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports'];

test.describe('Public website: programs', () => {
  test.use({ signedInAs: null });

  test.beforeEach(({ api }) => {
    api.setModules('org-harbourview', [...SUITE, 'Learning', 'Mentoring', 'PublicWebsite']);
    api.openEnrollment('p-tutoring');
    api.setCohortTeam('p-tutoring', 'm-daniel');
  });

  test('Given current programs, when a visitor opens Programs, then each shows when, who, the dates and its status, and Apply opens the enrollment link', async ({
    page,
  }) => {
    const programs = new SiteProgramsPage(page);

    await programs.open();

    await expect(programs.heading).toHaveText('Programs and open cohorts');
    await expect(programs.programs).toHaveText(['After-School Tutoring', 'Saturday Sports', 'Winter Camp 2026']);
    await expect(programs.fact('After-School Tutoring', 'when')).toContainText('Mon–Thu, 4–6 pm');
    await expect(programs.fact('After-School Tutoring', 'who')).toContainText('Ages 6–13');
    await expect(programs.fact('After-School Tutoring', 'runs')).toContainText('8 Sept 2026 – 24 Jun 2027');
    await expect(programs.status('After-School Tutoring')).toHaveText('Running now');
    await expect(programs.status('Winter Camp 2026')).toHaveText('Starts 21 Dec');
    await expect(programs.closed('Saturday Sports')).toBeVisible();
    await expect(page.getByText('Summer Camp 2026')).toHaveCount(0);
    await expect(programs.currentNavLink).toHaveText('Programs');
    await programs.expectAccessible();
    await programs.expectNoHorizontalScroll();

    await programs.applyTo('After-School Tutoring').click();
    await expect(page).toHaveURL(/\/g\/enroll\/after-school-tutoring$/);
  });

  test('Given Learning and Mentoring are on, then published tracks with their badge, the track each program follows, its lead mentor and the mentorship model show; drafts never do', async ({
    page,
    api,
  }) => {
    api.publishModule('cm-serving');
    const programs = new SiteProgramsPage(page);

    await programs.open();

    await expect(programs.tracks).toHaveText(['Leadership Foundations']);
    await expect(programs.modules('Leadership Foundations')).toHaveCount(2);
    await expect(programs.modules('Leadership Foundations').nth(1)).toContainText('Leading by Serving');
    await expect(programs.modules('Leadership Foundations').nth(1)).toContainText('Servant Heart');
    await expect(page.getByText('Speaking Up')).toHaveCount(0);
    await expect(page.getByText('Digital Skills')).toHaveCount(0);
    await expect(programs.fact('After-School Tutoring', 'track')).toContainText('Leadership Foundations');
    await expect(programs.fact('After-School Tutoring', 'mentor')).toContainText('Daniel');
    await expect(page.getByText('Osei')).toHaveCount(0);
    await expect(programs.mentorship).toBeVisible();
    await programs.expectAccessible();
  });

  test('Given Learning and Mentoring are off, then no track, module, mentor or mentorship shows', async ({ page, api }) => {
    api.setModules('org-harbourview', [...SUITE, 'PublicWebsite']);
    const programs = new SiteProgramsPage(page);

    await programs.open();

    await expect(programs.programs).toHaveCount(3);
    await expect(programs.tracks).toHaveCount(0);
    await expect(programs.mentorship).toHaveCount(0);
    await expect(programs.fact('After-School Tutoring', 'track')).toHaveCount(0);
    await expect(programs.fact('After-School Tutoring', 'mentor')).toHaveCount(0);
  });

  test('Given a phone, then the program cards stack in one column with nothing to scroll sideways', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    const programs = new SiteProgramsPage(page);

    await programs.open();

    await expect(programs.programs).toHaveCount(3);
    await programs.expectNoHorizontalScroll();
    await programs.expectAccessible();
  });

  test('Given no current program, then the page says so and offers Contact us', async ({ page, api }) => {
    api.archiveSeededProgram('p-tutoring');
    api.archiveSeededProgram('p-sports');
    api.archiveSeededProgram('p-winter');
    const programs = new SiteProgramsPage(page);

    await programs.open();

    await expect(programs.nothingOpen).toBeVisible();
  });

  test('Given the programs fail to load, then the page says so with Try again', async ({ page, api }) => {
    api.failNext('/api/website/harbourview/content', 500);
    const programs = new SiteProgramsPage(page);

    await programs.open();

    await expect(programs.loadFailed).toBeVisible();
    await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible();
  });

  test('Given Public website is off, when a visitor opens Programs, then it is not found', async ({ page, api }) => {
    api.setModules('org-harbourview', [...SUITE, 'Learning']);
    const programs = new SiteProgramsPage(page);

    await programs.open();

    await expect(programs.notFound).toBeVisible();
  });
});
