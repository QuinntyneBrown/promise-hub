import { test, expect } from '../../fixtures/test';
import { GuardianLearningBondPage } from '../../pages/guardian-learning-bond.page';

// L2-144 the invitation opens the guardian's Learning Bond page: the code first on a new device, then each covered child with the amount, the
// agent's fixed explanation in the household's language, Not now and I'm not interested.
test.describe('A guardian opens the Learning Bond link', () => {
  test.use({ signedInAs: null });

  // L2-144 criteria 1 to 3 (guardian-learning-bond/verify, es).
  test('Given Carmen opens the link on a new phone, then the code comes first and then the page in Spanish names Mateo and Sofía with what each may be owed', async ({ page }) => {
    const learningBond = new GuardianLearningBondPage(page);
    await learningBond.openLink('tok-lb-rivera');

    await learningBond.expectCodeStep();
    await expect(page.getByText('Mateo')).toHaveCount(0);
    await learningBond.expectAccessible();
    await learningBond.verify('905-555-0142', '482913');

    await expect(learningBond.heading).toHaveText('Mateo y Sofía podrían tener derecho a dinero para estudiar después de la secundaria');
    await expect(learningBond.agent).toContainText('no a Harbourview Youth Collective.');
    await expect(learningBond.child('Mateo')).toContainText('Hasta $1,400');
    await expect(learningBond.child('Sofía')).toContainText('Hasta $1,700');
    await learningBond.expectAccessible();
    await learningBond.expectNoHorizontalScroll();
  });

  // L2-144 criterion 4 (guardian-learning-bond/not-now, not-interested).
  test('Given a verified device in English, when Carmen chooses Not now and then I’m not interested, then each is confirmed', async ({ page, api }) => {
    api.setHouseholdLanguage('hh-rivera', 'English');
    api.learningBond.links.set('tok-lb-rivera', { householdId: 'hh-rivera', organizationId: 'org-harbourview', language: 'en' });
    api.trustGuardianDevice('hh-rivera');
    const learningBond = new GuardianLearningBondPage(page);
    await learningBond.openLink('tok-lb-rivera');
    await expect(learningBond.heading).toHaveText('Mateo and Sofía may be owed money for school after high school');

    await learningBond.choose('Not now');
    await expect(learningBond.confirmation).toContainText('Your link keeps working');
    await learningBond.expectAccessible();

    await learningBond.choose('I’m not interested');
    await expect(learningBond.confirmation).toContainText('We won’t text you about the Learning Bond again.');
    expect(api.learningBond.declined.has('hh-rivera')).toBe(true);
  });

  // L2-144 criterion 6 (guardian-learning-bond/older-child).
  test('Given the Haddad household, then Nadia, 18, is named with the rule for claiming herself and Yusuf has an amount', async ({ page, api }) => {
    api.trustGuardianDevice('hh-haddad');
    const learningBond = new GuardianLearningBondPage(page);

    await learningBond.openLink('tok-lb-haddad');

    await expect(learningBond.child('Yusuf')).toContainText('Jusqu’à 1 800 $');
    await expect(learningBond.child('Nadia')).toContainText('Nadia peut demander le Bon d’études jusqu’à ses 21 ans.');
    await learningBond.expectAccessible();
  });
});
