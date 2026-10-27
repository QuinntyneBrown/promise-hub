import { test, expect } from '../../fixtures/test';
import type { ModuleId } from '../../fixtures/seed';
import { LearnCodingPage } from '../../pages/learn-coding.page';

// Acceptance test. Traces to: L2-070 criteria 4 and 6 (a coding project saved as a draft and submitted once with a note to the mentor).
const SUITE: ModuleId[] = ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports'];

test.describe('Coding projects', () => {
  test.use({ signedInAs: 'm-sofia' });

  test.beforeEach(({ api }) => {
    api.setModules('org-harbourview', [...SUITE, 'Learning']);
    api.giveConsent('c-sofia');
    api.saveOnboarding('m-sofia', { step: 3, preferredName: 'Sofía', completed: true });
    api.curriculumState.youthJourney();
    api.learningState.complete('m-sofia', 'l-webpage');
  });

  test('Given Build Your Event Page, when Sofía saves a draft, then the brief and her code are there and the draft comes back after a reload', async ({
    page,
  }) => {
    const project = new LearnCodingPage(page);
    await project.open('l-event');
    await project.expectOpen('Build Your Event Page');
    await expect(project.brief).toContainText('Come through');
    await expect(project.editor).toHaveValue('<h1>Our event</h1>');
    await project.expectAccessible();

    await project.write('<h1>Harbourview Youth Night</h1>');
    await project.saveDraft();

    await expect(project.toast('Draft saved')).toBeVisible();
    await page.reload();
    await expect(project.editor).toHaveValue('<h1>Harbourview Youth Night</h1>');
  });

  test('Given her page is ready, when she submits it with a note, then it is Submitted, read only, and waits for her mentor', async ({ page }) => {
    const project = new LearnCodingPage(page);
    await project.open('l-event');
    await project.write('<h1>Harbourview Youth Night</h1><a href="#">Come through</a>');

    await project.submitForReview();
    await expect(project.dialog).toBeVisible();
    await project.expectAccessible();
    await project.writeNote('I used my first bit of CSS for the colours.');
    await project.confirmSubmit();

    await expect(project.dialog).toHaveCount(0);
    await expect(project.submittedBadge).toBeVisible();
    await expect(project.sentForReview).toBeVisible();
    await expect(project.editor).toHaveJSProperty('readOnly', true);
    await expect(page.getByRole('button', { name: 'Submit for review' })).toHaveCount(0);
    await project.expectAccessible();
  });

  test('Given a note over 1,000 characters or no code, when she submits, then the dialog says why and nothing is sent', async ({ page }) => {
    const project = new LearnCodingPage(page);
    await project.open('l-event');

    await project.submitForReview();
    await project.writeNote('n'.repeat(1001));
    await project.confirmSubmit();
    await expect(project.dialog.getByText('Keep the note under 1,000 characters.')).toBeVisible();
    await project.expectAccessible();

    await page.keyboard.press('Escape');
    await project.write('');
    await project.submitForReview();
    await project.confirmSubmit();
    await expect(project.dialog.getByText('Write some code before you submit.')).toBeVisible();
  });

  test('Given submitting fails, when she submits, then the dialog keeps her note and says it was not sent', async ({ page, api }) => {
    api.learningState.failSubmissions = true;
    const project = new LearnCodingPage(page);
    await project.open('l-event');

    await project.submitForReview();
    await project.writeNote('Here it is.');
    await project.confirmSubmit();

    await expect(project.dialog.getByText('Your project was not sent. Try again.')).toBeVisible();
    await expect(project.dialog.getByLabel(/Note to your mentor/)).toHaveValue('Here it is.');
  });
});
