import { test, expect } from '../../fixtures/test';
import type { ModuleId } from '../../fixtures/seed';
import { CurriculumAssignmentPage } from '../../pages/curriculum-assignment.page';
import { CurriculumModulePage } from '../../pages/curriculum-module.page';

// Acceptance test. Traces to: L2-074 criteria 1 to 4 and 6 to 8 (an assignment: task, ways to submit, rubric and total, due rules).
const ON: ModuleId[] = ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports', 'Learning'];

test.describe('Authoring assignments', () => {
  test.use({ signedInAs: 'm-marisol' });

  test('Given Leading by Serving, when Marisol creates an assignment after a lesson, then the empty builder opens and the module lists it', async ({ page }) => {
    const module = new CurriculumModulePage(page);
    const assignment = new CurriculumAssignmentPage(page);
    await module.open('cm-serving');
    await module.expectOpen('Leading by Serving');

    await module.newAssignment('Serve a neighbour', 'Lesson 1 · Pick Up the Towel');

    await assignment.expectOpen('Serve a neighbour');
    await expect(assignment.subtitle).toHaveText('Assignment · Leading by Serving');
    await expect(assignment.status).toHaveText('Draft');
    await expect(assignment.attachedTo).toHaveValue('l-towel');
    await expect(assignment.way('Text reflection')).toBeChecked();
    await expect(assignment.noCriteria).toBeVisible();
    await assignment.expectAccessible();
    await page.goBack();
    await module.expectOpen('Leading by Serving');
    await expect(module.assessments).toContainText('Assignment · After Pick Up the Towel · 0 points');
  });

  test('Given the builder, when Marisol writes the task, picks the ways to submit, builds a rubric and sets the due rules, then everything is kept with a 25-point total', async ({ page }) => {
    const assignment = new CurriculumAssignmentPage(page);
    await assignment.open('as-serve');
    await assignment.expectOpen('Serve someone this week');

    await assignment.brief.fill('Choose one person to serve without being asked, then tell us what you noticed.');
    await assignment.way('Photo').check();
    await assignment.addCriterion('Chose someone and served without being asked', '10');
    await assignment.addCriterion('Described what they did and how it felt', '10');
    await assignment.addCriterion('Named one thing they noticed', '4');
    await assignment.editCriterion(3, 'Named one thing they noticed', '5');
    await expect(assignment.total).toHaveText('Total possible: 25 points');
    await assignment.dueDate.fill('2026-11-19');
    await assignment.grace.selectOption({ label: '2 days' });
    await assignment.allowLate.check();
    await assignment.approval.check();
    await assignment.save();

    await expect(assignment.toast).toContainText('Serve someone this week · 25 points');
    await page.reload();
    await assignment.expectOpen('Serve someone this week');
    await expect(assignment.brief).toHaveValue('Choose one person to serve without being asked, then tell us what you noticed.');
    await expect(assignment.way('Text reflection')).toBeChecked();
    await expect(assignment.way('Photo')).toBeChecked();
    expect(await assignment.criteria()).toEqual(['Chose someone and served without being asked', 'Described what they did and how it felt', 'Named one thing they noticed']);
    await expect(assignment.total).toHaveText('Total possible: 25 points');
    await expect(assignment.dueDate).toHaveValue('2026-11-19');
    await expect(assignment.grace).toHaveValue('2');
    await expect(assignment.allowLate).toBeChecked();
    await expect(assignment.approval).toBeChecked();
    await assignment.expectAccessible();
  });

  test('Given a criterion is removed before saving, when Marisol saves, then only the kept criteria count', async ({ page }) => {
    const assignment = new CurriculumAssignmentPage(page);
    await assignment.open('as-serve');
    await assignment.expectOpen('Serve someone this week');
    await assignment.brief.fill('Serve someone.');
    await assignment.addCriterion('Served someone', '10');
    await assignment.addCriterion('Wrote about it', '5');

    await assignment.removeCriterion(1);
    await assignment.save();

    await expect(assignment.toast).toContainText('5 points');
    await page.reload();
    await assignment.expectOpen('Serve someone this week');
    expect(await assignment.criteria()).toEqual(['Wrote about it']);
  });

  test('Given a criterion with no description and no points, when Marisol adds it, then the dialog says what is missing', async ({ page }) => {
    const assignment = new CurriculumAssignmentPage(page);
    await assignment.open('as-serve');
    await assignment.expectOpen('Serve someone this week');

    await assignment.addCriterion('', '0');

    await expect(assignment.dialogError('criterion')).toHaveText('Describe the criterion.');
    await expect(assignment.dialogError('points')).toHaveText('Give it 1 to 100 points.');
    await assignment.expectAccessible();
  });

  test('Given no task and no way to submit, when Marisol saves, then both errors show and the summary is focused', async ({ page }) => {
    const assignment = new CurriculumAssignmentPage(page);
    await assignment.open('as-serve');
    await assignment.expectOpen('Serve someone this week');

    await assignment.way('Text reflection').uncheck();
    await assignment.save();

    await expect(assignment.fieldError('brief')).toHaveText('Describe the task.');
    await expect(assignment.waysError).toHaveText('Choose at least one way to submit.');
    await expect(assignment.errorSummary).toBeFocused();
    await assignment.expectAccessible();
  });

  test('Given the save fails, when Marisol saves, then the alert shows and her changes stay', async ({ page, api }) => {
    const assignment = new CurriculumAssignmentPage(page);
    await assignment.open('as-serve');
    await assignment.expectOpen('Serve someone this week');
    api.failNext('/api/curriculum/assignments/as-serve', 500);

    await assignment.brief.fill('Serve someone.');
    await assignment.save();

    await expect(assignment.failedAlert).toBeVisible();
    await expect(assignment.brief).toHaveValue('Serve someone.');
  });

  test('Given an unknown assignment, when it is opened, then the page says it can’t be found', async ({ page }) => {
    const assignment = new CurriculumAssignmentPage(page);

    await assignment.open('as-unknown');

    await expect(assignment.notFound).toBeVisible();
    await assignment.expectAccessible();
  });

  test('Given the assignment fails to load, when Marisol opens it, then the error state offers Try again', async ({ page, api }) => {
    const assignment = new CurriculumAssignmentPage(page);
    api.failNext('/api/curriculum/assignments/as-serve', 500);

    await assignment.open('as-serve');

    await expect(assignment.errorState).toBeVisible();
    await assignment.expectAccessible();
  });

  test('Given Learning is off, when an assignment is opened directly, then Today opens and the endpoint answers 404', async ({ page, api }) => {
    api.setModules(
      'org-harbourview',
      ON.filter((m) => m !== 'Learning'),
    );
    const assignment = new CurriculumAssignmentPage(page);

    await assignment.open('as-serve');

    await expect(page).toHaveURL(/\/$/);
    expect(await assignment.apiStatus('/api/curriculum/assignments/as-serve')).toBe(404);
  });

  test('Given a phone, when Marisol opens the assignment builder, then nothing scrolls sideways', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    const assignment = new CurriculumAssignmentPage(page);

    await assignment.open('as-serve');
    await assignment.expectOpen('Serve someone this week');

    await assignment.expectNoHorizontalScroll();
    await assignment.expectAccessible();
  });
});

test.describe('Assignments for other roles and organizations', () => {
  test.use({ signedInAs: 'm-aisha' });

  test('Given Aisha, a youth worker, when she opens an assignment, then the page says program directors write the curriculum', async ({ page }) => {
    const assignment = new CurriculumAssignmentPage(page);

    await assignment.open('as-serve');

    await expect(assignment.forbidden).toBeVisible();
    expect(await assignment.apiStatus('/api/curriculum/assignments/as-serve')).toBe(403);
    await assignment.expectAccessible();
  });

  test.describe('at Northgate', () => {
    test.use({ signedInAs: 'm-grace' });

    test('Given Learning is on at Northgate, when Grace requests a Harbourview assignment, then it answers 404', async ({ page, api }) => {
      api.setModules('org-northgate', ['Roster', 'RollCall', 'QuickCards', 'Learning']);
      const assignment = new CurriculumAssignmentPage(page);

      await assignment.open('as-serve');

      await expect(assignment.notFound).toBeVisible();
      expect(await assignment.apiStatus('/api/curriculum/assignments/as-serve')).toBe(404);
    });
  });
});
