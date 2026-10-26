import { test, expect } from '../../fixtures/test';
import { SearchPage } from '../../pages/search.page';

// L2-039 global search, L2-007 criterion 7 permitted records, L2-005 modules off, L2-001 tenants, L2-036 layout.
test.describe('Search records as staff', () => {
  test('Given Rivera typed in the top bar, when results load, then children and families are grouped by type', async ({ page }) => {
    const search = new SearchPage(page);
    await page.goto('/');

    await search.fromTopBar('Rivera');

    await expect(search.status).toHaveText('3 results for “Rivera”');
    expect(await search.names('Children')).toEqual(['Mateo Rivera', 'Sofía Rivera']);
    expect(await search.names('Families')).toEqual(['Rivera household']);
    await search.expectAccessible();
    await search.expectNoHorizontalScroll();
  });

  test('Given a phone fragment, when searched, then the family with that number is found', async ({ page }) => {
    const search = new SearchPage(page);
    await search.open();

    await search.searchFor('555-0163');

    await expect.poll(() => search.names('Families')).toEqual(['Tran household']);
  });

  test('Given an event name, when searched, then the event is found and opens', async ({ page }) => {
    const search = new SearchPage(page);
    await search.open('botanical');

    await search.group('Events').getByRole('link', { name: /Royal Botanical Gardens/ }).click();

    await expect(page).toHaveURL(/\/events\/e-rbg$/);
  });

  test('Given nothing matches, when searched, then it says so', async ({ page }) => {
    const search = new SearchPage(page);

    await search.open('Garcia');

    await expect(search.emptyHeading('Nothing matches “Garcia”')).toBeVisible();
    await search.expectAccessible();
  });

  test('Given search fails, when searched, then it offers to try again', async ({ page, api }) => {
    api.failNext('/api/search', 500);
    const search = new SearchPage(page);

    await search.open('Rivera');

    await expect(search.emptyHeading('Search isn’t responding')).toBeVisible();
  });

  test('Given Slips is off, when an event name is searched, then no event is offered', async ({ page, api }) => {
    api.setModules('org-harbourview', ['Roster']);
    const search = new SearchPage(page);

    await search.open('botanical');

    await expect(search.emptyHeading('Nothing matches “botanical”')).toBeVisible();
    await expect(search.group('Events')).toHaveCount(0);
  });

  test('Given Roster is off, when search is opened, then Today opens instead', async ({ page, api }) => {
    api.setModules('org-harbourview', []);

    await page.goto('/search?q=Rivera');

    await expect(page).toHaveURL(/\/$/);
  });
});

test.describe('Youth worker', () => {
  test.use({ signedInAs: 'm-aisha' });

  test('Given a family outside her sessions, when searched, then it is not found', async ({ page }) => {
    const search = new SearchPage(page);

    await search.open('Tran');

    await expect(search.emptyHeading('Nothing matches “Tran”')).toBeVisible();
  });
});

test.describe('Another organization', () => {
  test.use({ signedInAs: 'm-grace' });

  test('Given Northgate, when Rivera is searched, then only its own family is found', async ({ page }) => {
    const search = new SearchPage(page);

    await search.open('Rivera');

    await expect.poll(() => search.names('Families')).toEqual(['Rivera household']);
    await expect(search.group('Families')).toContainText('Ana Rivera');
  });
});
