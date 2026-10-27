import { test, expect } from '../../fixtures/test';
import type { ModuleId } from '../../fixtures/seed';
import { CurriculumProgressionPage } from '../../pages/curriculum-progression.page';
import { CurriculumPage } from '../../pages/curriculum.page';

// Acceptance test. Traces to: L2-086 criteria 1 to 8 (stages in order with their competencies, add, edit and reorder stages, add and
// remove competencies, refusals, roles, tenants and the Learning gate), L2-082.
const ON: ModuleId[] = ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports', 'Learning'];

test.describe('Authoring the progression framework', () => {
  test.use({ signedInAs: 'm-marisol' });

  test('Given Harbourview’s framework, when Marisol opens Progression from Curriculum, then each stage shows in order with its competencies', async ({ page }) => {
    const curriculum = new CurriculumPage(page);
    const progression = new CurriculumProgressionPage(page);
    await curriculum.openLoaded();

    await curriculum.openProgression();

    await progression.expectOpen();
    expect(await progression.stageTitles()).toEqual(['1. Explorer', '2. Contributor', '3. Leader']);
    expect(await progression.competencies('Explorer')).toEqual(['Serves others', 'Works with others']);
    expect(await progression.competencies('Contributor')).toEqual(['Speaks up', 'Follows through']);
    await expect(progression.howYouthAdvance).toContainText('Proficient or Mastered');
    await expect(progression.moveUp('Explorer')).toBeDisabled();
    await expect(progression.moveDown('Leader')).toBeDisabled();
    await progression.expectAccessible();
  });

  test('Given Add stage, when Marisol adds Mentor, then it is the last stage with no competencies and a toast confirms', async ({ page, api }) => {
    const progression = new CurriculumProgressionPage(page);
    await progression.open();
    await progression.expectOpen();

    await progression.addStage('Mentor', 'Helps a newer youth find their feet');

    await expect(progression.dialog).toBeHidden();
    await expect(progression.toast).toContainText('Stage added');
    await expect.poll(() => progression.stageTitles()).toEqual(['1. Explorer', '2. Contributor', '3. Leader', '4. Mentor']);
    await expect(progression.stage('Mentor')).toContainText('No competencies yet');
    expect(api.progression.stagesOf('org-harbourview').map((s) => s.name)).toEqual(['Explorer', 'Contributor', 'Leader', 'Mentor']);
  });

  test('Given a blank stage name, when Marisol adds it, then the dialog says to give the stage a name', async ({ page }) => {
    const progression = new CurriculumProgressionPage(page);
    await progression.open();
    await progression.expectOpen();

    await progression.addStage(' ');

    await expect(progression.dialogError('stage-name')).toHaveText('Give the stage a name.');
    await progression.expectAccessible();
  });

  test('Given Explorer, when Marisol renames it Newcomer, then its card says so', async ({ page }) => {
    const progression = new CurriculumProgressionPage(page);
    await progression.open();
    await progression.expectOpen();

    await progression.editStage('Explorer', 'Newcomer');

    await expect.poll(() => progression.stageTitles()).toEqual(['1. Newcomer', '2. Contributor', '3. Leader']);
  });

  test('Given Contributor, when Marisol moves it up, then the order is saved', async ({ page, api }) => {
    const progression = new CurriculumProgressionPage(page);
    await progression.open();
    await progression.expectOpen();

    await progression.moveUp('Contributor').click();

    await expect.poll(() => progression.stageTitles()).toEqual(['1. Contributor', '2. Explorer', '3. Leader']);
    expect(api.progression.stagesOf('org-harbourview').map((s) => s.name)).toEqual(['Contributor', 'Explorer', 'Leader']);
  });

  test('Given Explorer, when Marisol adds Welcomes someone new, then it joins Explorer and mentors assess it', async ({ page, api }) => {
    const progression = new CurriculumProgressionPage(page);
    await progression.open();
    await progression.expectOpen();

    await progression.addCompetency('Explorer', 'Welcomes someone new', 'Says hello, learns their name and includes them.');

    await expect(progression.dialog).toBeHidden();
    await expect.poll(() => progression.competencies('Explorer')).toEqual(['Serves others', 'Works with others', 'Welcomes someone new']);
    expect(api.reviews.competencies.filter((c) => c.organizationId === 'org-harbourview').at(-1)?.name).toBe('Welcomes someone new');
  });

  test('Given a blank competency, when Marisol adds it, then the dialog says to name it', async ({ page }) => {
    const progression = new CurriculumProgressionPage(page);
    await progression.open();
    await progression.expectOpen();

    await progression.addCompetency('Leader', '');

    await expect(progression.dialogError('competency-name')).toHaveText('Name the competency.');
    await progression.expectAccessible();
  });

  test('Given the competency fails to save, when Marisol adds it, then the dialog stays open with a retry', async ({ page, api }) => {
    const progression = new CurriculumProgressionPage(page);
    await progression.open();
    await progression.expectOpen();
    api.failNext('/api/curriculum/progression/stages/st-leader/competencies', 500);

    await progression.addCompetency('Leader', 'Mentors a newer youth');

    await expect(progression.dialogAlert).toContainText('The competency was not added. Try again.');
  });

  test('Given Works with others, when Marisol removes it, then it leaves Explorer and a toast says earlier assessments are kept', async ({ page, api }) => {
    const progression = new CurriculumProgressionPage(page);
    await progression.open();
    await progression.expectOpen();

    await progression.removeCompetency('Works with others');

    await expect(progression.toast).toContainText('Earlier assessments are kept.');
    await expect.poll(() => progression.competencies('Explorer')).toEqual(['Serves others']);
    expect(api.reviews.competencies.find((c) => c.id === 'cp-works')?.removed).toBe(true);
  });

  test('Given no stages, when Marisol opens Progression, then the page offers Add stage', async ({ page, api }) => {
    api.progression.clear('org-harbourview');
    const progression = new CurriculumProgressionPage(page);

    await progression.open();

    await expect(progression.noStages).toBeVisible();
    await progression.expectAccessible();
  });

  test('Given the framework fails to load, when Marisol opens it, then the error state offers Try again', async ({ page, api }) => {
    api.failNext('/api/curriculum/progression', 500);
    const progression = new CurriculumProgressionPage(page);

    await progression.open();

    await expect(progression.errorState).toBeVisible();
    await progression.expectAccessible();
  });

  test('Given Learning is off, when Progression is opened directly, then Today opens and the endpoint answers 404', async ({ page, api }) => {
    api.setModules(
      'org-harbourview',
      ON.filter((m) => m !== 'Learning'),
    );
    const progression = new CurriculumProgressionPage(page);

    await progression.open();

    await expect(page).toHaveURL(/\/$/);
    expect(await progression.apiStatus('/api/curriculum/progression')).toBe(404);
  });

  test('Given a phone, when Marisol opens Progression, then nothing scrolls sideways', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    const progression = new CurriculumProgressionPage(page);

    await progression.open();
    await progression.expectOpen();

    await progression.expectNoHorizontalScroll();
    await progression.expectAccessible();
  });
});

test.describe('The framework for other roles and organizations', () => {
  test('Given Jaylen, a site lead, when he opens Progression, then the page says program directors write the curriculum', async ({ page }) => {
    const progression = new CurriculumProgressionPage(page);

    await progression.open();

    await expect(progression.forbidden).toBeVisible();
    expect(await progression.apiStatus('/api/curriculum/progression')).toBe(403);
    await progression.expectAccessible();
  });

  test.describe('at Northgate', () => {
    test.use({ signedInAs: 'm-grace' });

    test('Given Learning is on at Northgate, when Grace opens Progression, then only Northgate’s stages show and Harbourview’s stage answers 404', async ({ page, api }) => {
      api.setModules('org-northgate', ['Roster', 'RollCall', 'QuickCards', 'Learning']);
      const progression = new CurriculumProgressionPage(page);

      await progression.open();

      await progression.expectOpen();
      expect(await progression.stageTitles()).toEqual(['1. Explorer', '2. Contributor']);
      expect(await progression.competencies('Explorer')).toEqual(['Shows kindness', 'Tries new things']);
      expect(await progression.apiPutStatus('/api/curriculum/progression/stages/st-leader', { name: 'Taken' })).toBe(404);
    });
  });
});
