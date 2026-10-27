import { test, expect } from '../../fixtures/test';
import { MentoringPage } from '../../pages/mentoring.page';
import { ProgramsPage } from '../../pages/programs.page';

// Acceptance Test
// Traces to: L2-062 (mentors for youth and for whole cohorts), L2-007, L2-005, L2-035
// Description: a program director assigns a mentor to a youth on a cohort's roster; the mentor sees the youth.
test.describe('Assigning a mentor to a youth', () => {
  test.use({ signedInAs: 'm-marisol' });

  test('Given After-School Tutoring with Mentoring on, when Marisol assigns Daniel Osei to Mateo, then the row names him and a toast confirms', async ({ page }) => {
    const programs = new ProgramsPage(page);
    await programs.open();
    await programs.openProgram('After-School Tutoring');
    await expect(programs.row('Mateo Rivera', programs.roster)).toContainText('No mentor');
    await programs.expectAccessible();

    await programs.openAssignMentor('Mateo Rivera');
    await expect(programs.dialog).toHaveAccessibleName('Assign a mentor to Mateo Rivera');
    await programs.expectAccessible();
    await programs.chooseMentor('Daniel Osei');
    await programs.submitDialog('Assign mentor');

    await expect(programs.dialog).toBeHidden();
    await expect(programs.toast('Mentor assigned')).toBeVisible();
    await expect(programs.row('Mateo Rivera', programs.roster)).toContainText('Mentor: Daniel Osei');
    await programs.expectNoHorizontalScroll();
  });

  test('Given the assign-mentor dialog, when Marisol saves without choosing, then it asks her to choose a mentor', async ({ page }) => {
    const programs = new ProgramsPage(page);
    await programs.open();
    await programs.openProgram('After-School Tutoring');
    await programs.openAssignMentor('Mateo Rivera');

    await programs.submitDialog('Assign mentor');

    await expect(programs.fieldError('mentor')).toHaveText('Choose a mentor.');
    await expect(programs.dialog).toBeVisible();
    await programs.expectAccessible();
  });

  test('Given the server fails, when Marisol assigns a mentor, then the dialog says so and keeps her choice', async ({ page, api }) => {
    const programs = new ProgramsPage(page);
    await programs.open();
    await programs.openProgram('After-School Tutoring');
    await programs.openAssignMentor('Mateo Rivera');
    await programs.chooseMentor('Hana Kim');
    api.failNext('/api/programs/p-tutoring/youth/c-mateo/mentor', 500);

    await programs.submitDialog('Assign mentor');

    await expect(programs.dialog.getByRole('alert')).toContainText('Mateo’s mentor was not changed');
    await expect(programs.dialog.getByLabel('Mentor')).toHaveValue(/.+/);
    api.recover('/api/programs/p-tutoring/youth/c-mateo/mentor');
    await programs.submitDialog('Assign mentor');
    await expect(programs.row('Mateo Rivera', programs.roster)).toContainText('Mentor: Hana Kim');
  });

  test('Given Mateo has a mentor, when Marisol removes the mentor, then the row says No mentor', async ({ page }) => {
    const programs = new ProgramsPage(page);
    await programs.open();
    await programs.openProgram('After-School Tutoring');
    await programs.openAssignMentor('Mateo Rivera');
    await programs.chooseMentor('Daniel Osei');
    await programs.submitDialog('Assign mentor');
    await expect(programs.row('Mateo Rivera', programs.roster)).toContainText('Mentor: Daniel Osei');

    await programs.openAssignMentor('Mateo Rivera');
    await programs.submitDialog('Remove mentor');

    await expect(programs.row('Mateo Rivera', programs.roster)).toContainText('No mentor');
  });
});

test.describe('Mentor assignment for a site lead', () => {
  test('Given a site lead, when the program opens, then mentors are shown without the Mentor action', async ({ page }) => {
    const programs = new ProgramsPage(page);
    await programs.open();
    await programs.openProgram('After-School Tutoring');

    await expect(programs.row('Mateo Rivera', programs.roster)).toContainText('No mentor');
    await expect(programs.roster.getByRole('button', { name: /^Assign a mentor/ })).toHaveCount(0);
  });
});

test.describe('The mentor’s youth', () => {
  test.use({ signedInAs: 'm-daniel' });

  test('Given Daniel mentors Mateo, when he opens Mentoring, then Mateo is listed by name', async ({ page, api }) => {
    api.assignYouthMentor('c-mateo', 'm-daniel');
    const mentoring = new MentoringPage(page);

    await mentoring.open();

    await mentoring.expectOpen();
    await expect(mentoring.youth).toHaveText(['Mateo Rivera']);
    await mentoring.expectAccessible();
  });
});
