import { test, expect } from '../../fixtures/test';
import { LearningBondAgreementPage } from '../../pages/learning-bond-agreement.page';
import { SettingsLearningBondPage } from '../../pages/settings-learning-bond.page';

// L2-136 criteria 4 and 9 Settings › Learning Bond and a new agreement version; L2-138, L2-139 its coverage and invitation cards;
// L2-162 module-gated: the hub and its Settings tab exist only while Learning Bond is on.
test.describe('Settings › Learning Bond', () => {
  test.describe('Tom at Harbourview', () => {
    test.use({ signedInAs: 'm-tom' });

    // L2-136 criterion 9 (settings-learning-bond/default).
    test('Given the agreement is accepted, then the hub shows the acceptance, coverage, invitation and launch, each linking to its page', async ({ page }) => {
      const hub = new SettingsLearningBondPage(page);

      await hub.open();

      await hub.expectShown();
      await expect(hub.tabs.getByRole('link', { name: 'Learning Bond' })).toHaveAttribute('aria-current', 'page');
      await expect(hub.card('Data-handling agreement')).toContainText('Accepted by Tom Nguyen on Thu 29 Oct 2026, version 2.');
      await expect(hub.fact('Coverage', 'Programs')).toHaveText('Every program · 4 households');
      await expect(hub.fact('Coverage', 'Who sees each family’s status')).toHaveText('Admin, Program director');
      await expect(hub.fact('Guardian invitation', 'Sender name')).toHaveText('Harbourview Youth Collective');
      await expect(hub.fact('Guardian invitation', 'Languages')).toHaveText('English, Spanish and French, the languages your households use');
      await expect(hub.newVersionBanner).toHaveCount(0);
      await expect(hub.link('Read the agreement')).toHaveAttribute('href', '/settings/learning-bond/agreement');
      await expect(hub.link('Change coverage')).toHaveAttribute('href', '/settings/learning-bond/coverage');
      await expect(hub.link('Preview and edit')).toHaveAttribute('href', '/settings/learning-bond/invitation');
      await hub.expectAccessible();
      await hub.expectNoHorizontalScroll();
    });

    // L2-136 criterion 4 (settings-learning-bond/new-version): the module stays on, Launch is disabled until the new version is accepted.
    test('Given the platform publishes version 3, then Launch is disabled until Tom accepts it, and accepting clears the warning', async ({ page, api }) => {
      api.learningBond.publishVersion(3, '2026-11-01');
      const hub = new SettingsLearningBondPage(page);

      await hub.open();

      await expect(hub.newVersionBanner).toContainText('A new version of the agreement needs accepting.');
      await expect(hub.card('Data-handling agreement')).toContainText('Version 3 took effect Sun 1 Nov 2026.');
      await expect(hub.launchButton).toBeDisabled();
      await expect(hub.card('Launch')).toContainText('A new version of the agreement needs accepting.');
      await hub.expectAccessible();

      await hub.link('Read and accept version 3').click();
      const agreement = new LearningBondAgreementPage(page);
      await expect(agreement.version).toContainText('Version 3');
      await agreement.authority('Harbourview Youth Collective').check();
      await agreement.accept();
      await expect(agreement.accepted).toContainText('Accepted by Tom Nguyen on Thu 5 Nov 2026, version 3');
      await agreement.backToLearningBond.click();
      await expect(hub.newVersionBanner).toHaveCount(0);
      await expect(hub.card('Data-handling agreement')).toContainText('version 3.');
    });
  });

  test.describe('Grace at Northgate, with Learning Bond off', () => {
    test.use({ signedInAs: 'm-grace' });

    // L2-162 criterion 3, L2-005: no Settings tab, and the route redirects to Today.
    test('Given Learning Bond is off, then Settings has no Learning Bond tab and the hub redirects to Today with the API answering 404', async ({ page }) => {
      const hub = new SettingsLearningBondPage(page);

      await page.goto('/settings/organization');
      await expect(hub.tabs.getByRole('link', { name: 'Organization' })).toBeVisible();
      await expect(hub.tabs.getByRole('link', { name: 'Learning Bond' })).toHaveCount(0);

      await hub.open();
      await expect(page).toHaveURL(/\/$/);
      expect(await hub.apiStatus('/learning-bond/overview')).toBe(404);
    });
  });

  test.describe('A site lead', () => {
    test.use({ signedInAs: 'm-jaylen' });

    // settings-learning-bond/forbidden.
    test('Given Jaylen has no ManageSettings, when the hub is opened, then it says admins configure Learning Bond', async ({ page }) => {
      const hub = new SettingsLearningBondPage(page);

      await hub.open();

      await expect(hub.forbidden).toBeVisible();
      await hub.expectAccessible();
    });
  });
});
