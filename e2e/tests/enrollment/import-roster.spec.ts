import { test, expect } from '../../fixtures/test';
import { FamiliesPage } from '../../pages/families.page';
import { ImportRosterPage } from '../../pages/import-roster.page';
import { TodayPage } from '../../pages/today.page';

const csv =
  'Student,DOB,Parent,Cell,Email,Allergies/Meds,Lang,T-shirt\n' +
  'Ava Chen,2016-04-02,Mei Chen,905-555-0201,mei.chen@example.com,,English,S\n' +
  'Leo Chen,2018-09-15,Mei Chen,905-555-0201,mei.chen@example.com,Peanuts,English,XS\n' +
  'Mateo Rivera,2017-03-14,Carmen Rivera,905-555-0142,,,Spanish,M\n' +
  'Zoe Park,2015-01-20,Jin Park,,jin.park@example.com,,English,M\n' +
  'Sam Ortiz,2016-07-07,Rosa Ortiz,,,,English,L\n';

// L2-010 roster import, L2-011 records, L2-007 roles, L2-005 Roster off, L2-035/L2-036 accessibility and phone layout.
test.describe('Import a roster as an admin', () => {
  test.use({ signedInAs: 'm-tom' });

  test('Given the families page, when Import is chosen, then step 1 asks for a CSV or XLSX', async ({ page }) => {
    const families = new FamiliesPage(page);
    await families.open();
    await page.getByRole('link', { name: 'Import a roster' }).click();

    const wizard = new ImportRosterPage(page);
    await expect(wizard.heading).toHaveText('Import a roster');
    await expect(wizard.step).toHaveText('Step 1 of 3');
    await wizard.expectAccessible();
    await wizard.expectNoHorizontalScroll();
  });

  test('Given a spreadsheet, when it is uploaded, then columns are matched and the unmatched one is listed', async ({ page }) => {
    const wizard = new ImportRosterPage(page);
    await wizard.open();

    await wizard.upload('roster-fall-2026.csv', csv);

    await expect(wizard.step).toHaveText('Step 2 of 3');
    await expect(wizard.notice('7 of 8 columns matched automatically')).toBeVisible();
    await expect(wizard.mapping('Student')).toHaveValue('ChildName');
    await expect(wizard.mapping('T-shirt')).toHaveValue('Skip');
    await wizard.expectAccessible();
  });

  test('Given the guardian column is skipped, when Review is pressed, then the mapping asks for it', async ({ page }) => {
    const wizard = new ImportRosterPage(page);
    await wizard.open();
    await wizard.upload('roster-fall-2026.csv', csv);

    await wizard.map('Parent', 'Skip');
    await wizard.review();

    await expect(wizard.errorSummary).toContainText('Map the guardian’s name.');
    await wizard.expectAccessible();
  });

  test('Given a mapped roster, when it is reviewed and imported, then duplicates and rows to fix are shown and families are created', async ({ page }) => {
    const wizard = new ImportRosterPage(page);
    await wizard.open();
    await wizard.upload('roster-fall-2026.csv', csv);
    await wizard.enrollIn('Saturday Sports');
    await wizard.review();

    await expect(wizard.step).toHaveText('Step 3 of 3');
    await expect(wizard.duplicate(4)).toContainText('Mateo Rivera');
    await expect(wizard.needLook(5)).toContainText('No mobile; email only');
    await expect(wizard.needLook(6)).toContainText('No phone or email');
    await wizard.expectAccessible();
    await wizard.importRows();

    await expect(wizard.heading).toHaveText('Imported 3 of 5 rows');
    await expect(wizard.kpi('Families created')).toHaveText('2');
    await expect(wizard.notice('1 row needs a guardian phone or email')).toBeVisible();
    await wizard.expectAccessible();
  });

  test('Given a duplicate is merged, when the roster is imported, then the returning family is updated instead of skipped', async ({ page }) => {
    const wizard = new ImportRosterPage(page);
    await wizard.open();
    await wizard.upload('roster-fall-2026.csv', csv);
    await wizard.review();

    await wizard.merge(4);
    await wizard.importRows();

    await expect(wizard.heading).toHaveText('Imported 4 of 5 rows');
    await expect(wizard.kpi('Families updated')).toHaveText('1');
  });

  test('Given a file that is not a spreadsheet, when it is uploaded, then it says which formats work and nothing is imported', async ({ page }) => {
    const wizard = new ImportRosterPage(page);
    await wizard.open();

    await wizard.upload('roster-fall-2026.numbers', Buffer.from([0, 1, 2, 3]));

    await expect(wizard.notice('We couldn’t read roster-fall-2026.numbers. Export it as CSV or XLSX and try again. Nothing was imported.')).toBeVisible();
    await expect(wizard.step).toHaveText('Step 1 of 3');
  });
});

test.describe('Import for other roles and modules', () => {
  test('Given a site lead, when the import page is opened, then it says who can import', async ({ page }) => {
    const wizard = new ImportRosterPage(page);

    await wizard.open();

    await expect(wizard.heading).toHaveText('Only admins and program directors import rosters');
    await wizard.expectAccessible();
  });

  test('Given the roster module is off, when the import page is opened, then Today opens', async ({ page, api }) => {
    api.setModules('org-harbourview', []);

    await page.goto('/import');

    await expect(page).toHaveURL(/\/$/);
    await expect(new TodayPage(page).heading).toBeVisible();
  });
});
