import { test, expect } from '../../fixtures/test';
import { GuardianLearningBondPage } from '../../pages/guardian-learning-bond.page';

// L2-146 intake asks once and only for what is missing; SINs validated on the server and shown only as the last three digits (L2-159).
test.describe('A guardian completes the Learning Bond intake', () => {
  test.use({ signedInAs: null });
  test.beforeEach(({ api }) => {
    api.setHouseholdLanguage('hh-rivera', 'English');
    api.learningBond.links.set('tok-lb-rivera', { householdId: 'hh-rivera', organizationId: 'org-harbourview', language: 'en' });
    api.trustGuardianDevice('hh-rivera');
    api.learningBond.consents.push({ householdId: 'hh-rivera', childId: 'c-mateo', typedName: 'Carmen Rivera', language: 'en', wordingVersion: 1 });
  });

  // L2-146 criteria 1 to 4 and 6 (learning-bond-intake/default, invalid).
  test('Given Mateo’s consent, when Carmen gives a number that isn’t a SIN and then the right ones, then only the last three digits are kept', async ({ page, api }) => {
    const learningBond = new GuardianLearningBondPage(page);
    await learningBond.openIntake('tok-lb-rivera', 'c-mateo');

    await expect(learningBond.heading).toHaveText('Mateo’s details');
    await expect(learningBond.record).toContainText('Mateo Rivera');
    await expect(learningBond.record).toContainText('14 Mar 2017');
    await expect(page.getByText('Did your family file a 2025 tax return?')).toBeVisible();
    await learningBond.expectAccessible();

    await learningBond.sinField('Your SIN').fill('123 456 789');
    await learningBond.sinField('Mateo’s SIN').fill('345 123 459');
    await learningBond.answerTaxes('Yes');
    await learningBond.saveIntake();
    await expect(learningBond.intakeError('guardian-sin')).toHaveText('Check the number. A SIN has 9 digits, like 123 456 782.');

    await learningBond.sinField('Your SIN').fill('276 543 212');
    await learningBond.saveIntake();

    await expect(learningBond.intakeSaved).toBeVisible();
    await expect(learningBond.masked('guardian')).toContainText('••• ••• 212');
    await expect(learningBond.masked('child')).toContainText('••• ••• 459');
    expect(api.learningBond.intakes.get('hh-rivera')).toEqual({ guardianLast3: '212', taxFiled: 'Yes' });
    await learningBond.expectAccessible();
  });

  // L2-146 criterion 5 (learning-bond-intake/second-child).
  test('Given Carmen already gave her SIN and tax answer for Mateo, then Sofía’s intake asks only for Sofía’s SIN', async ({ page, api }) => {
    api.learningBond.consents.push({ householdId: 'hh-rivera', childId: 'c-sofia', typedName: 'Carmen Rivera', language: 'en', wordingVersion: 1 });
    api.learningBond.intakes.set('hh-rivera', { guardianLast3: '212', taxFiled: 'Yes' });
    const learningBond = new GuardianLearningBondPage(page);

    await learningBond.openIntake('tok-lb-rivera', 'c-sofia');

    await expect(learningBond.masked('guardian')).toContainText('••• ••• 212');
    await expect(learningBond.sinField('Your SIN')).toHaveCount(0);
    await expect(learningBond.sinField('Sofía’s SIN')).toBeVisible();
    await learningBond.expectAccessible();
  });

  // L2-146 criterion 1 (learning-bond-intake/fix-requested).
  test('Given the record is wrong, when Carmen asks to fix it, then the claim waits for staff', async ({ page, api }) => {
    const learningBond = new GuardianLearningBondPage(page);
    await learningBond.openIntake('tok-lb-rivera', 'c-mateo');

    await page.getByRole('button', { name: 'Fix this' }).click();
    await page.getByRole('dialog').getByLabel('What should we fix?').fill('His birthday is March 15.');
    await page.getByRole('dialog').getByRole('button', { name: 'Send to Harbourview Youth Collective' }).click();

    await expect(page.getByTestId('intake-fix-requested')).toContainText('We asked Harbourview Youth Collective to fix Mateo’s record.');
    expect(api.learningBond.claims.get('c-mateo')?.recordFix).toBe('His birthday is March 15.');
  });
});
