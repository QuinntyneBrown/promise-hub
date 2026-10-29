import { test, expect } from '../../fixtures/test';
import type { ModuleId } from '../../fixtures/seed';
import { SiteAboutPage } from '../../pages/site-about.page';
import { SitePrivacyPage } from '../../pages/site-privacy.page';

// Acceptance Test
// Traces to: L2-133 criterion 5, L2-132 criteria 1 and 5, L2-126
// Description: the about page shows the organization's about text, city and public email from its website profile, or a short line until
// it has written one, and its promise to families; the privacy page says what is kept and why, with the organization's name.
const SUITE: ModuleId[] = ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports'];
const ABOUT =
  'Harbourview Youth Collective runs free after-school tutoring, Saturday sports and one-to-one mentoring for children and youth in Hamilton’s north end.';

test.describe('Public website: about and privacy', () => {
  test.use({ signedInAs: null });

  test.beforeEach(({ api }) => {
    api.setModules('org-harbourview', [...SUITE, 'PublicWebsite']);
  });

  test('Given a website profile, when a visitor opens About, then the about text, where to find the organization and its promise show', async ({
    page,
    api,
  }) => {
    api.setWebsiteProfile('org-harbourview', { about: ABOUT, contactEmail: 'hello@harbourview.example' });
    const about = new SiteAboutPage(page);

    await about.open();

    await expect(about.heading).toHaveText('About Harbourview Youth Collective');
    await expect(about.about).toHaveText(ABOUT);
    await expect(about.findUs('where')).toContainText('Hamilton, Ontario');
    await expect(about.findUs('email')).toContainText('hello@harbourview.example');
    await expect(about.promises).toHaveCount(3);
    await expect(about.currentNavLink).toHaveText('About');
    await about.expectAccessible();
    await about.expectNoHorizontalScroll();
  });

  test('Given no about text or public email yet, then a short line shows instead and no email', async ({ page }) => {
    const about = new SiteAboutPage(page);

    await about.open();

    await expect(about.about).toHaveText('We’re a youth organization in Hamilton, Ontario. Our story is coming soon.');
    await expect(about.findUs('email')).toHaveCount(0);
  });

  test('Given the privacy page, then it says what is collected, why and how children are kept safe', async ({ page }) => {
    const privacy = new SitePrivacyPage(page);

    await privacy.open();

    await expect(privacy.heading).toHaveText('Privacy and safeguarding');
    await expect(privacy.lead).toContainText('Harbourview Youth Collective works with children');
    await expect(privacy.sections).toHaveText(['What we collect', 'When you write to us', 'Safeguarding', 'Questions']);
    await privacy.expectAccessible();
  });
});
