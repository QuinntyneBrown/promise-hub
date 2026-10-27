import { test, expect } from '../../fixtures/test';
import type { ModuleId } from '../../fixtures/seed';
import { CurriculumBadgePage } from '../../pages/curriculum-badge.page';
import { LearnLessonPage } from '../../pages/learn-lesson.page';
import { NotificationsPage } from '../../pages/notifications.page';

// Acceptance test. Traces to: L2-085 criteria 1 to 3 (automatic badges awarded once on learning events, with a notification), L2-084.
const SUITE: ModuleId[] = ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports'];

test.describe('Badges earned automatically', () => {
  test.use({ signedInAs: 'm-sofia' });

  test.beforeEach(({ api }) => {
    api.setModules('org-harbourview', [...SUITE, 'Learning']);
    api.giveConsent('c-sofia');
    api.saveOnboarding('m-sofia', { step: 3, preferredName: 'Sofía', completed: true });
    api.badges.add({ id: 'b-knowing', name: 'Knows Themselves', icon: 'book', kind: 'Automatic', rule: 'ModuleCompleted', targetId: 'cm-knowing' });
    api.learningState.complete('m-sofia', 'l-strengths');
  });

  test('Given Knows Themselves for finishing Knowing Yourself, when Sofía completes its last lesson, then she earns it once and is told', async ({ page, api }) => {
    const lesson = new LearnLessonPage(page);
    const notifications = new NotificationsPage(page);
    await lesson.open('l-values');

    await lesson.markComplete();

    await expect(lesson.completeAlert).toContainText('Knowing Yourself is complete');
    await notifications.open();
    await expect(notifications.list).toContainText('You earned the Knows Themselves badge.');
    expect(api.badges.holders('b-knowing')).toEqual(['m-sofia']);
  });

  test('Given a deleted badge for the same module, when Sofía completes it, then nothing is awarded', async ({ page, api }) => {
    api.badges.find('b-knowing')!.deleted = true;
    const lesson = new LearnLessonPage(page);
    await lesson.open('l-values');

    await lesson.markComplete();

    await expect(lesson.completeAlert).toContainText('Knowing Yourself is complete');
    expect(api.badges.holders('b-knowing')).toEqual([]);
  });
});

test.describe('An automatic award as the program director sees it', () => {
  test.use({ signedInAs: 'm-marisol' });

  test('Given Sofía earned Servant Heart automatically, when Marisol opens it, then Earned by says Automatically and offers no Award badge', async ({ page }) => {
    const badges = new CurriculumBadgePage(page);

    await badges.openBadge('b-servant');

    await badges.expectOpen('Servant Heart');
    await expect(badges.earnedBy).toContainText('Sofía Rivera');
    await expect(badges.earnedBy).toContainText('Automatically · Thu 5 Nov');
    await expect(badges.awardButton).toHaveCount(0);
    await badges.expectAccessible();
  });
});
