import { test, expect } from '../../fixtures/test';
import type { ModuleId } from '../../fixtures/seed';
import { LearnAssignmentPage } from '../../pages/learn-assignment.page';
import { LearnModulePage } from '../../pages/learn-module.page';
import { TodayPage } from '../../pages/today.page';

// Acceptance test. Traces to: L2-077 criteria 1 to 7, L2-078 criteria 1 to 6, L2-079 criteria 1 to 4 (an assignment's brief, submitting work
// with a file, following its status, revising and resubmitting, drafts and the leave warning, Learning off), L2-035.
const SUITE: ModuleId[] = [
  'Roster',
  'Slips',
  'RollCall',
  'QuickCards',
  'Pickup',
  'Messages',
  'Incidents',
  'Reports',
];
const ASSIGNMENT = 'Serve someone this week';

test.describe('Submit assignments', () => {
  test.use({ signedInAs: 'm-sofia' });

  test.beforeEach(({ api }) => {
    api.setModules('org-harbourview', [...SUITE, 'Learning']);
    api.giveConsent('c-sofia');
    api.saveOnboarding('m-sofia', {
      step: 3,
      preferredName: 'Sofía',
      completed: true,
    });
    api.curriculumState.youthJourney();
    api.curriculumState.assessments.assignmentJourney();
    api.assignYouthMentor('c-sofia', 'm-daniel');
  });

  test('Given Pick Up the Towel is done, when Sofía opens the assignment from the module, then she reads the task, due date, ways to submit, rubric and reviewer', async ({
    page,
    api,
  }) => {
    api.learningState.complete('m-sofia', 'l-strengths', 'l-values', 'l-towel');
    const module = new LearnModulePage(page);
    const assignment = new LearnAssignmentPage(page);
    await module.open('cm-serving');
    await expect(module.assignment(ASSIGNMENT)).toContainText('25 points');
    await expect(module.assignment(ASSIGNMENT)).toContainText('Due Thu 19 Nov');
    await expect(module.assignment(ASSIGNMENT)).toContainText('Up next');

    await module.openAssignment(ASSIGNMENT);

    await assignment.expectOpen(ASSIGNMENT);
    await expect(assignment.status).toHaveText('Not started');
    await expect(assignment.fact('Due')).toContainText('Thu 19 Nov');
    await expect(assignment.fact('Due')).toContainText('14 days left');
    await expect(assignment.fact('Submit')).toContainText('Text + photo');
    await expect(assignment.fact('Points')).toContainText('25');
    await expect(assignment.task).toContainText('Choose one person to serve without being asked');
    await expect(
      assignment.criterion('Chose someone and served without being asked'),
    ).toContainText('10 points');
    await expect(assignment.criterion('Named one thing they noticed')).toContainText('5 points');
    await expect(assignment.rubricTotal).toContainText('25 points');
    await expect(assignment.reviewer).toContainText('Daniel Osei');
    await expect(assignment.startButton).toBeVisible();
    await assignment.expectNoHorizontalScroll();
    await assignment.expectAccessible();
  });

  test('Given Pick Up the Towel is not done, when she opens the assignment, then it is locked, named on the module, and the server refuses it', async ({
    page,
    api,
  }) => {
    api.learningState.complete('m-sofia', 'l-strengths', 'l-values');
    const module = new LearnModulePage(page);
    const assignment = new LearnAssignmentPage(page);
    await module.open('cm-serving');
    await expect(module.assignment(ASSIGNMENT)).toContainText('Unlocks after Pick Up the Towel');

    await assignment.open('as-serve');

    await expect(assignment.locked('Pick Up the Towel')).toBeVisible();
    expect(await assignment.apiStatus('as-serve')).toBe(403);
    await assignment.expectAccessible();
  });

  test('Given the due date and grace period have passed, when she opens the assignment, then it says late work is still accepted, or that submissions are closed', async ({
    page,
    api,
  }) => {
    api.learningState.complete('m-sofia', 'l-strengths', 'l-values', 'l-towel');
    api.curriculumState.assessments.assignmentJourney({
      dueDate: '2026-11-02',
      graceDays: 1,
      allowLate: true,
    });
    const assignment = new LearnAssignmentPage(page);
    await assignment.open('as-serve');
    await expect(assignment.notice).toContainText('This is past its due date');
    await expect(assignment.startButton).toBeVisible();

    api.curriculumState.assessments.assignmentJourney({
      dueDate: '2026-11-02',
      graceDays: 1,
      allowLate: false,
    });
    await assignment.open('as-serve');

    await expect(assignment.notice).toContainText('Submissions are closed');
    await expect(assignment.status).toHaveText('Closed');
    await expect(assignment.startButton).toHaveCount(0);
    await assignment.expectAccessible();
  });

  test('Given an unknown assignment or one that fails to load, then the page says so', async ({
    page,
    api,
  }) => {
    api.learningState.complete('m-sofia', 'l-strengths', 'l-values', 'l-towel');
    const assignment = new LearnAssignmentPage(page);

    await assignment.open('as-missing');
    await expect(assignment.notFound).toBeVisible();

    api.learningState.work.failReads = true;
    await assignment.open('as-serve');
    await expect(assignment.loadError).toBeVisible();
    await assignment.expectAccessible();
  });

  test('Given Learning is off, when an assignment is opened directly, then Today opens and the API answers 404', async ({
    page,
    api,
  }) => {
    api.learningState.complete('m-sofia', 'l-strengths', 'l-values', 'l-towel');
    api.setModules('org-harbourview', SUITE);
    const assignment = new LearnAssignmentPage(page);

    await assignment.open('as-serve');

    await expect(page).toHaveURL(/\/$/);
    await expect(new TodayPage(page).heading).toHaveText('Welcome, Sofía');
    expect(await assignment.apiStatus('as-serve')).toBe(404);
  });
});
