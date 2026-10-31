import { test, expect } from '../../fixtures/test';
import { GuardianBenefitsPage } from '../../pages/guardian-benefits.page';
import { GuardianLearningBondPage } from '../../pages/guardian-learning-bond.page';

// L2-153 to L2-156: the benefits check with its own consent, three questions, one state per benefit, and one application at a time.
test.describe('A guardian checks child benefits', () => {
  test.use({ signedInAs: null });
  test.beforeEach(({ api }) => {
    api.setHouseholdLanguage('hh-rivera', 'English');
    api.learningBond.links.set('tok-lb-rivera', { householdId: 'hh-rivera', organizationId: 'org-harbourview', language: 'en' });
    api.trustGuardianDevice('hh-rivera');
    api.learningBond.consents.push({ householdId: 'hh-rivera', childId: 'c-mateo', typedName: 'Carmen Rivera', language: 'en', wordingVersion: 1 });
    api.learningBond.claims.set('c-mateo', { childLast3: '459', recordFix: null });
    api.learningBond.intakes.set('hh-rivera', { guardianLast3: '212', taxFiled: 'Yes' });
    api.learningBond.applications.set('app-c-mateo', {
      childId: 'c-mateo',
      householdId: 'hh-rivera',
      province: 'ON',
      provider: 'Northfield Credit Union',
      phone: '905-555-0142',
      email: 'carmen.rivera@example.com',
      address: '42 Barton St E, Apt 3, Hamilton ON L8L 2V6',
      reviewVersion: 2,
      status: 'Submitted',
    });
  });

  // L2-153 criteria 1 and 2, L2-154 criterion 1, L2-155 criterion 1, L2-156 criterion 1.
  test('Given the confirmation, when Carmen checks benefits, then after her consent and three questions each benefit shows one state', async ({ page, api }) => {
    const learningBond = new GuardianLearningBondPage(page);
    const benefits = new GuardianBenefitsPage(page);
    await learningBond.openSubmitted('tok-lb-rivera', 'c-mateo');

    await expect(benefits.offer).toContainText('I can also check whether your family gets every child benefit it qualifies for. It takes about 3 questions.');
    await benefits.checkBenefits();
    await benefits.agree('Carmen Rivera');
    await expect(benefits.heading).toHaveText('Three questions');
    await benefits.answer('3', 'Single', 'Yes', 'No');

    await expect(benefits.heading).toHaveText('Your family’s benefits');
    await expect(benefits.benefit('Ontario Child Benefit')).toContainText('Apply now');
    await expect(benefits.benefit('Ontario Child Benefit')).toContainText('About $1,680 a year');
    await expect(benefits.benefit('Hamilton Recreation Assistance')).toContainText('Need a document');
    await expect(benefits.benefit('Child Disability Benefit')).toContainText('Neither Mateo nor Sofía has an approved Disability Tax Credit certificate.');
    await expect(benefits.alreadyGet).toContainText('Canada Child Benefit');
    expect(api.learningBond.benefitsConsented.has('hh-rivera')).toBe(true);
    await benefits.expectAccessible();
  });

  // L2-153 criterion 1: Not now is remembered on the confirmation; the offer stays on the guardian page.
  test('Given the offer, when Carmen chooses Not now, then it goes from the confirmation and stays on her Learning Bond page', async ({ page }) => {
    const learningBond = new GuardianLearningBondPage(page);
    const benefits = new GuardianBenefitsPage(page);
    await learningBond.openSubmitted('tok-lb-rivera', 'c-mateo');

    await benefits.notNow();

    await expect(benefits.offer).toHaveCount(0);
    await learningBond.openLink('tok-lb-rivera');
    await expect(benefits.offer).toBeVisible();
  });

  // L2-154 criterion 2 (learning-bond-benefits-intake/invalid).
  test('Given a household size out of range, when Carmen checks, then the field says so', async ({ page, api }) => {
    api.learningBond.benefitsConsented.add('hh-rivera');
    const benefits = new GuardianBenefitsPage(page);
    await benefits.open('/g/learning-bond/tok-lb-rivera/benefits/intake');

    await benefits.answer('22', 'Single', 'Yes', 'No');

    await expect(benefits.fieldError('Enter how many people live with you, from 1 to 15.')).toBeVisible();
    expect(api.learningBond.benefitsAnswers.has('hh-rivera')).toBe(false);
  });

  // L2-156 criteria 2 and 3 (learning-bond-benefit-review/default, submitted).
  test('Given Apply now, when Carmen adds her address and submits, then only the Ontario Child Benefit is sent', async ({ page, api }) => {
    api.learningBond.benefitsConsented.add('hh-rivera');
    api.learningBond.benefitsAnswers.set('hh-rivera', { householdSize: 3, maritalStatus: 'Single', ccbNow: 'Yes', incomeChanged: 'No' });
    const benefits = new GuardianBenefitsPage(page);
    await benefits.open('/g/learning-bond/tok-lb-rivera/benefits');

    await benefits.benefit('Ontario Child Benefit').getByRole('link', { name: 'Apply now' }).click();
    await expect(benefits.heading).toHaveText('Check your Ontario Child Benefit application');
    expect(api.learningBond.benefitSubmissions).toEqual([]);
    await benefits.editAddress('42 Barton St E, Apt 3, Hamilton ON L8L 2V6');
    await page.getByRole('button', { name: 'Submit to Ontario Child Benefit' }).click();

    await expect(benefits.sent).toContainText('Sent to the Ontario Child Benefit');
    expect(api.learningBond.benefitSubmissions).toEqual(['ontario-child-benefit']);
    await benefits.expectAccessible();
  });

  // L2-156 criteria 2 and 5 (learning-bond-benefits/document-uploaded, learning-bond-benefit-review/pdf-form).
  test('Given Hamilton needs proof of address, when Carmen uploads it, then the filled form is hers to send and she marks it sent', async ({ page, api }) => {
    api.learningBond.benefitsConsented.add('hh-rivera');
    api.learningBond.benefitsAnswers.set('hh-rivera', { householdSize: 3, maritalStatus: 'Single', ccbNow: 'Yes', incomeChanged: 'No' });
    const benefits = new GuardianBenefitsPage(page);
    await benefits.open('/g/learning-bond/tok-lb-rivera/benefits');

    await benefits.uploadFor('Hamilton Recreation Assistance', 'hydro-bill-oct.pdf', 'application/pdf');
    await expect(benefits.benefit('Hamilton Recreation Assistance')).toContainText('Apply now');
    await benefits.benefit('Hamilton Recreation Assistance').getByRole('link', { name: 'Apply now' }).click();

    await expect(page.getByRole('link', { name: 'Download the filled form (PDF)' })).toHaveAttribute('href', /\/benefits\/applications\/benefit-hamilton-recreation-assistance\/form$/);
    await page.getByRole('button', { name: 'Mark as sent' }).click();
    await expect(benefits.sent).toContainText('Marked as sent');
    expect(api.learningBond.benefitSubmissions).toEqual([]);
  });
});
