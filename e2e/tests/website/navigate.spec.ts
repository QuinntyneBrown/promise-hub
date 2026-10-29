import { test, expect } from '../../fixtures/test';
import type { ModuleId } from '../../fixtures/seed';
import { SiteLandingPage } from '../../pages/site-landing.page';
import { SitePrivacyPage } from '../../pages/site-privacy.page';
import { SiteProgramsPage } from '../../pages/site-programs.page';

// Acceptance Test
// Traces to: L2-132 criteria 2 and 5
// Description: every public page shares the site nav (the organization's name, Programs, About, Get involved, Contact, Sign in and Apply,
// the current page marked) and the site footer (the same pages plus Privacy); every link reaches its page, by keyboard too.
const SUITE: ModuleId[] = ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports'];

test.describe('Public website: navigation', () => {
  test.use({ signedInAs: null });

  test.beforeEach(({ api }) => {
    api.setModules('org-harbourview', [...SUITE, 'PublicWebsite']);
  });

  test('Given the home page, when a visitor follows each link of the site nav and footer, then each page opens with its link marked', async ({
    page,
  }) => {
    const home = new SiteLandingPage(page);
    await home.open();
    await expect(home.currentNavLink).toHaveCount(0);

    for (const [link, heading] of [
      ['Programs', 'Programs and open cohorts'],
      ['About', 'About Harbourview Youth Collective'],
      ['Get involved', 'Help us keep our promises'],
      ['Contact', 'Get in touch'],
    ] as const) {
      await home.goTo(link);
      await expect(home.heading).toHaveText(heading);
      await expect(home.currentNavLink).toHaveText(link);
      await expect(page).toHaveTitle(`${link} · Harbourview Youth Collective`);
    }

    await home.goToFromFooter('Privacy');
    await expect(home.heading).toHaveText('Privacy and safeguarding');
    await home.brand.click();
    await expect(home.heading).toHaveText('Harbourview Youth Collective');
  });

  test('Given any page, when a visitor chooses Apply or Sign in, then Apply opens the programs and Sign in the sign-in page', async ({
    page,
  }) => {
    const privacy = new SitePrivacyPage(page);
    await privacy.open();

    await privacy.apply.click();
    const programs = new SiteProgramsPage(page);
    await expect(programs.heading).toHaveText('Programs and open cohorts');

    await expect(programs.signIn).toHaveAttribute('href', '/sign-in');
  });

  test('Given the keyboard, then Skip to content is first and moves focus to the page', async ({ page }) => {
    const home = new SiteLandingPage(page);
    await home.open();
    await expect(home.heading).toHaveText('Harbourview Youth Collective');

    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('main')).toBeFocused();
  });

  test('Given an address under the site that has no page, then the home page opens', async ({ page }) => {
    const home = new SiteLandingPage(page);

    await page.goto('/site/harbourview/nothing-here');

    await expect(home.heading).toHaveText('Harbourview Youth Collective');
  });
});
