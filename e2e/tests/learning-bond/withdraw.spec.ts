import { test, expect } from '../../fixtures/test';
import { GuardianLearningBondPage } from '../../pages/guardian-learning-bond.page';

// L2-152: from Your consents a guardian withdraws Learning Bond consent for a child, after a dialog says what stops and what stays.
test.describe('A guardian withdraws Learning Bond consent', () => {
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

  // L2-152 criteria 1 and 2 (guardian-learning-bond/in-progress, withdraw-learning-bond-consent/default, success).
  test('Given Mateo’s consent, when Carmen withdraws it, then the dialog says what stays with Northfield and Mateo’s information here is deleted', async ({ page, api }) => {
    const learningBond = new GuardianLearningBondPage(page);
    await learningBond.openLink('tok-lb-rivera');

    await expect(learningBond.consents).toContainText('Signed Carmen Rivera');
    await learningBond.withdraw('Mateo');
    const dialog = page.getByRole('dialog', { name: 'Withdraw consent for Mateo?' });
    await expect(dialog).toContainText('We’ll stop and delete Mateo’s information here. Anything already sent to Northfield Credit Union stays with them; contact them to close the RESP.');
    await learningBond.expectAccessible();
    await dialog.getByRole('button', { name: 'Withdraw consent' }).click();

    await expect(learningBond.withdrawn).toContainText('Consent for Mateo withdrawn');
    await expect(learningBond.consents).toHaveCount(0);
    expect(api.learningBond.consents).toEqual([]);
    expect(api.learningBond.intakes.has('hh-rivera')).toBe(false);
  });

  // L2-152 criterion 1: Cancel changes nothing.
  test('Given the dialog, when Carmen cancels, then the consent stays', async ({ page, api }) => {
    const learningBond = new GuardianLearningBondPage(page);
    await learningBond.openLink('tok-lb-rivera');

    await learningBond.withdraw('Mateo');
    await page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click();

    await expect(learningBond.consents).toContainText('Mateo');
    expect(api.learningBond.consents).toHaveLength(1);
  });
});
