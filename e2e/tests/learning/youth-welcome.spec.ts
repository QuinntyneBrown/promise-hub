import { test, expect } from '../../fixtures/test';
import type { ModuleId } from '../../fixtures/seed';
import { LearningPage } from '../../pages/learning.page';
import { YouthWelcomePage } from '../../pages/youth-welcome.page';

// Acceptance Test
// Traces to: L2-059 criteria 1 to 3, 5, 6, 8 and 10, L2-035
// Description: a youth goes through the three setup steps, each saved on the server, and finishes into Learning.
const SUITE: ModuleId[] = ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports'];

test.describe('Youth welcome', () => {
  test.use({ signedInAs: 'm-nadia' });

  test.beforeEach(({ api }) => {
    api.setModules('org-harbourview', [...SUITE, 'Learning']);
    api.placeInProgram('c-nadia', 'p-tutoring');
  });

  test('Given Nadia opens setup, when she confirms her name and pronouns, then step 1 is saved and the preferences step opens', async ({ page, api }) => {
    const welcome = new YouthWelcomePage(page);
    await welcome.open();
    await welcome.expectOpen('Nadia');
    await welcome.expectStep(1, 'About you');
    await expect(welcome.preferredName).toHaveValue('Nadia');
    await welcome.expectAccessible();
    await welcome.expectNoHorizontalScroll();

    await welcome.preferredName.fill('Nadi');
    await welcome.pronouns.selectOption({ label: 'She / her' });
    await welcome.continue();

    await welcome.expectStep(2, 'What should we tell you about?');
    expect(api.onboardingOf('m-nadia')).toMatchObject({
      step: 2,
      preferredName: 'Nadi',
      pronouns: 'she/her',
    });
    await expect(welcome.preference('Lesson reminders')).toBeChecked();
    await expect(welcome.preference('Mentor messages')).toBeChecked();
    await expect(welcome.preference('Announcements')).not.toBeChecked();
    await welcome.expectAccessible();
  });

  test('Given a blank name, when Nadia continues, then the error shows beside the field and in a summary and nothing is saved', async ({ page, api }) => {
    const welcome = new YouthWelcomePage(page);
    await welcome.open();
    await welcome.expectStep(1, 'About you');

    await welcome.preferredName.fill('   ');
    await welcome.continue();

    await expect(welcome.errorSummary).toBeVisible();
    await expect(welcome.fieldError).toBeVisible();
    await welcome.expectStep(1, 'About you');
    expect(api.onboardingOf('m-nadia')).toBeUndefined();
    await welcome.expectAccessible();
  });

  test('Given saving fails, when Nadia continues, then her answers are kept and she can try again', async ({ page, api }) => {
    const welcome = new YouthWelcomePage(page);
    await welcome.open();
    await welcome.preferredName.fill('Nadi');
    api.failNext('/api/learning/onboarding', 500);

    await welcome.continue();

    await expect(welcome.saveFailed).toBeVisible();
    await expect(welcome.preferredName).toHaveValue('Nadi');
    api.recover('/api/learning/onboarding');
    await welcome.continue();
    await welcome.expectStep(2, 'What should we tell you about?');
  });

  test('Given the preferences and program steps, when Nadia goes back and then finishes, then the setup is completed and Learning opens', async ({ page, api }) => {
    const welcome = new YouthWelcomePage(page);
    await welcome.open();
    await welcome.continue();
    await welcome.expectStep(2, 'What should we tell you about?');
    await welcome.preference('Announcements').check();
    await welcome.continue();

    await welcome.expectStep(3, 'Meet your program');
    await expect(welcome.program).toContainText('After-School Tutoring');
    await expect(welcome.program).toContainText('Mon–Thu, 4–6 pm');
    await welcome.expectAccessible();
    await welcome.back();
    await welcome.expectStep(2, 'What should we tell you about?');
    await expect(welcome.preference('Announcements')).toBeChecked();
    await welcome.continue();
    await welcome.finish();

    await new LearningPage(page).expectOpen();
    await expect(welcome.toast).toContainText('You’re all set');
    expect(api.onboardingOf('m-nadia')).toMatchObject({
      completed: true,
      announcements: true,
    });
  });

  test('Given Nadia is not in a program, when she reaches the program step, then the waiting note shows and she can still finish', async ({ page, api }) => {
    api.unenrollHousehold('hh-haddad');
    const welcome = new YouthWelcomePage(page);
    await welcome.open();
    await welcome.continue();
    await welcome.continue();

    await welcome.expectStep(3, 'Meet your program');
    await expect(welcome.waiting).toBeVisible();
    await welcome.expectAccessible();
    await welcome.finish();
    expect(api.onboardingOf('m-nadia')).toMatchObject({ completed: true });
  });

  test('Given Learning is off, when Nadia opens setup, then she lands on Today and the API answers 404', async ({ page, api }) => {
    api.setModules('org-harbourview', SUITE);
    const welcome = new YouthWelcomePage(page);

    await welcome.open();

    await expect(page).toHaveURL(/\/$/);
    expect(await page.evaluate(async () => (await fetch('/api/learning/onboarding')).status)).toBe(404);
  });
});

test.describe('Youth welcome for staff', () => {
  test('Given Jaylen (site lead), when the onboarding API is called, then it answers 403', async ({ page, api }) => {
    api.setModules('org-harbourview', [...SUITE, 'Learning']);
    await page.goto('/');

    expect(await page.evaluate(async () => (await fetch('/api/learning/onboarding')).status)).toBe(403);
  });
});
