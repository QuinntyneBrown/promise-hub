import { test, expect } from '../../fixtures/test';
import type { ModuleId } from '../../fixtures/seed';
import { WebsitePage } from '../../pages/website.page';

// L2-005 criterion 7: the anonymous public website answers for its slug only while Public website is on.
const SUITE: ModuleId[] = ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports'];

test.describe('Public website', () => {
  test.use({ signedInAs: null });

  test('Given Public website is on, when a visitor opens Harbourview’s address, then its public page shows without signing in', async ({ page, api }) => {
    api.setModules('org-harbourview', [...SUITE, 'PublicWebsite']);
    const site = new WebsitePage(page);

    await site.open('harbourview');

    await expect(site.heading).toHaveText('Harbourview Youth Collective');
    await expect(site.placeholder).toBeVisible();
    await site.expectAccessible();
    await site.expectNoHorizontalScroll();
  });

  test('Given Public website is off, when a visitor opens the address, then the page is not found and nothing of the site shows', async ({ page, api }) => {
    api.setModules('org-harbourview', SUITE);
    const site = new WebsitePage(page);

    await site.open('harbourview');

    await expect(site.heading).toHaveText('Page not found');
    await expect(site.placeholder).toBeHidden();
    await site.expectAccessible();
  });

  test('Given an address that names no organization, when a visitor opens it, then the page is not found', async ({ page }) => {
    const site = new WebsitePage(page);

    await site.open('nowhere');

    await expect(site.heading).toHaveText('Page not found');
  });
});
