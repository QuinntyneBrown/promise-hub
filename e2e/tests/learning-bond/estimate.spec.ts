import { test, expect } from '../../fixtures/test';
import { GuardianLearningBondPage } from '../../pages/guardian-learning-bond.page';

// L2-147 the estimate is one number from the rule, with where it comes from; with no tax return filed it says so and stops.
test.describe('A guardian sees the Learning Bond estimate', () => {
  test.use({ signedInAs: null });
  test.beforeEach(({ api }) => {
    api.setHouseholdLanguage('hh-rivera', 'English');
    api.learningBond.links.set('tok-lb-rivera', { householdId: 'hh-rivera', organizationId: 'org-harbourview', language: 'en' });
    api.trustGuardianDevice('hh-rivera');
    api.learningBond.consents.push({ householdId: 'hh-rivera', childId: 'c-mateo', typedName: 'Carmen Rivera', language: 'en', wordingVersion: 1 });
    api.learningBond.claims.set('c-mateo', { childLast3: '459', recordFix: null });
  });

  // L2-147 criterion 1 (learning-bond-estimate/default).
  test('Given Mateo’s intake is complete, then the page shows one number and where it comes from', async ({ page, api }) => {
    api.learningBond.intakes.set('hh-rivera', { guardianLast3: '212', taxFiled: 'Yes' });
    const learningBond = new GuardianLearningBondPage(page);

    await learningBond.openEstimate('tok-lb-rivera', 'c-mateo');

    await expect(learningBond.heading).toHaveText('Mateo may be owed up to $1,400.');
    await expect(learningBond.estimateNote).toHaveText('Based on the years since Mateo was born. The Government of Canada confirms the amount from your tax returns.');
    await expect(page.getByRole('link', { name: 'Review Mateo’s application' })).toBeVisible();
    await learningBond.expectAccessible();
    await learningBond.expectNoHorizontalScroll();
  });

  // L2-147 criterion 4 (learning-bond-estimate/needs-tax-return).
  test('Given the family didn’t file last year’s taxes, then the estimate says to file first and offers no application', async ({ page, api }) => {
    api.learningBond.intakes.set('hh-rivera', { guardianLast3: '212', taxFiled: 'No' });
    const learningBond = new GuardianLearningBondPage(page);

    await learningBond.openEstimate('tok-lb-rivera', 'c-mateo');

    await expect(page.getByTestId('estimate-tax-return')).toContainText('You’ll need to file to receive it');
    await expect(page.getByRole('link', { name: 'Review Mateo’s application' })).toHaveCount(0);
    await learningBond.expectAccessible();
  });
});
