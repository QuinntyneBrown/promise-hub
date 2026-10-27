import { test, expect } from '../../fixtures/test';
import type { ModuleId } from '../../fixtures/seed';
import { LearnBadgesPage } from '../../pages/learn-badges.page';
import { LearnJourneyPage } from '../../pages/learn-journey.page';
import { TodayPage } from '../../pages/today.page';

// Acceptance test. Traces to: L2-087 criteria 1 and 4 to 9 (badges earned with when and who, badges still to unlock with what earns them and
// how far, milestones and next up, the journey's badge strip agreeing, empty, none, failed states and Learning off), L2-035 and L2-036.
const SUITE: ModuleId[] = ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports'];

test.describe('View badges', () => {
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
    api.curriculumState.assessments.quizJourney();
    api.badges.add({
      id: 'b-voice',
      name: 'Finds Their Voice',
      icon: 'flag',
      kind: 'Automatic',
      rule: 'ModuleCompleted',
      targetId: 'cm-speaking',
    });
  });

  test('Given four badges earned, when Sofía opens Badges from her journey, then she sees them in order with when and who, the ones still to unlock with how far, and Next up', async ({
    page,
  }) => {
    const journey = new LearnJourneyPage(page);
    const badges = new LearnBadgesPage(page);
    await journey.open();
    await expect(journey.stat('Badges')).toHaveText('4 of 7');
    await expect(journey.badgeStrip.getByRole('listitem')).toHaveCount(7);

    await journey.seeAllBadges();

    await badges.expectOpen();
    await expect(badges.subtitle).toHaveText('You’ve earned 4 of 7 badges. Keep going, Sofía.');
    await expect(badges.collection).toHaveAttribute('aria-valuenow', '4');
    await expect(badges.earnedNames).toHaveText(['First Steps', 'Speaks Up', 'Served Someone', 'Servant Heart']);
    await expect(badges.earned('Speaks Up')).toContainText('from Marisol Delgado');
    await expect(badges.locked('Finds Their Voice')).toContainText('0 of 1 lessons');
    await expect(badges.locked('Quiz Champion')).toContainText('Passed the Leading by Serving quiz.');
    await expect(badges.locked('Encourager')).toContainText('Lifted someone up in the group.');
    await expect(badges.milestone('Joined After-School Tutoring')).toBeVisible();
    await expect(badges.milestone('Next up: Finds Their Voice')).toBeVisible();
    await badges.expectAccessible();
  });

  test('Given she has earned none, when she opens Badges, then it says no badges yet with Start a lesson and lists every badge to unlock', async ({
    page,
    api,
  }) => {
    api.badges.awards = api.badges.awards.filter((a) => a.membershipId !== 'm-sofia');
    const badges = new LearnBadgesPage(page);

    await badges.open();

    await expect(badges.noneEarned).toBeVisible();
    await expect(page.getByRole('link', { name: 'Start a lesson' })).toBeVisible();
    await expect(badges.locked('First Steps')).toBeVisible();
    await badges.expectAccessible();
  });

  test('Given her organization has no badges, when she opens Badges, then it says there are none to earn yet', async ({ page, api }) => {
    api.badges.clear('org-harbourview');
    const badges = new LearnBadgesPage(page);

    await badges.open();

    await expect(badges.noneToEarn).toBeVisible();
    await badges.expectAccessible();
  });

  test('Given Badges fails to load, then the error state offers Try again', async ({ page, api }) => {
    api.failNext('/api/learning/badges', 500);
    const badges = new LearnBadgesPage(page);

    await badges.open();

    await expect(badges.failed).toBeVisible();
    await badges.expectAccessible();
  });

  test('Given Learning is off, when Badges is opened directly, then Today opens and the API answers 404', async ({ page, api }) => {
    api.setModules('org-harbourview', SUITE);
    const badges = new LearnBadgesPage(page);

    await badges.open();

    await expect(page).toHaveURL(/\/$/);
    await expect(new TodayPage(page).heading).toHaveText('Welcome, Sofía');
    expect(await badges.apiStatus()).toBe(404);
  });

  test('Given a phone, when she opens Badges, then nothing scrolls sideways and it passes axe', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    const badges = new LearnBadgesPage(page);

    await badges.open();

    await expect(badges.earned('First Steps')).toBeVisible();
    await badges.expectNoHorizontalScroll();
    await badges.expectAccessible();
  });
});
