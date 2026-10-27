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

test.describe('Setting a cohort’s mentors', () => {
  test.use({ signedInAs: 'm-marisol' });

  test('Given a cohort with no mentors, when Marisol makes Daniel lead and Hana supporting, then the Mentors card lists both', async ({ page }) => {
    const programs = new ProgramsPage(page);
    await programs.open();
    await programs.openProgram('After-School Tutoring');
    await expect(programs.mentorsEmpty).toBeVisible();

    await programs.openCohortMentors();
    await expect(programs.dialog).toHaveAccessibleName('Mentors for After-School Tutoring');
    await programs.chooseMentor('Daniel Osei', 'Lead mentor');
    await programs.toggleSupporting('Hana Kim');
    await programs.expectAccessible();
    await programs.submitDialog('Save mentors');

    await expect(programs.dialog).toBeHidden();
    await expect(programs.mentorsCard.getByRole('listitem')).toHaveText([/Daniel Osei\s*Lead mentor/, /Hana Kim\s*Supporting mentor/]);
    await expect(programs.toast('Mentors saved')).toBeVisible();
    await programs.expectAccessible();
    await programs.expectNoHorizontalScroll();
  });

  test('Given the cohort-mentors dialog, when saved with no lead or with the lead also supporting, then it explains', async ({ page }) => {
    const programs = new ProgramsPage(page);
    await programs.open();
    await programs.openProgram('After-School Tutoring');
    await programs.openCohortMentors();

    await programs.submitDialog('Save mentors');
    await expect(programs.fieldError('lead')).toHaveText('Choose a lead mentor.');

    await programs.chooseMentor('Daniel Osei', 'Lead mentor');
    await programs.toggleSupporting('Daniel Osei');
    await programs.submitDialog('Save mentors');
    await expect(programs.dialog.getByText('The lead mentor can’t also be a supporting mentor.')).toBeVisible();
    await programs.expectAccessible();
  });

  test('Given the server fails, when Marisol saves the mentors, then the dialog says so and keeps her choices', async ({ page, api }) => {
    const programs = new ProgramsPage(page);
    await programs.open();
    await programs.openProgram('After-School Tutoring');
    await programs.openCohortMentors();
    await programs.chooseMentor('Hana Kim', 'Lead mentor');
    api.failNext('/api/programs/p-tutoring/mentors', 500);

    await programs.submitDialog('Save mentors');

    await expect(programs.dialog.getByRole('alert')).toContainText('The cohort’s mentors were not changed');
    await expect(programs.dialog.getByLabel('Lead mentor', { exact: true })).not.toHaveValue('');
  });
});

test.describe('The lead mentor’s youth', () => {
  test.use({ signedInAs: 'm-hana' });

  test('Given Hana leads Saturday Sports, when she opens Mentoring, then its youth are listed', async ({ page, api }) => {
    api.setCohortTeam('p-sports', 'm-hana');
    const mentoring = new MentoringPage(page);

    await mentoring.open();

    await expect(mentoring.youth).toHaveText(['Emily Tran', 'Kevin Tran']);
  });
});

test.describe('Mentoring off and archived cohorts', () => {
  test.use({ signedInAs: 'm-marisol' });

  test('Given Mentoring is off, when the program opens, then nothing about mentors is requested or rendered and the API answers 404', async ({ page, api }) => {
    api.setCohortTeam('p-tutoring', 'm-daniel');
    api.setModules('org-harbourview', ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports', 'Learning']);
    const programs = new ProgramsPage(page);
    const requested = programs.recordApiPaths();
    await programs.open();
    await programs.openProgram('After-School Tutoring');
    await expect.poll(() => programs.names(programs.roster)).toContain('Mateo Rivera');

    await expect(programs.row('Mateo Rivera', programs.roster)).not.toContainText('mentor');
    await expect(page.getByRole('heading', { name: 'Mentors' })).toHaveCount(0);
    await expect(programs.roster.getByRole('button', { name: /^Assign a mentor/ })).toHaveCount(0);
    expect(requested.filter((path) => path.endsWith('/mentoring'))).toEqual([]);
    expect(await programs.apiStatus('/api/programs/p-tutoring/mentoring')).toBe(404);
    await programs.expectAccessible();

    api.setModules('org-harbourview', ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports', 'Learning', 'Mentoring']);
    await page.reload();
    await expect(programs.mentorsCard).toContainText('Daniel Osei');
  });

  test('Given an archived cohort with mentors, when it opens, then its mentors are read only', async ({ page, api }) => {
    api.setCohortTeam('p-tutoring', 'm-daniel', ['m-hana']);
    const programs = new ProgramsPage(page);
    await programs.open();
    await programs.openProgram('After-School Tutoring');
    await programs.archive('After-School Tutoring');

    await expect(programs.archivedNotice).toBeVisible();
    await expect(programs.mentorsCard).toContainText('Hana Kim');
    await expect(page.getByRole('button', { name: 'Edit mentors' })).toHaveCount(0);
    await expect(programs.roster.getByRole('button', { name: /^Assign a mentor/ })).toHaveCount(0);
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
