import { test, expect } from '../../fixtures/test';
import { GuardianLearningBondPage } from '../../pages/guardian-learning-bond.page';

// L2-145 per-child consent: one box per eligible child with the exact wording, the typed name and Agree; nothing about an unticked child.
test.describe('A guardian gives Learning Bond consent', () => {
  test.use({ signedInAs: null });
  test.beforeEach(({ api }) => {
    api.setHouseholdLanguage('hh-rivera', 'English');
    api.learningBond.links.set('tok-lb-rivera', { householdId: 'hh-rivera', organizationId: 'org-harbourview', language: 'en' });
    api.trustGuardianDevice('hh-rivera');
  });

  // L2-145 criteria 1 to 3 (learning-bond-consent/default, invalid, success).
  test('Given Carmen continues, when she agrees for Mateo only, then one consent is recorded and the intake comes next', async ({ page, api }) => {
    const learningBond = new GuardianLearningBondPage(page);
    await learningBond.openLink('tok-lb-rivera');
    await learningBond.continue();

    await expect(learningBond.heading).toHaveText('Your permission, for each child');
    await expect(learningBond.agent).toContainText('It’s separate from the program consent you gave Harbourview Youth Collective.');
    await expect(learningBond.consentBox('Mateo')).not.toBeChecked();
    await expect(learningBond.consentBox('Sofía')).not.toBeChecked();
    await learningBond.expectAccessible();

    await learningBond.sign('');
    await expect(learningBond.fieldError('children')).toHaveText('Tick at least one child.');
    await expect(learningBond.fieldError('typed-name')).toHaveText('Type your full name to sign.');
    expect(api.learningBond.consents).toEqual([]);

    await learningBond.consentBox('Mateo').check();
    await learningBond.sign('Carmen Rivera');

    await expect(learningBond.consentRecorded).toContainText('Consent recorded for Mateo');
    await expect(page.getByRole('link', { name: 'Continue to Mateo’s details' })).toBeVisible();
    expect(api.learningBond.consents).toEqual([{ householdId: 'hh-rivera', childId: 'c-mateo', typedName: 'Carmen Rivera', language: 'en', wordingVersion: 1 }]);
    await learningBond.expectAccessible();
  });
});
