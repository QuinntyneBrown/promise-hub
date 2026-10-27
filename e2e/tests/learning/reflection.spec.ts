import { test, expect } from '../../fixtures/test';
import type { ModuleId } from '../../fixtures/seed';
import { LearnLessonPage } from '../../pages/learn-lesson.page';
import { LearnReflectionPage } from '../../pages/learn-reflection.page';
import { TodayPage } from '../../pages/today.page';

// Acceptance test. Traces to: L2-089 criteria 1 to 3, 7 and 8 (writing and saving a reflection, its checks, private or shared, the lesson,
// consent and module gates), L2-035, L2-036.
const SUITE: ModuleId[] = ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports'];
const WORDS = 'My little brother Mateo cleared the table after dinner without anyone asking. I want to be the one who notices first.';

test.describe('Write reflections', () => {
  test.use({ signedInAs: 'm-sofia' });

  test.beforeEach(({ api }) => {
    api.setModules('org-harbourview', [...SUITE, 'Learning', 'Mentoring']);
    api.giveConsent('c-sofia');
    api.saveOnboarding('m-sofia', { step: 3, preferredName: 'Sofía', completed: true });
    api.curriculumState.youthJourney();
    api.learningState.complete('m-sofia', 'l-strengths', 'l-values');
    api.assignYouthMentor('c-sofia', 'm-daniel');
  });

  test('Given Pick Up the Towel, when Sofía writes her reflection from the lesson and saves it, then it is saved privately and is there when she comes back', async ({
    page,
  }) => {
    const lesson = new LearnLessonPage(page);
    const reflection = new LearnReflectionPage(page);
    await lesson.open('l-towel');

    await lesson.writeReflection();

    await reflection.expectOpen('Pick Up the Towel');
    await expect(reflection.prompts).toContainText('Who picked up the towel for you this week?');
    await expect(reflection.share).not.toBeChecked();
    await reflection.expectAccessible();
    await reflection.write('Thoughtful', WORDS, 'Pack my own lunch on Thursday.');
    await reflection.save();

    await expect(reflection.saved('Reflection saved')).toContainText('Only you can see it.');
    await reflection.expectAccessible();
    await page.reload();
    await reflection.expectOpen('Pick Up the Towel');
    await expect(reflection.mood('Thoughtful')).toBeChecked();
    await expect(reflection.words).toHaveValue(WORDS);
    await expect(reflection.action).toHaveValue('Pack my own lunch on Thursday.');
  });

  test('Given an empty form, when she saves, then the mood and her words are asked for beside the fields and in a summary, and nothing is saved', async ({
    page,
    api,
  }) => {
    const reflection = new LearnReflectionPage(page);
    await reflection.open('l-towel');

    await reflection.save();

    await expect(reflection.errorSummary).toContainText('Choose how you’re feeling.');
    await expect(reflection.errorSummary).toContainText('Write your reflection.');
    await expect(reflection.fieldError('Write your reflection.')).toBeVisible();
    await reflection.expectAccessible();
    expect(api.reflectionsState.of('m-sofia', 'l-towel')).toBeNull();
  });

  test('Given the save fails, when she saves, then her words stay on the page to try again', async ({ page, api }) => {
    api.reflectionsState.failSaves = true;
    const reflection = new LearnReflectionPage(page);
    await reflection.open('l-towel');
    await reflection.write('Hopeful', WORDS);

    await reflection.save();

    await expect(reflection.failed).toBeVisible();
    await expect(reflection.words).toHaveValue(WORDS);
  });

  test('Given a lesson she has not reached, one that is not published and no guardian consent, then the page says why', async ({ page, api }) => {
    const reflection = new LearnReflectionPage(page);
    await reflection.open('l-coach');
    await expect(reflection.heading('Finish Pick Up the Towel first')).toBeVisible();
    await reflection.expectAccessible();

    await reflection.open('l-circle');
    await expect(reflection.heading('We can’t find that lesson')).toBeVisible();

    api.withdrawConsent('c-sofia');
    await reflection.open('l-strengths');
    await expect(reflection.heading('Learning isn’t open for you yet')).toBeVisible();
    await reflection.expectAccessible();
  });

  test('Given Learning is off, when the reflection is opened directly, then Today opens and the API answers 404', async ({ page, api }) => {
    api.setModules('org-harbourview', SUITE);
    const reflection = new LearnReflectionPage(page);

    await reflection.open('l-towel');

    await expect(page).toHaveURL(/\/$/);
    await expect(new TodayPage(page).heading).toHaveText('Welcome, Sofía');
    expect(await reflection.apiStatus('l-towel')).toBe(404);
  });

  test('Given a phone, when she writes a reflection, then nothing scrolls sideways and it passes axe', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    const reflection = new LearnReflectionPage(page);
    await reflection.open('l-towel');
    await reflection.write('Unsure', WORDS);

    await reflection.save();

    await expect(reflection.saved('Reflection saved')).toBeVisible();
    await reflection.expectNoHorizontalScroll();
    await reflection.expectAccessible();
  });
});
