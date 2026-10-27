import { test, expect } from '../../fixtures/test';
import { ProgramsPage } from '../../pages/programs.page';

// Acceptance Test
// Traces to: L2-061 (cohorts are programs with a term), L2-012, L2-007, L2-005, L2-035
// Description: a program director names a cohort's term and places a youth on its roster; Roster off hides Programs.
test.describe('Cohorts as a program director', () => {
  test.use({ signedInAs: 'm-marisol' });

  test('Given After-School Tutoring, when Marisol gives it the term 2026–27, then the header and the Programs row show it', async ({ page }) => {
    const programs = new ProgramsPage(page);
    await programs.open();
    await programs.openProgram('After-School Tutoring');

    await programs.edit();
    await programs.term.fill('2026–27');
    await programs.submitProgram('Save program');

    await expect(programs.heading).toHaveText('After-School Tutoring');
    await expect(programs.subtitle).toContainText('2026–27');
    await programs.expectAccessible();

    await programs.open();
    await expect(programs.row('After-School Tutoring')).toContainText('Mon–Thu, 4–6 pm · 2026–27 · 4 of 50 enrolled');
  });

  test('Given the program form, when the term is longer than 40 characters, then the error shows beside the field', async ({ page }) => {
    const programs = new ProgramsPage(page);
    await programs.open();
    await programs.openProgram('After-School Tutoring');
    await programs.edit();

    await programs.term.fill('The long autumn and winter term of 2026 to 2027');
    await programs.submitProgram('Save program');

    await expect(programs.fieldError('term')).toHaveText('Keep the term under 40 characters.');
    await programs.expectAccessible();
  });

  test('Given a cohort with room, when Marisol places Nadia Haddad, then she is on the roster', async ({ page }) => {
    const programs = new ProgramsPage(page);
    await programs.open();
    await programs.openProgram('After-School Tutoring');

    await programs.enroll('nadia', 'Nadia Haddad');

    await expect.poll(() => programs.names(programs.roster)).toContain('Nadia Haddad');
  });

  test('Given Roster is off, when Programs is opened, then it redirects to Today', async ({ page, api }) => {
    api.setModules('org-harbourview', []);
    const programs = new ProgramsPage(page);

    await programs.visitList();

    await expect(page).toHaveURL(/\/$/);
  });
});
