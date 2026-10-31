import { test, expect } from '../../fixtures/test';
import { GuardianLearningBondPage } from '../../pages/guardian-learning-bond.page';

// L2-151: a claim that can't go on pauses with plain help and the right link, offers reminders, and resumes from the link where it stopped.
test.describe('A guardian pauses and picks up a Learning Bond claim', () => {
  test.use({ signedInAs: null });
  test.beforeEach(({ api }) => {
    api.setHouseholdLanguage('hh-rivera', 'English');
    api.learningBond.links.set('tok-lb-rivera', { householdId: 'hh-rivera', organizationId: 'org-harbourview', language: 'en' });
    api.trustGuardianDevice('hh-rivera');
    api.learningBond.consents.push({ householdId: 'hh-rivera', childId: 'c-mateo', typedName: 'Carmen Rivera', language: 'en', wordingVersion: 1 });
    api.learningBond.intakes.set('hh-rivera', { guardianLast3: '212', taxFiled: 'Yes' });
  });

  // L2-151 criteria 1 and 3 (learning-bond-paused/default, reminder-set).
  test('Given Mateo has no SIN yet, when Carmen says so, then the claim pauses with how to get one and she can ask for reminders', async ({ page }) => {
    const learningBond = new GuardianLearningBondPage(page);
    await learningBond.openIntake('tok-lb-rivera', 'c-mateo');

    await page.getByRole('button', { name: 'Mateo doesn’t have a SIN yet' }).click();

    await expect(learningBond.heading).toHaveText('Mateo’s claim is paused');
    await expect(learningBond.pausedBadge).toHaveText('Paused · needs a SIN');
    await expect(page.getByRole('link', { name: 'Apply on canada.ca' })).toHaveAttribute('href', 'https://www.canada.ca/en/employment-social-development/services/sin/apply.html');
    await learningBond.expectAccessible();
    await learningBond.remind('Yes, text me');
    await expect(learningBond.reminderSaved).toContainText('We’ll text you Thu 19 Nov and Sat 5 Dec');
  });

  // L2-151 criterion 2 (learning-bond-paused/needs-tax-return).
  test('Given no tax return, when Carmen opens what to do, then she finds a free clinic', async ({ page, api }) => {
    api.learningBond.intakes.set('hh-rivera', { guardianLast3: '212', taxFiled: 'No' });
    api.learningBond.claims.set('c-mateo', { childLast3: '459', recordFix: null });
    const learningBond = new GuardianLearningBondPage(page);
    await learningBond.openEstimate('tok-lb-rivera', 'c-mateo');

    await page.getByRole('link', { name: 'What to do now' }).click();

    await expect(learningBond.pausedBadge).toHaveText('Paused · needs a tax return');
    await expect(page.getByRole('link', { name: 'Find a free clinic' })).toBeVisible();
  });

  // L2-151 criterion 4 (learning-bond-paused/resumed).
  test('Given Mateo’s claim is paused, when Carmen reopens her link, then she picks it up at Mateo’s details with her answers kept', async ({ page, api }) => {
    api.learningBond.claims.set('c-mateo', { childLast3: null, recordFix: null, paused: 'NeedsSin' });
    const learningBond = new GuardianLearningBondPage(page);
    await learningBond.openLink('tok-lb-rivera');

    await learningBond.child('Mateo').getByRole('link', { name: 'Pick up where you left off' }).click();
    await page.getByRole('link', { name: 'Continue with Mateo’s details' }).click();

    await expect(learningBond.heading).toHaveText('Mateo’s details');
    await expect(learningBond.masked('guardian')).toContainText('212');
  });
});
