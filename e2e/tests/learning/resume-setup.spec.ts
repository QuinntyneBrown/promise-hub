import { test, expect } from '../../fixtures/test';
import type { ModuleId } from '../../fixtures/seed';
import { LearningPage } from '../../pages/learning.page';
import { YouthWelcomePage } from '../../pages/youth-welcome.page';

// Acceptance Test
// Traces to: L2-059 criteria 1, 4, 5 and 10
// Description: setup opens on a youth's first visit to Learning; leaving keeps what was saved and Learning offers to resume there.
const SUITE: ModuleId[] = ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports'];

test.describe('Resume setup', () => {
  test.use({ signedInAs: 'm-nadia' });

  test.beforeEach(({ api }) => {
    api.setModules('org-harbourview', [...SUITE, 'Learning']);
    api.placeInProgram('c-nadia', 'p-tutoring');
  });

  test('Given Nadia never opened setup, when she opens Learning, then setup opens at step 1', async ({ page }) => {
    await new LearningPage(page).open();

    const welcome = new YouthWelcomePage(page);
    await expect(page).toHaveURL(/\/learning\/welcome$/);
    await welcome.expectStep(1, 'About you');
  });

  test('Given Nadia chose Finish later on step 2, when she opens Learning again, then it offers to pick up at step 2 with her answers', async ({ page, api }) => {
    const welcome = new YouthWelcomePage(page);
    await welcome.open();
    await welcome.preferredName.fill('Nadi');
    await welcome.continue();
    await welcome.expectStep(2, 'What should we tell you about?');
    await welcome.preference('Announcements').check();

    await welcome.finishLater();

    const learning = new LearningPage(page);
    await learning.expectOpen();
    await expect(learning.resume).toContainText('You stopped at step 2 of 3');
    expect(api.onboardingOf('m-nadia')).toMatchObject({ step: 2, preferredName: 'Nadi', announcements: true });
    await learning.expectAccessible();
    await learning.expectNoHorizontalScroll();

    await learning.pickUpSetup();

    await welcome.expectStep(2, 'What should we tell you about?');
    await welcome.expectOpen('Nadi');
    await expect(welcome.preference('Announcements')).toBeChecked();
  });

  test('Given Nadia finished setup, when she opens Learning, then it neither opens setup nor offers to resume', async ({ page, api }) => {
    api.saveOnboarding('m-nadia', { step: 3, preferredName: 'Nadi', completed: true });
    const learning = new LearningPage(page);

    await learning.open();

    await learning.expectOpen();
    await expect(learning.emptyState).toBeVisible();
    await expect(learning.resume).toHaveCount(0);
    await expect(page).toHaveURL(/\/learning$/);
  });
});
