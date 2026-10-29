import { test, expect } from '../../fixtures/test';
import type { ModuleId } from '../../fixtures/seed';
import { SiteLandingPage } from '../../pages/site-landing.page';

// Acceptance Test
// Traces to: L2-132 criteria 1, 3, 4 and 5, L2-133 criteria 4, 6 and 7, L2-005 criterion 7
// Description: a visitor reads an organization's home page without signing in: name, tagline, the four steps, counts of programs and
// published content, and the programs open now with Apply; unknown, suspended and module-off addresses show the same not-found page.
const SUITE: ModuleId[] = ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports'];
const TAGLINE = 'Tutoring, sports and mentoring for Hamilton kids, after school and on Saturdays.';

test.describe('Public website: home', () => {
  test.use({ signedInAs: null });

  test.beforeEach(({ api }) => {
    api.setModules('org-harbourview', [...SUITE, 'Learning', 'Mentoring', 'PublicWebsite']);
    api.setWebsiteProfile('org-harbourview', { tagline: TAGLINE });
    api.openEnrollment('p-tutoring');
  });

  test('Given Public website is on, when a visitor opens Harbourview’s address, then the home page shows who it is, how to join and what is open', async ({
    page,
  }) => {
    const home = new SiteLandingPage(page);

    await home.open();

    await expect(home.heading).toHaveText('Harbourview Youth Collective');
    await expect(home.tagline).toHaveText(TAGLINE);
    await expect(home.steps).toHaveText(['Find a program', 'Apply online', 'We say hello', 'Grow with us']);
    await expect(home.statValue('Programs running')).toHaveText('3');
    await expect(home.statValue('Open for enrollment')).toHaveText('1');
    await expect(home.statValue('Learning tracks')).toHaveText('1');
    await expect(home.statValue('Modules')).toHaveText('1');
    await expect(home.openPrograms).toHaveText(['After-School Tutoring']);
    await expect(home.applyTo('After-School Tutoring')).toHaveAttribute('href', '/g/enroll/after-school-tutoring');
    await expect(page).toHaveTitle('Harbourview Youth Collective');
    await expect(page.getByText('Mateo')).toHaveCount(0);
    await home.expectAccessible();
    await home.expectNoHorizontalScroll();
  });

  test('Given a phone, when a visitor opens the home page, then it reflows to one column with nothing to scroll sideways', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    const home = new SiteLandingPage(page);

    await home.open();

    await expect(home.heading).toHaveText('Harbourview Youth Collective');
    await expect(home.siteNav.getByRole('link', { name: 'Programs' })).toBeVisible();
    await home.expectNoHorizontalScroll();
    await home.expectAccessible();
  });

  test('Given Learning is off, then no learning count shows', async ({ page, api }) => {
    api.setModules('org-harbourview', [...SUITE, 'PublicWebsite']);
    const home = new SiteLandingPage(page);

    await home.open();

    await expect(home.statValue('Programs running')).toHaveText('3');
    await expect(home.stat('Learning tracks')).toHaveCount(0);
    await expect(home.stat('Modules')).toHaveCount(0);
  });

  test('Given no program is open for enrollment, then the home page says so and offers Contact us', async ({ page, api }) => {
    api.closeEnrollment('p-tutoring');
    api.closeEnrollment('p-sports');
    api.closeEnrollment('p-winter');
    const home = new SiteLandingPage(page);

    await home.open();

    await expect(home.nothingOpen).toBeVisible();
    await expect(home.statValue('Open for enrollment')).toHaveText('0');
    await expect(home.contactUs.first()).toBeVisible();
    await home.expectAccessible();
  });

  test('Given the content fails to load, then the frame stays and Try again loads it', async ({ page, api }) => {
    api.failNext('/api/website/harbourview/content', 500);
    const home = new SiteLandingPage(page);

    await home.open();

    await expect(home.loadFailed).toBeVisible();
    await expect(home.heading).toHaveText('Harbourview Youth Collective');
    await home.expectAccessible();
    api.recover('/api/website/harbourview/content');
    await home.tryAgain();
    await expect(home.openPrograms).toHaveText(['After-School Tutoring']);
  });

  test('Given Public website is off, when a visitor opens the address, then the page is not found and the API answers 404', async ({
    page,
    api,
  }) => {
    api.setModules('org-harbourview', SUITE);
    const home = new SiteLandingPage(page);
    const paths = home.recordApiPaths();

    await home.open();

    await expect(home.notFound).toBeVisible();
    await expect(home.siteNav).toHaveCount(0);
    expect(paths).not.toContain('/api/website/harbourview/content');
    expect(await home.apiStatus('/website/harbourview/content')).toBe(404);
    await home.expectAccessible();
  });

  test('Given an unknown address or a suspended organization, then the same not-found page shows', async ({ page, api }) => {
    const home = new SiteLandingPage(page);
    await home.open('nowhere');
    await expect(home.notFound).toBeVisible();

    api.suspend('org-harbourview');
    await home.open();
    await expect(home.notFound).toBeVisible();
  });

  test('Given Northgate also publishes its site, then each address shows only its own programs', async ({ page, api }) => {
    api.setModules('org-northgate', ['Roster', 'RollCall', 'QuickCards', 'PublicWebsite']);
    api.openEnrollment('p-kids-club');
    const home = new SiteLandingPage(page);

    await home.open('northgate');

    await expect(home.heading).toHaveText('Northgate Community Church Kids');
    await expect(home.openPrograms).toHaveText(['Kids Club']);
    await expect(page.getByText('After-School Tutoring')).toHaveCount(0);
  });
});
