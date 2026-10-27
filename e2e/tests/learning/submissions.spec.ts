import { test, expect } from '../../fixtures/test';
import type { ModuleId } from '../../fixtures/seed';
import { LearnAssignmentPage } from '../../pages/learn-assignment.page';
import { LearnModulePage } from '../../pages/learn-module.page';
import { LearnSubmissionPage } from '../../pages/learn-submission.page';
import { LearnSubmitPage } from '../../pages/learn-submit.page';
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
const TOWEL = ['l-strengths', 'l-values', 'l-towel'];
const REFLECTION =
  'On Tuesday I stayed after tutoring to stack the chairs and wipe the tables so Jaylen could lock up on time. Nobody asked me. It felt small, but he noticed and said thanks.';
const PNG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82]);
const PDF = Buffer.from('%PDF-1.7\n', 'utf-8');

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

  test('Given the assignment is open, when Sofía writes her reflection, adds a photo, confirms it is her own work and submits, then it is Submitted and read only', async ({
    page,
    api,
  }) => {
    api.learningState.complete('m-sofia', ...TOWEL);
    const assignment = new LearnAssignmentPage(page);
    const submit = new LearnSubmitPage(page);
    const submission = new LearnSubmissionPage(page);
    await assignment.open('as-serve');
    await assignment.start();
    await submit.expectOpen(ASSIGNMENT);

    await submit.write(REFLECTION);
    await submit.attach('stacked-chairs.png', 'image/png', PNG);
    await expect(submit.chosenFile('stacked-chairs.png')).toContainText('Photo');
    await submit.attest();
    await submit.expectAccessible();
    await submit.submit();
    await expect(submit.dialog).toContainText('Daniel Osei reviews your work');
    await submit.expectAccessible();
    await submit.confirm();

    await submission.expectOpen(ASSIGNMENT);
    await expect(submission.status).toHaveText('Submitted');
    await expect(submission.alert('It’s in')).toContainText('Daniel Osei reviews it next');
    await expect(submission.sent).toContainText(REFLECTION);
    await expect(submission.sent).toContainText('stacked-chairs.png');
    await expect(submission.history).toHaveCount(1);
    await expect(submission.history.first()).toContainText('Sofía Rivera submitted it');
    await expect(submission.reviseButton).toHaveCount(0);
    await submission.expectNoHorizontalScroll();
    await submission.expectAccessible();
    await assignment.open('as-serve');
    await expect(assignment.status).toHaveText('Submitted');
    await expect(assignment.seeSubmissionButton).toBeVisible();
    await new LearnModulePage(page).open('cm-serving');
    await expect(new LearnModulePage(page).assignment(ASSIGNMENT)).toContainText('Submitted');
  });

  test('Given she submits with no reflection and the box unticked, then the errors show beside the fields and in a summary, and nothing is sent', async ({
    page,
    api,
  }) => {
    api.learningState.complete('m-sofia', ...TOWEL);
    const submit = new LearnSubmitPage(page);
    await submit.open('as-serve');

    await submit.submit();

    await expect(submit.errorSummary).toContainText('Write your reflection.');
    await expect(submit.errorSummary).toContainText('Confirm this is your own work.');
    await expect(submit.fieldError('reflection')).toHaveText('Write your reflection.');
    await expect(submit.fieldError('attest')).toHaveText('Confirm this is your own work.');
    await expect(submit.dialog).toHaveCount(0);
    expect(api.learningState.work.all()).toHaveLength(0);
    await submit.expectAccessible();
  });

  test('Given she chooses a PDF where a photo is asked for, then it is not attached and the field says what fits', async ({ page, api }) => {
    api.learningState.complete('m-sofia', ...TOWEL);
    const submit = new LearnSubmitPage(page);
    await submit.open('as-serve');

    await submit.attach('weekly-schedule.pdf', 'application/pdf', PDF);

    await expect(submit.alert('That file can’t be used')).toContainText('“weekly-schedule.pdf” was not attached. Choose a JPG or PNG photo of up to 10 MB.');
    await expect(submit.fieldError('file')).toHaveText('Choose a JPG or PNG photo of up to 10 MB.');
    await expect(submit.chosenFile('weekly-schedule.pdf')).toHaveCount(0);
    await submit.expectAccessible();
  });

  test('Given the send fails, then the dialog says so and her work stays on the page', async ({ page, api }) => {
    api.learningState.complete('m-sofia', ...TOWEL);
    api.learningState.work.failSubmits = true;
    const submit = new LearnSubmitPage(page);
    await submit.open('as-serve');
    await submit.write(REFLECTION);
    await submit.attest();

    await submit.submit();
    await submit.confirm();

    await expect(submit.dialogFailure).toContainText('Your work was not sent');
    await submit.keepEditing();
    await expect(submit.reflection).toHaveValue(REFLECTION);
  });

  test('Given she already submitted it, or submissions closed, when the submit page opens, then it says so and offers the way on', async ({ page, api }) => {
    api.learningState.complete('m-sofia', ...TOWEL);
    api.learningState.work.seed({ membershipId: 'm-sofia', assignmentId: 'as-serve', text: REFLECTION });
    const submit = new LearnSubmitPage(page);
    await submit.open('as-serve');
    await expect(submit.stateHeading('You’ve already submitted this')).toBeVisible();
    await submit.expectAccessible();

    api.learningState.work.clear();
    api.curriculumState.assessments.assignmentJourney({ dueDate: '2026-11-02', graceDays: 1, allowLate: false });
    await submit.open('as-serve');
    await expect(submit.stateHeading('Submissions are closed')).toBeVisible();
  });

  test('Given a phone, when Sofía submits her reflection, then the form and her submission fit the screen', async ({ page, api }) => {
    test.skip(!new LearnSubmitPage(page).isPhone, 'Phone layout');
    api.learningState.complete('m-sofia', ...TOWEL);
    const submit = new LearnSubmitPage(page);
    await submit.open('as-serve');
    await submit.write(REFLECTION);
    await submit.attest();
    await submit.expectNoHorizontalScroll();
    await submit.submit();
    await submit.confirm();
    const submission = new LearnSubmissionPage(page);
    await expect(submission.status).toHaveText('Submitted');
    await submission.expectNoHorizontalScroll();
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
    await new LearnSubmitPage(page).open('as-serve');
    await expect(page).toHaveURL(/\/$/);
    await new LearnSubmissionPage(page).open('sub-1');
    await expect(page).toHaveURL(/\/$/);
    expect(await new LearnSubmissionPage(page).apiStatus('sub-1')).toBe(404);
  });
});
