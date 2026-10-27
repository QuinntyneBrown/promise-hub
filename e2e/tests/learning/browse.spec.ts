import { test, expect } from '../../fixtures/test';
import type { ModuleId } from '../../fixtures/seed';
import { LearnModulePage } from '../../pages/learn-module.page';
import { LearnTrackPage } from '../../pages/learn-track.page';
import { LearningPage } from '../../pages/learning.page';
import { TodayPage } from '../../pages/today.page';

// Acceptance test. Traces to: L2-068 (Learning home, tracks and modules, gating enforced on the server), L2-029 and L2-035 (phone, axe).
const SUITE: ModuleId[] = ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports'];

test.describe('Browse lessons', () => {
  test.use({ signedInAs: 'm-sofia' });

  test.beforeEach(({ api }) => {
    api.setModules('org-harbourview', [...SUITE, 'Learning']);
    api.giveConsent('c-sofia');
    api.saveOnboarding('m-sofia', {
      step: 3,
      preferredName: 'Sofía',
      completed: true,
    });
  });

  test('Given Leadership Foundations is published for her program, when Sofía opens Learning, then she sees where to start and her track', async ({ page }) => {
    const learning = new LearningPage(page);

    await learning.open();

    await learning.expectOpen();
    await expect(learning.greeting).toContainText('Hi, Sofía');
    await expect(learning.continueCard).toContainText('Your Strengths');
    await expect(learning.continueCard).toContainText('Knowing Yourself');
    await expect(learning.overall).toHaveAttribute('aria-valuenow', '0');
    await expect(learning.track('Leadership Foundations')).toContainText('0 of 2 lessons');
    await expect(learning.track('Leadership Foundations')).toContainText('After-School Tutoring');
    await learning.expectAccessible();
  });

  test('Given she finished Knowing Yourself, when she opens her track, then modules show in order with the locked one naming what unlocks it, and the button group switches tracks', async ({
    page,
    api,
  }) => {
    api.curriculumState.youthJourney();
    api.learningState.complete('m-sofia', 'l-strengths', 'l-values');
    const learning = new LearningPage(page);
    const track = new LearnTrackPage(page);
    await learning.open();

    await learning.track('Leadership Foundations').click();

    await track.expectOpen('Leadership Foundations');
    await expect(track.module('Knowing Yourself')).toContainText('Done');
    await expect(track.module('Leading by Serving')).toContainText('Not started');
    await expect(track.module('Speaking Up')).toContainText('Unlocks after Leading by Serving');
    await expect(track.moduleLink('Speaking Up')).toHaveCount(0);
    await expect(track.trackButton('Leadership Foundations')).toHaveAttribute('aria-pressed', 'true');
    await track.expectAccessible();

    await track.switchTo('Digital Skills');

    await track.expectOpen('Digital Skills');
    await expect(page).toHaveURL(/\/learning\/tracks\/t-digital$/);
    await expect(track.module('Web Basics')).toBeVisible();
    await expect(track.trackButton('Digital Skills')).toHaveAttribute('aria-pressed', 'true');
  });

  test('Given a module, when she opens it, then the first lesson she has not done is next and later ones are locked; a locked module is refused by the server', async ({
    page,
    api,
  }) => {
    api.curriculumState.youthJourney();
    api.learningState.complete('m-sofia', 'l-strengths', 'l-values');
    const module = new LearnModulePage(page);

    await module.open('cm-serving');

    await module.expectOpen('Leading by Serving');
    await expect(module.anchor).toContainText('The best leaders are the ones who carry the bags.');
    await expect(module.lessonLink('Pick Up the Towel')).toBeVisible();
    await expect(module.lesson('Last in Line')).toContainText('Unlocks after Pick Up the Towel');
    await expect(module.lessonLink('Last in Line')).toHaveCount(0);
    await module.expectAccessible();

    await module.open('cm-speaking');

    await expect(module.locked('Leading by Serving')).toBeVisible();
    expect(await module.apiStatus('cm-speaking')).toBe(403);
    await module.expectAccessible();
  });

  test('Given nothing is published for her programs, when she opens Learning, then it says no lessons yet; an unknown track is not found', async ({
    page,
    api,
  }) => {
    api.curriculumState.clear('org-harbourview');
    const learning = new LearningPage(page);
    const track = new LearnTrackPage(page);

    await learning.open();
    await expect(learning.emptyState).toBeVisible();

    await track.open('t-digital');
    await expect(track.notFound).toBeVisible();
    expect(await track.apiStatus('t-digital')).toBe(404);
    await track.expectAccessible();
  });

  test('Given Learning is off, when a track is opened directly, then Today opens and the API answers 404', async ({ page, api }) => {
    api.setModules('org-harbourview', SUITE);
    const track = new LearnTrackPage(page);

    await track.open('t-leadership');

    await expect(page).toHaveURL(/\/$/);
    await expect(new TodayPage(page).heading).toHaveText('Welcome, Sofía');
    expect(await track.apiStatus('t-leadership')).toBe(404);
  });

  test('Given a phone, when she browses Learning and her track, then nothing scrolls sideways and each screen passes axe', async ({ page, api }) => {
    api.curriculumState.youthJourney();
    await page.setViewportSize({ width: 360, height: 800 });
    const learning = new LearningPage(page);
    const track = new LearnTrackPage(page);

    await learning.open();
    await expect(learning.yourTracks).toBeVisible();
    await learning.expectNoHorizontalScroll();
    await learning.expectAccessible();

    await track.open('t-leadership');
    await track.expectOpen('Leadership Foundations');
    await track.expectNoHorizontalScroll();
    await track.expectAccessible();
  });
});
