import { test, expect } from '../../fixtures/test';
import { ChildPage } from '../../pages/child.page';
import { ErrorPage } from '../../pages/error.page';
import { FamiliesPage } from '../../pages/families.page';
import { HouseholdPage } from '../../pages/household.page';

// L2-007 criterion 7 permitted child details, L2-001 tenant isolation, L2-005 module off, L2-035/L2-036 accessibility and layout.
test.describe('Use permitted child details as a youth worker', () => {
  test.use({ signedInAs: 'm-aisha' });

  test('Given Aisha works Tutoring night, when Families opens, then only households with her children are listed', async ({ page }) => {
    const families = new FamiliesPage(page);

    await families.open();

    expect(await families.householdNames()).toEqual(['Haddad', 'Rivera', 'Thompson']);
    await families.expectAccessible();
  });

  test('Given a child she works with, when the household and child open, then contact and date of birth are hidden and say so', async ({ page }) => {
    const household = new HouseholdPage(page);
    const child = new ChildPage(page);
    await household.open('/families/hh-rivera');
    await household.expectOpen('Rivera');

    await expect(household.restrictedNotice).toContainText('Medical details, dates of birth and guardian contact need a staff role.');
    await expect(household.guardian('Carmen Rivera')).not.toContainText('905-555-0142');
    await household.expectAccessible();
    await household.openChild('Mateo Rivera');
    await expect(child.subtitle).toHaveText('9 years · Bennetto Elementary, Grade 4 · Rivera household');
    await child.expectAccessible();
    await child.expectNoHorizontalScroll();
  });

  test('Given a child outside her sessions, when the link is opened, then the page says she does not work with them', async ({ page }) => {
    const error = new ErrorPage(page);

    await error.open('/families/hh-tran/children/c-kevin');

    await expect(error.heading).toHaveText('This child isn’t in your sessions');
    await expect(error.action('Back to Families')).toBeVisible();
    await error.expectAccessible();

    await error.open('/families/hh-tran');
    await expect(error.heading).toHaveText('This household isn’t in your sessions');
  });
});

test.describe('Site lead', () => {
  test.use({ signedInAs: 'm-jaylen' });

  test('Given a site lead, when the household opens, then guardian contact shows', async ({ page }) => {
    const household = new HouseholdPage(page);
    await household.open('/families/hh-tran');

    await household.expectOpen('Tran');
    await expect(household.guardian('Linh Tran')).toContainText('905-555-0163');
  });
});

test.describe('Another organization', () => {
  test.use({ signedInAs: 'm-grace' });

  test('Given Northgate, when a Harbourview child link is opened, then it is not found', async ({ page }) => {
    const error = new ErrorPage(page);

    await error.open('/families/hh-rivera/children/c-mateo');

    await expect(error.heading).toHaveText('We can’t find that child');
  });
});

test.describe('Roster off', () => {
  test.use({ signedInAs: 'm-aisha' });

  test('Given Roster is off, when a child link is opened, then Today opens instead', async ({ page, api }) => {
    api.setModules('org-harbourview', []);

    await page.goto('/families/hh-rivera/children/c-mateo');

    await expect(page).toHaveURL(/\/$/);
  });
});
