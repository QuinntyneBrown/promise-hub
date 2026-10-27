import { test, expect } from '../../fixtures/test';
import type { ModuleId } from '../../fixtures/seed';
import { LearningPage } from '../../pages/learning.page';

// Acceptance Test
// Traces to: L2-060 criteria 1 to 3, 6 and 7
// Description: a youth in no program sees a friendly waiting state; lessons stay locked on the server until staff place them.
const SUITE: ModuleId[] = ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports'];

test.describe('Not in a program yet', () => {
  test.use({ signedInAs: 'm-nadia' });

  test.beforeEach(({ api }) => {
    api.setModules('org-harbourview', [...SUITE, 'Learning']);
    api.saveOnboarding('m-nadia', { step: 3, preferredName: 'Nadia', completed: true });
  });

  test('Given Nadia is in no program, when she opens Learning, then she sees the waiting state and her lessons are refused', async ({ page }) => {
    const learning = new LearningPage(page);

    await learning.open();

    await learning.expectOpen();
    await expect(learning.noCohort).toBeVisible();
    await expect(learning.yourTracks).toHaveCount(0);
    expect(await learning.lessonsStatus()).toBe(403);
    await learning.expectAccessible();
    await learning.expectNoHorizontalScroll();
  });

  test('Given staff then enroll Nadia, when she checks again, then her lessons open', async ({ page, api }) => {
    const learning = new LearningPage(page);
    await learning.open();
    await expect(learning.noCohort).toBeVisible();

    api.placeInProgram('c-nadia', 'p-tutoring');
    await learning.checkAgain();

    await expect(learning.yourTracks).toBeVisible();
    expect(await learning.lessonsStatus()).toBe(200);
  });

  test('Given Nadia is only in an archived program, when she opens Learning, then she is still waiting', async ({ page, api }) => {
    api.placeInProgram('c-nadia', 'p-summer');
    const learning = new LearningPage(page);

    await learning.open();

    await expect(learning.noCohort).toBeVisible();
  });

  test('Given Learning is off, when the lessons are asked for, then the API answers 404', async ({ page, api }) => {
    const learning = new LearningPage(page);
    await learning.open();
    api.setModules('org-harbourview', SUITE);

    expect(await learning.lessonsStatus()).toBe(404);
  });
});

test.describe('Not in a program and without consent', () => {
  test.use({ signedInAs: 'm-sofia' });

  test('Given Sofía (12) without consent is taken off her program, when she opens Learning, then consent is asked for first', async ({ page, api }) => {
    api.setModules('org-harbourview', [...SUITE, 'Learning']);
    api.unenrollHousehold('hh-rivera');
    const learning = new LearningPage(page);

    await learning.open();

    await expect(learning.consentRequired).toBeVisible();
    await expect(learning.noCohort).toHaveCount(0);
  });
});
