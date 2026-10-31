import { test, expect } from '../../fixtures/test';
import { LearningBondAgreementPage } from '../../pages/learning-bond-agreement.page';
import { SettingsModulesPage } from '../../pages/settings-modules.page';

// L2-136 the data-handling agreement is read and accepted per organization and version; L2-135 criterion 4 the module turns on only after;
// ADR 0077 the agreement is served from Settings while Learning Bond is off, as long as Roster and Messages are on.
test.describe('Learning Bond data-handling agreement', () => {
  test.describe('Harbourview, which accepted version 2', () => {
    test.use({ signedInAs: 'm-tom' });

    // L2-136 criteria 1 and 2 (learning-bond-agreement/accepted).
    test('Given the agreement is accepted, then it reads as one page in three sections with who accepted it and when', async ({ page }) => {
      const agreement = new LearningBondAgreementPage(page);

      await agreement.open();

      await agreement.expectShown();
      await expect(agreement.version).toHaveText('Version 2 · effective Thu 1 Oct 2026 · published by PromiseHub');
      expect(await agreement.sectionTitles()).toEqual(['What we collect', 'Where it goes', 'What your organization sees']);
      await expect(agreement.accepted).toContainText('Accepted by Tom Nguyen on Thu 29 Oct 2026, version 2');
      await expect(agreement.chooseCoverage).toHaveAttribute('href', '/settings/learning-bond/coverage');
      await expect(agreement.acceptButton).toHaveCount(0);
      await agreement.expectAccessible();
      await agreement.expectNoHorizontalScroll();
    });
  });

  test.describe('Northgate, with Messages on and Learning Bond off', () => {
    test.use({ signedInAs: 'm-grace' });
    test.beforeEach(({ api }) => api.setModules('org-northgate', ['Roster', 'RollCall', 'QuickCards', 'Messages']));

    // L2-136 criteria 1 and 6 (learning-bond-agreement/default): Harbourview's acceptance never shows for Northgate.
    test('Given nothing is accepted, then Grace sees the agreement with the authority box, Accept and Ask someone else to sign', async ({ page }) => {
      const agreement = new LearningBondAgreementPage(page);

      await agreement.open();

      await agreement.expectShown();
      await expect(agreement.authority('Northgate Community Church Kids')).not.toBeChecked();
      await expect(agreement.acceptButton).toBeVisible();
      await expect(agreement.askSomeoneElse).toBeVisible();
      await expect(agreement.accepted).toHaveCount(0);
      await expect(page.getByText('Tom Nguyen')).toHaveCount(0);
      await agreement.expectAccessible();
      await agreement.expectNoHorizontalScroll();
    });

    // L2-136 criterion 3 (learning-bond-agreement/invalid).
    test('Given the authority box is not ticked, when Accept is chosen, then the reason shows beside the box and nothing is stored', async ({ page }) => {
      const agreement = new LearningBondAgreementPage(page);
      await agreement.open();

      await agreement.accept();

      await expect(agreement.authorityError).toHaveText('Confirm you have authority to accept this agreement, or ask someone else to sign.');
      await expect(agreement.errorSummary).toBeVisible();
      await expect(agreement.accepted).toHaveCount(0);
      await agreement.expectAccessible();
    });

    // L2-136 criteria 2 and 8, L2-135 criterion 4 (learning-bond-agreement/accepted-off), then Settings › Modules turns it on.
    test('Given the box is ticked, when Accept is chosen, then it is recorded and Turn on Learning Bond lets Modules turn it on', async ({ page }) => {
      const agreement = new LearningBondAgreementPage(page);
      await agreement.open();

      await agreement.authority('Northgate Community Church Kids').check();
      await agreement.accept();

      await expect(agreement.accepted).toContainText('Accepted by Grace Mensah on Thu 5 Nov 2026, version 2');
      await agreement.expectAccessible();
      await agreement.turnOn.click();
      const modules = new SettingsModulesPage(page);
      await expect(page).toHaveURL(/\/settings\/modules$/);
      await modules.set('Learning Bond', true);
      await modules.save();
      await expect(modules.toast).toContainText('Modules saved');
      await expect(modules.toggle('Learning Bond')).toBeChecked();
    });

    // L2-135 criterion 4: the refusal in Modules offers the agreement.
    test('Given Modules refuses Learning Bond for want of the agreement, then Read the agreement opens it', async ({ page }) => {
      const modules = new SettingsModulesPage(page);
      await modules.open();

      await modules.set('Learning Bond', true);
      await modules.save();
      await modules.readTheAgreement.click();

      await new LearningBondAgreementPage(page).expectShown();
    });
  });

  test.describe('Northgate, with Messages off', () => {
    test.use({ signedInAs: 'm-grace' });

    // L2-136 criterion 8: Roster and Messages are needed; the route redirects to Today and the API answers 404.
    test('Given Messages is off, when the agreement is opened, then Today opens and the API answers 404', async ({ page }) => {
      const agreement = new LearningBondAgreementPage(page);

      await agreement.open();

      await expect(page).toHaveURL(/\/$/);
      expect(await agreement.apiStatus('/learning-bond/agreement')).toBe(404);
    });
  });

  test.describe('A site lead', () => {
    test.use({ signedInAs: 'm-jaylen' });

    // L2-136 criterion 7 (learning-bond-agreement/forbidden).
    test('Given Jaylen has no ManageSettings, when the agreement is opened, then it says admins accept it', async ({ page }) => {
      const agreement = new LearningBondAgreementPage(page);

      await agreement.open();

      await expect(agreement.forbidden).toBeVisible();
      await expect(agreement.acceptButton).toHaveCount(0);
      await agreement.expectAccessible();
    });
  });
});
