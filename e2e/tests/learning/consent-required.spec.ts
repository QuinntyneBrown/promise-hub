import { test, expect } from '../../fixtures/test';
import type { ModuleId } from '../../fixtures/seed';
import { LearningPage } from '../../pages/learning.page';

// Acceptance Test
// Traces to: L2-056 criteria 2 to 5 and 8, L2-057 criterion 1, L2-005
// Description: a youth under the consent age is held on consent-required until a guardian consents, and can ask a guardian.
const SUITE: ModuleId[] = ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports'];

test.describe('Consent required', () => {
  test.use({ signedInAs: 'm-sofia' });

  test.beforeEach(({ api }) => api.setModules('org-harbourview', [...SUITE, 'Learning']));

  test('Given Sofía (12) has no consent, when she opens Learning, then she is asked to involve a guardian and her lessons are refused', async ({ page }) => {
    const learning = new LearningPage(page);

    await learning.open();

    await learning.expectOpen();
    await expect(learning.consentRequired).toBeVisible();
    await expect(learning.emptyState).toHaveCount(0);
    expect(await learning.lessonsStatus()).toBe(403);
    await learning.expectAccessible();
    await learning.expectNoHorizontalScroll();
  });

  test('Given the gate, when Sofía asks her guardian, then it names where the link went', async ({ page, api }) => {
    const learning = new LearningPage(page);
    await learning.open();

    await learning.askGuardian();

    await expect(learning.asked).toBeVisible();
    await expect(learning.gate).toContainText('•••-•••-0142');
    expect(api.consentLinksSent.has('c-sofia')).toBe(true);
    await learning.expectAccessible();
  });

  test('Given Sofía asked and Carmen then consented, when Sofía checks again, then her lessons open', async ({ page, api }) => {
    const learning = new LearningPage(page);
    await learning.open();
    await learning.askGuardian();
    await expect(learning.asked).toBeVisible();

    api.giveConsent('c-sofia');
    await learning.checkAgain();

    await expect(learning.emptyState).toBeVisible();
    expect(await learning.lessonsStatus()).toBe(200);
  });

  test('Given Carmen consented and then withdrew, when Sofía opens Learning, then she is held on consent-required again', async ({ page, api }) => {
    api.giveConsent('c-sofia');
    api.withdrawConsent('c-sofia');
    const learning = new LearningPage(page);

    await learning.open();

    await expect(learning.consentRequired).toBeVisible();
    expect(await learning.lessonsStatus()).toBe(403);
  });

  test('Given no guardian of Sofía can be reached, when she asks, then she is told to ask program staff', async ({ page, api }) => {
    api.makeUnreachable('hh-rivera');
    const learning = new LearningPage(page);
    await learning.open();

    await learning.askGuardian();

    await expect(learning.noGuardian).toBeVisible();
    await learning.expectAccessible();
  });

  test('Given Learning is off, when the youth endpoints are called, then they answer 404', async ({ page, api }) => {
    const learning = new LearningPage(page);
    await learning.open();
    api.setModules('org-harbourview', SUITE);

    expect(await learning.lessonsStatus()).toBe(404);
  });
});

test.describe('An adult youth', () => {
  test.use({ signedInAs: 'm-nadia' });

  test('Given Nadia is 18, placed and set up, when she opens Learning, then no consent is asked for', async ({ page, api }) => {
    api.setModules('org-harbourview', [...SUITE, 'Learning']);
    api.placeInProgram('c-nadia', 'p-tutoring');
    api.saveOnboarding('m-nadia', { step: 3, preferredName: 'Nadia', completed: true });
    const learning = new LearningPage(page);

    await learning.open();

    await expect(learning.emptyState).toBeVisible();
    await expect(learning.consentRequired).toHaveCount(0);
  });
});
