import { test, expect } from '../../fixtures/test';
import type { ModuleId } from '../../fixtures/seed';
import { CurriculumLessonPage } from '../../pages/curriculum-lesson.page';
import { CurriculumModulePage } from '../../pages/curriculum-module.page';
import { CurriculumPage } from '../../pages/curriculum.page';

// Acceptance test. Traces to: L2-067 criteria 1 to 6, 9 and 10 (lessons), L2-066 criterion 6 (module and track status).
const ON: ModuleId[] = ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports', 'Learning'];

test.describe('Authoring lessons', () => {
  test.use({ signedInAs: 'm-marisol' });

  test('Given Leading by Serving, when Marisol adds a lesson, then the lesson editor opens on it and the module lists it last', async ({ page }) => {
    const module = new CurriculumModulePage(page);
    const lesson = new CurriculumLessonPage(page);
    await module.open('cm-serving');
    await module.expectOpen('Leading by Serving');
    expect(await module.lessonTitles()).toEqual(['1. Pick Up the Towel', '2. Last in Line', '3. Leading Like a Coach']);
    await module.expectAccessible();

    await module.addLesson('Serving Without Being Seen');

    await lesson.expectOpen('Serving Without Being Seen');
    await expect(lesson.subtitle).toHaveText('Leading by Serving · Lesson 4 of 4');
    await expect(lesson.status).toHaveText('Draft');
    await page.goBack();
    await module.expectOpen('Leading by Serving');
    expect(await module.lessonTitles()).toContain('4. Serving Without Being Seen');
  });

  test('Given the lesson editor, when Marisol saves every field, then a toast confirms and each field is kept after a reload', async ({ page }) => {
    const lesson = new CurriculumLessonPage(page);
    await lesson.open('l-line');
    await lesson.expectOpen('Last in Line');
    await lesson.expectAccessible();

    await lesson.reading.fill('The coach who carried the cones');
    await lesson.minutes.fill('15');
    await lesson.objectives.fill('Put the team first\nWait your turn');
    await lesson.body.fill('The best coaches are the last to leave the field.');
    await lesson.prompts.fill('When did you let someone go first?');
    await lesson.leaderNotes.fill('Ask the group for examples from sport.');
    await lesson.save();

    await expect(lesson.toast).toContainText('Lesson saved');
    await page.reload();
    await lesson.expectOpen('Last in Line');
    await expect(lesson.reading).toHaveValue('The coach who carried the cones');
    await expect(lesson.minutes).toHaveValue('15');
    await expect(lesson.objectives).toHaveValue('Put the team first\nWait your turn');
    await expect(lesson.body).toHaveValue('The best coaches are the last to leave the field.');
    await expect(lesson.prompts).toHaveValue('When did you let someone go first?');
    await expect(lesson.leaderNotes).toHaveValue('Ask the group for examples from sport.');
  });

  test('Given no title and 900 minutes, when Marisol saves, then both errors show beside their fields and in the focused summary', async ({ page }) => {
    const lesson = new CurriculumLessonPage(page);
    await lesson.open('l-towel');
    await lesson.expectOpen('Pick Up the Towel');

    await lesson.title.fill('');
    await lesson.minutes.fill('900');
    await lesson.save();

    await expect(lesson.fieldError('title')).toHaveText('Give the lesson a title.');
    await expect(lesson.fieldError('minutes')).toHaveText('Estimate between 1 and 600 minutes.');
    await expect(lesson.errorSummary).toBeFocused();
    await lesson.expectAccessible();
  });

  test('Given three lessons, when Marisol moves Pick Up the Towel down, then the order is saved', async ({ page }) => {
    const module = new CurriculumModulePage(page);
    await module.open('cm-serving');
    await module.expectOpen('Leading by Serving');

    await module.moveDown('Pick Up the Towel').click();

    await expect.poll(() => module.lessonTitles()).toEqual(['1. Last in Line', '2. Pick Up the Towel', '3. Leading Like a Coach']);
    await page.reload();
    await module.expectOpen('Leading by Serving');
    expect(await module.lessonTitles()).toEqual(['1. Last in Line', '2. Pick Up the Towel', '3. Leading Like a Coach']);
  });

  test('Given a lesson with no teaching content, when Marisol publishes it, then the dialog refuses; with content it publishes', async ({ page }) => {
    const lesson = new CurriculumLessonPage(page);
    await lesson.open('l-coach');
    await lesson.expectOpen('Leading Like a Coach');

    await lesson.changeStatus('Published');
    await expect(lesson.statusError).toHaveText('Add teaching content before publishing.');
    await lesson.expectAccessible();
    await page.keyboard.press('Escape');

    await lesson.body.fill('A coach watches, then helps each player get better.');
    await lesson.save();
    await expect(lesson.toast).toContainText('Lesson saved');
    await lesson.changeStatus('Published');

    await expect(lesson.dialog).toBeHidden();
    await expect(lesson.status).toHaveText('Published');
  });

  test('Given Leading by Serving in review, when Marisol publishes it, then it is published; a module with no lessons cannot be', async ({ page }) => {
    const module = new CurriculumModulePage(page);
    await module.open('cm-serving');
    await module.expectOpen('Leading by Serving');
    await expect(module.status).toHaveText('In review');

    await module.changeStatus('Published');
    await expect(module.dialog).toBeHidden();
    await expect(module.status).toHaveText('Published');

    await module.open('cm-online');
    await module.expectOpen('Staying Safe Online');
    await expect(module.noLessons).toBeVisible();
    await module.changeStatus('Published');
    await expect(module.statusError).toHaveText('Add a lesson before publishing the module.');
    await module.expectAccessible();
  });

  test('Given Digital Skills is a draft, when Marisol publishes the track, then its badge reads Published', async ({ page }) => {
    const curriculum = new CurriculumPage(page);
    await curriculum.openLoaded();

    await curriculum.changeTrackStatus('Digital Skills', 'Published');

    await expect(curriculum.dialog).toBeHidden();
    await expect(curriculum.trackStatus('Digital Skills')).toHaveText('Published');
  });

  test('Given a lesson, when Marisol deletes it and confirms, then the module no longer lists it and its address says it can’t be found', async ({ page }) => {
    const lesson = new CurriculumLessonPage(page);
    const module = new CurriculumModulePage(page);
    await lesson.open('l-line');
    await lesson.expectOpen('Last in Line');

    await lesson.delete();
    await lesson.expectAccessible();
    await lesson.confirmDelete();

    await module.expectOpen('Leading by Serving');
    await expect(module.toast).toContainText('Lesson deleted');
    expect(await module.lessonTitles()).toEqual(['1. Pick Up the Towel', '2. Leading Like a Coach']);
    await lesson.open('l-line');
    await expect(lesson.notFound).toBeVisible();
    await lesson.expectAccessible();
  });

  test('Given Learning is off, when a lesson editor is opened directly, then Today opens and the lesson endpoint answers 404', async ({ page, api }) => {
    api.setModules(
      'org-harbourview',
      ON.filter((m) => m !== 'Learning'),
    );
    const lesson = new CurriculumLessonPage(page);

    await lesson.open('l-towel');

    await expect(page).toHaveURL(/\/$/);
    expect(await lesson.apiStatus('/api/curriculum/lessons/l-towel')).toBe(404);
  });

  test('Given a phone, when Marisol opens a lesson, then nothing scrolls sideways and the editor passes axe', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    const lesson = new CurriculumLessonPage(page);

    await lesson.open('l-towel');
    await lesson.expectOpen('Pick Up the Towel');

    await lesson.expectNoHorizontalScroll();
    await lesson.expectAccessible();
  });
});

test.describe('Lessons and youth', () => {
  test.use({ signedInAs: 'm-sofia' });

  test('Given a youth, when she asks for a lesson with its leader notes, then the API refuses her', async ({ page, api }) => {
    api.giveConsent('c-sofia');
    const lesson = new CurriculumLessonPage(page);
    await page.goto('/');

    expect(await lesson.apiStatus('/api/curriculum/lessons/l-towel')).toBe(403);
  });
});
