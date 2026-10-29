import { test, expect } from '../../fixtures/test';
import { ImportRosterPage } from '../../pages/import-roster.page';

const csv =
  'Student,DOB,Parent,Cell,Group,Youth email\n' +
  'Ava Chen,2012-04-02,Mei Chen,905-555-0201,After-School Tutoring,ava.chen@example.com\n' +
  'Leo Chen,2018-09-15,Mei Chen,905-555-0201,saturday  sports,leo.chen@example.com\n' +
  'Zoe Park,2013-01-20,Jin Park,905-555-0301,Drama Club,\n' +
  'Kai Lee,2011-06-01,Ann Lee,905-555-0401,,ava.chen@example.com\n';

// Acceptance test. Traces to: L2-130 criteria 1, 2, 3 and 5 (Group and Youth email matched to Cohort and Youth email, cohort places and
// invitations previewed with why a row is not placed or invited, the results; the field not offered while Learning is off or to a program
// director), L2-035, L2-036.
test.describe('Import a roster with cohorts and youth invitations as an admin', () => {
  test.use({ signedInAs: 'm-tom' });

  test('Given a spreadsheet with Group and Youth email, when Tom imports it, then children are placed in their cohorts and youth are invited', async ({
    page,
  }) => {
    const wizard = new ImportRosterPage(page);
    await wizard.open();

    await wizard.upload('harbourview-roster.csv', csv);

    await expect(wizard.mapping('Group')).toHaveValue('Cohort');
    await expect(wizard.mapping('Youth email')).toHaveValue('YouthEmail');
    await wizard.review();
    await expect(wizard.placements).toHaveText('2');
    await expect(wizard.invitations).toHaveText('1');
    await expect(wizard.needLook(3)).toContainText('Youth accounts are for ages 12 to 18; not invited');
    await expect(wizard.needLook(4)).toContainText('No cohort called “Drama Club”; imported, not placed');
    await expect(wizard.needLook(5)).toContainText('Used on row 2; not invited');
    await wizard.expectAccessible();

    await wizard.importRows();

    await expect(wizard.kpi('Enrolled')).toHaveText('2');
    await expect(wizard.kpi('Youth invited')).toHaveText('1');
    await expect(wizard.notPlaced(4)).toContainText('Drama Club');
    await expect(wizard.notInvited(3)).toContainText('ages 12 to 18');
    await wizard.expectAccessible();
    await wizard.expectNoHorizontalScroll();
  });
});

test.describe('Import a roster where Learning is off', () => {
  test.use({ signedInAs: 'm-grace' });

  test('Given Northgate, then Youth email is not offered and the column is skipped; cohorts still place', async ({ page }) => {
    const wizard = new ImportRosterPage(page);
    await wizard.open();

    await wizard.upload('northgate-roster.csv', csv.replace('After-School Tutoring', 'Kids Club'));

    await expect(wizard.mapping('Youth email')).toHaveValue('Skip');
    expect(await wizard.fieldsFor('Youth email')).not.toContain('Youth email');
    expect(await wizard.fieldsFor('Group')).toContain('Cohort');
    await wizard.review();
    await expect(wizard.placements).toHaveText('1');
    await expect(wizard.invitations).toHaveCount(0);
  });
});

test.describe('Import a roster as a program director', () => {
  test.use({ signedInAs: 'm-marisol' });

  test('Given Marisol, then Youth email is not offered: only admins invite youth', async ({ page }) => {
    const wizard = new ImportRosterPage(page);
    await wizard.open();

    await wizard.upload('harbourview-roster.csv', csv);

    await expect(wizard.mapping('Youth email')).toHaveValue('Skip');
    expect(await wizard.fieldsFor('Youth email')).not.toContain('Youth email');
  });
});
