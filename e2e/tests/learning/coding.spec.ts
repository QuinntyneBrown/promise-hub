import { test, expect } from '../../fixtures/test';
import type { ModuleId } from '../../fixtures/seed';
import { LearnCodingPage } from '../../pages/learn-coding.page';

// Acceptance test. Traces to: L2-070 criteria 1 to 3, 5 and 6 (coding lessons: steps, sandboxed preview, saved progress, completion by checklist), L2-068 criterion 3.
const SUITE: ModuleId[] = ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports'];

test.describe('Coding lessons', () => {
  test.use({ signedInAs: 'm-sofia' });

  test.beforeEach(({ api }) => {
    api.setModules('org-harbourview', [...SUITE, 'Learning']);
    api.giveConsent('c-sofia');
    api.saveOnboarding('m-sofia', { step: 3, preferredName: 'Sofía', completed: true });
    api.curriculumState.youthJourney();
  });

  test('Given Your First Webpage, when Sofía opens it and runs her code, then she sees the steps with their samples and her page in the preview', async ({
    page,
  }) => {
    const coding = new LearnCodingPage(page);

    await coding.open('l-webpage');

    await coding.expectOpen('Your First Webpage');
    await expect(coding.step('Every page has a skeleton')).toBeVisible();
    await expect(coding.sample('Every page has a skeleton')).toContainText('<h1>Hello!</h1>');
    await expect(coding.editor).toHaveValue('<h1>Change me</h1>\n<p>Write your own line here.</p>');
    await coding.expectAccessible();

    await coding.write('<h1>Harbourview Youth Night</h1><p>Fridays at 7.</p>');
    await coding.run();

    await expect(coding.preview.getByRole('heading', { name: 'Harbourview Youth Night' })).toBeVisible();
    await coding.expectAccessible();
  });

  test('Given her code includes a script, when she runs it, then the page shows but the script never runs', async ({ page }) => {
    const coding = new LearnCodingPage(page);
    await coding.open('l-webpage');

    await coding.write('<h1>Still here</h1><p id="out">not run</p><script>document.getElementById("out").textContent = "ran";</script>');
    await coding.run();

    await expect(coding.preview.getByRole('heading', { name: 'Still here' })).toBeVisible();
    await expect(coding.preview.locator('#out')).toHaveText('not run');
  });

  test('Given her code styles the page, when she runs it, then the preview shows her styles', async ({ page }) => {
    const coding = new LearnCodingPage(page);
    await coding.open('l-webpage');

    await coding.write('<style>h1 { color: rgb(200, 30, 60); }</style><h1>Bold and bright</h1>');
    await coding.run();

    await expect(coding.preview.getByRole('heading', { name: 'Bold and bright' })).toHaveCSS('color', 'rgb(200, 30, 60)');
  });

  test('Given two items ticked, when she saves, then her code and ticks come back after a reload and the lesson stays in progress', async ({ page }) => {
    const coding = new LearnCodingPage(page);
    await coding.open('l-webpage');
    await coding.write('<h1>Harbourview Youth Night</h1>');
    await coding.tick('I know what an HTML tag is');
    await coding.tick('I added a heading and a paragraph');

    await coding.saveProgress();

    await expect(coding.toast('Progress saved')).toBeVisible();
    await page.reload();
    await expect(coding.editor).toHaveValue('<h1>Harbourview Youth Night</h1>');
    await expect(coding.item('I added a heading and a paragraph')).toBeChecked();
    await expect(coding.item('I edited the page and ran it')).not.toBeChecked();
    await expect(coding.completeAlert).toHaveCount(0);
  });

  test('Given every item ticked, when she saves, then the lesson is complete and the project unlocks', async ({ page }) => {
    const coding = new LearnCodingPage(page);
    await coding.open('l-webpage');
    for (const item of ['I know what an HTML tag is', 'I added a heading and a paragraph', 'I edited the page and ran it']) await coding.tick(item);

    await coding.saveProgress();

    await expect(coding.completeAlert).toContainText('Build Your Event Page is unlocked');
    await coding.expectAccessible();
    await coding.completeAlert.getByRole('link', { name: 'Next: Build Your Event Page' }).click();
    await coding.expectOpen('Build Your Event Page');
  });

  test('Given saving fails, when she saves, then her code stays and she is told to try again', async ({ page, api }) => {
    api.learningState.failSaves = true;
    const coding = new LearnCodingPage(page);
    await coding.open('l-webpage');
    await coding.write('<h1>Keep me</h1>');

    await coding.saveProgress();

    await expect(coding.failed).toBeVisible();
    await expect(coding.editor).toHaveValue('<h1>Keep me</h1>');
  });

  test('Given the project before the coding lesson is done, when she opens it, then it is locked and the server refuses it', async ({ page }) => {
    const coding = new LearnCodingPage(page);

    await coding.open('l-event');

    await expect(coding.locked('Your First Webpage')).toBeVisible();
    expect(await coding.apiStatus('l-event')).toBe(403);
  });

  test('Given a phone, when she opens a coding lesson, then nothing scrolls sideways', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    const coding = new LearnCodingPage(page);

    await coding.open('l-webpage');

    await coding.expectOpen('Your First Webpage');
    await coding.expectNoHorizontalScroll();
    await coding.expectAccessible();
  });
});
