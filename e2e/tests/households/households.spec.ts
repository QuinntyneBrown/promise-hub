import { test, expect } from '../../fixtures/test';
import { ChildPage } from '../../pages/child.page';
import { FamiliesPage } from '../../pages/families.page';
import { HouseholdPage } from '../../pages/household.page';

// L2-011 household and child records, L2-007 role-based fields, L2-005 module off, L2-035/L2-036 accessibility and layout.
test.describe('Maintain households as an admin', () => {
  test.use({ signedInAs: 'm-tom' });

  test('Given Harbourview families, when Families opens, then households list with guardian, children and flags', async ({ page }) => {
    const families = new FamiliesPage(page);

    await families.open();

    expect(await families.householdNames()).toEqual(['Haddad', 'Okonkwo', 'Rivera', 'Thompson', 'Tran']);
    await expect(families.row('Rivera')).toContainText('Carmen Rivera · Mateo (9), Sofía (12) · Spanish');
    await expect(families.row('Rivera').getByTestId('medical-flag')).toHaveText('2 medical');
    await families.expectAccessible();
    await families.expectNoHorizontalScroll();
  });

  test('Given the list, when searching or filtering, then only matching households remain', async ({ page }) => {
    const families = new FamiliesPage(page);
    await families.open();

    await families.search('mateo');
    await expect.poll(() => families.householdNames()).toEqual(['Rivera']);

    await families.search('zzz');
    await expect(families.noResults).toBeVisible();

    await families.search('');
    await families.filter('Missing info');
    await expect.poll(() => families.householdNames()).toEqual(['Okonkwo']);
    await expect(families.row('Okonkwo')).toContainText('Missing info');
  });

  test('Given no households, when Families opens, then it offers a way to start', async ({ page, api }) => {
    api.clearHouseholds('org-harbourview');
    const families = new FamiliesPage(page);

    await families.open();

    await expect(families.empty).toBeVisible();
    await families.expectAccessible();
  });

  test('Given the add-family dialog, when submitted empty, then each field says what is missing; when filled, then the household opens', async ({ page }) => {
    const families = new FamiliesPage(page);
    const household = new HouseholdPage(page);
    await families.open();
    await families.startAddFamily();
    await families.expectAccessible();

    await families.submitFamily();
    await expect(families.fieldError('guardianName')).toHaveText('Enter the guardian’s name.');
    await expect(families.fieldError('mobile')).toHaveText('Enter a mobile number or an email.');

    await families.fillFamily({ guardianName: 'Farah Siddiqui', mobile: '905-555-0170' });
    await families.submitFamily();

    await household.expectOpen('Siddiqui');
    await expect(household.guardian('Farah Siddiqui')).toContainText('905-555-0170');
  });

  test('Given the Rivera household, when a child is added, then the child is listed', async ({ page }) => {
    const families = new FamiliesPage(page);
    const household = new HouseholdPage(page);
    await families.open();
    await families.openHousehold('Rivera');
    await household.expectOpen('Rivera');
    await household.expectAccessible();

    await household.addChild({ name: 'Lucía Rivera', dateOfBirth: '2020-01-18', school: 'Bennetto Elementary, Kindergarten' });

    await expect.poll(() => household.childNames()).toEqual(['Lucía Rivera', 'Mateo Rivera', 'Sofía Rivera']);
  });

  test('Given a guardian, when their mobile and pickup permission are edited, then the household shows the change', async ({ page }) => {
    const household = new HouseholdPage(page);
    await household.open('/families/hh-rivera');
    await household.expectOpen('Rivera');

    await household.editGuardian('Luis Rivera', { mobile: '905-555-0111', canPickUp: false });

    await expect(household.guardian('Luis Rivera')).toContainText('905-555-0111');
    await expect(household.guardian('Luis Rivera')).not.toContainText('approved pickup');
  });

  test('Given Mateo, when his medical details are edited, then the card shows them with who changed them', async ({ page }) => {
    const household = new HouseholdPage(page);
    const child = new ChildPage(page);
    await household.open('/families/hh-rivera');
    await household.openChild('Mateo Rivera');
    await expect(child.heading).toHaveText('Mateo Rivera');
    await expect(child.fact('allergies')).toContainText('Peanuts (anaphylaxis)');
    await child.expectAccessible();

    await child.editMedical({ allergies: 'Peanuts (anaphylaxis); tree nuts (hives); sesame' });

    await expect(child.fact('allergies')).toContainText('sesame');
    await expect(child.fact('updated')).toContainText('Tom Nguyen');
    await expect(page.getByTestId('toast')).toContainText('Medical details saved');
  });

  test('Given a child, when the school is edited, then the profile shows it', async ({ page }) => {
    const child = new ChildPage(page);
    await child.open('/families/hh-rivera/children/c-sofia');
    await expect(child.heading).toHaveText('Sofía Rivera');

    await child.editDetails({ school: 'Westdale Secondary, Grade 7' });

    await expect(child.subtitle).toContainText('Westdale Secondary, Grade 7');
  });

  test('Given a household, when deleted, then its name must be typed and it leaves Families', async ({ page }) => {
    const household = new HouseholdPage(page);
    const families = new FamiliesPage(page);
    await household.open('/families/hh-rivera');
    await household.expectOpen('Rivera');

    await household.startDelete();
    await household.expectAccessible();
    await expect(household.deleteConfirmButton).toBeDisabled();
    await household.typeConfirmation('Rivra');
    await expect(household.deleteConfirmButton).toBeDisabled();
    await household.typeConfirmation('Rivera');
    await household.deleteConfirmButton.click();

    await expect(page.getByRole('heading', { level: 1, name: 'Families' })).toBeVisible();
    await expect(page.getByTestId('toast')).toContainText('Rivera household deleted');
    expect(await families.householdNames()).not.toContain('Rivera');
  });
});

test.describe('Households for other roles', () => {
  test('Given a site lead, when Families opens, then households are listed without the add action', async ({ page }) => {
    const families = new FamiliesPage(page);

    await families.open();

    await expect(families.list).toBeVisible();
    await expect(families.addFamilyButton).toBeHidden();
  });

  test.describe('Youth worker', () => {
    test.use({ signedInAs: 'm-aisha' });

    test('Given a youth worker, when a household and child open, then medical details are hidden and say so', async ({ page }) => {
      const household = new HouseholdPage(page);
      const child = new ChildPage(page);
      await household.open('/families/hh-rivera');
      await household.expectOpen('Rivera');

      await expect(household.restrictedNotice).toBeVisible();
      await expect(household.flags()).toHaveCount(0);
      await household.openChild('Mateo Rivera');
      await expect(child.restricted).toBeVisible();
      await expect(child.medical).not.toContainText('Peanuts');
      await child.expectAccessible();
    });
  });

  test.describe('Another organization', () => {
    test.use({ signedInAs: 'm-grace' });

    test('Given Northgate, when Families opens, then only Northgate households are listed and Harbourview links are not found', async ({ page }) => {
      const families = new FamiliesPage(page);
      await families.open();
      expect(await families.householdNames()).toEqual(['Rivera']);
      await expect(families.row('Rivera')).toContainText('Ana Rivera');

      await page.goto('/families/hh-rivera');
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('We can’t find that household');
    });
  });

  test('Given Roster is off, when Families is opened directly, then Today opens instead', async ({ page, api }) => {
    api.setModules('org-harbourview', []);

    await page.goto('/families');

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Welcome, Jaylen');
  });
});
