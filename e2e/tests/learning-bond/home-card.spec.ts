import { test, expect } from '../../fixtures/test';
import { GuardianHomePage } from '../../pages/guardian-home.page';
import { GuardianLearningBondPage } from '../../pages/guardian-learning-bond.page';

// L2-144 criterion 7, L2-162: the guardian home's Learning Bond card, once invited, with where each child stands; nothing before.
test.describe('The Learning Bond card on the guardian home', () => {
  test.use({ signedInAs: null });
  test.beforeEach(({ api }) => {
    api.setHouseholdLanguage('hh-rivera', 'English');
    api.trustGuardianDevice('hh-rivera');
  });

  test('Given Carmen was invited and consented for Mateo, when she opens her home, then the card says where each child stands and opens the Learning Bond', async ({ page, api }) => {
    api.learningBond.invitations.push({ organizationId: 'org-harbourview', householdId: 'hh-rivera', sentAt: '2026-11-05T15:00:00Z' });
    api.learningBond.consents.push({ householdId: 'hh-rivera', childId: 'c-mateo', typedName: 'Carmen Rivera', language: 'en', wordingVersion: 1 });
    const home = new GuardianHomePage(page);
    await home.open('tok-home-rivera');

    await expect(home.learningBond).toContainText('Mateo’s claim is started. Sofía may be owed money for school after high school.');
    await home.expectAccessible();
    await home.openLearningBond();

    await expect(new GuardianLearningBondPage(page).heading).toBeVisible();
    await expect(page).toHaveURL(/\/g\/learning-bond\/tok-home-rivera$/);
  });

  test('Given Carmen was never invited, when she opens her home, then nothing mentions the Learning Bond', async ({ page }) => {
    const home = new GuardianHomePage(page);
    await home.open('tok-home-rivera');

    await expect(home.heading).toBeVisible();
    await expect(home.learningBond).toHaveCount(0);
    await expect(page.getByRole('main')).not.toContainText('Learning Bond');
  });
});
