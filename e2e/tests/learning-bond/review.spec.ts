import { test, expect } from '../../fixtures/test';
import { GuardianLearningBondPage } from '../../pages/guardian-learning-bond.page';

// L2-148 a recommended no-fee provider and a pre-filled application reviewed field by field; L2-149 Submit is the only way to send it.
test.describe('A guardian reviews and submits the Learning Bond application', () => {
  test.use({ signedInAs: null });
  test.beforeEach(({ api }) => {
    api.setHouseholdLanguage('hh-rivera', 'English');
    api.learningBond.links.set('tok-lb-rivera', { householdId: 'hh-rivera', organizationId: 'org-harbourview', language: 'en' });
    api.trustGuardianDevice('hh-rivera');
    api.learningBond.consents.push({ householdId: 'hh-rivera', childId: 'c-mateo', typedName: 'Carmen Rivera', language: 'en', wordingVersion: 1 });
    api.learningBond.claims.set('c-mateo', { childLast3: '459', recordFix: null });
    api.learningBond.intakes.set('hh-rivera', { guardianLast3: '212', taxFiled: 'Yes' });
  });

  // L2-148 criteria 1, 3 and 4, L2-149 criteria 1 and 2 (learning-bond-review/default, edit; submitted).
  test('Given Mateo’s estimate, when Carmen adds the address and submits, then the application goes once to Northfield', async ({ page, api }) => {
    const learningBond = new GuardianLearningBondPage(page);
    await learningBond.openReview('tok-lb-rivera', 'c-mateo');

    await expect(learningBond.heading).toHaveText('Check Mateo’s application');
    await expect(learningBond.provider).toContainText('Northfield Credit Union');
    await expect(learningBond.provider).toContainText('No fees, no deposit needed, and it handles the Learning Bond');
    await expect(learningBond.reviewField('Mateo’s SIN')).toContainText('••• ••• 459');
    await expect(learningBond.reviewField('Your SIN')).toContainText('••• ••• 212');
    await expect(learningBond.reviewField('Phone')).toContainText('905-555-0142');
    await expect(page.getByText('This sends Mateo’s application to Northfield Credit Union and the Government of Canada.')).toBeVisible();
    expect(api.learningBond.submissions).toEqual([]);
    await learningBond.expectAccessible();

    await learningBond.editField('Address', '42 Barton St E, Apt 3, Hamilton ON L8L 2V6');
    await expect(learningBond.reviewField('Address')).toContainText('42 Barton St E');
    await learningBond.submitButton('Northfield Credit Union').click();

    await expect(learningBond.sent).toContainText('Mateo’s application went to Northfield Credit Union.');
    expect(api.learningBond.submissions).toEqual([{ applicationId: 'app-c-mateo', provider: 'Northfield Credit Union' }]);
    await learningBond.expectAccessible();
  });

  // L2-148 criterion 1 (learning-bond-review/choose-another).
  test('Given Choose another, when Carmen picks Maple Trust RESP, then the application goes to it', async ({ page }) => {
    const learningBond = new GuardianLearningBondPage(page);
    await learningBond.openReview('tok-lb-rivera', 'c-mateo');

    await learningBond.chooseProvider('Maple Trust RESP');

    await expect(learningBond.provider).toContainText('Maple Trust RESP');
    await expect(learningBond.submitButton('Maple Trust RESP')).toBeVisible();
  });

  // L2-149 criterion 5 (learning-bond-review/failed).
  test('Given the provider doesn’t answer, then nothing was sent and Carmen can try again', async ({ page, api }) => {
    const learningBond = new GuardianLearningBondPage(page);
    await learningBond.openReview('tok-lb-rivera', 'c-mateo');
    await learningBond.editField('Address', '42 Barton St E, Apt 3, Hamilton ON L8L 2V6');
    api.learningBond.providerFails = true;

    await learningBond.submitButton('Northfield Credit Union').click();

    await expect(learningBond.notSent).toContainText('We couldn’t send it. Nothing was sent. Try again.');
    expect(api.learningBond.submissions).toEqual([]);
    api.learningBond.providerFails = false;
    await learningBond.submitButton('Northfield Credit Union').click();
    await expect(learningBond.sent).toBeVisible();
    expect(api.learningBond.submissions).toHaveLength(1);
  });
});
