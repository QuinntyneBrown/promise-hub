import { test, expect } from '../../fixtures/test';
import { LearningBondPage } from '../../pages/learning-bond.page';
import { LearningBondUnavailablePage } from '../../pages/learning-bond-unavailable.page';
import { SettingsModulesPage } from '../../pages/settings-modules.page';

// L2-135 Learning Bond needs Roster and Messages and the agreement, L2-162 module-gated end to end, L2-005 modules that are off are unreachable.
test.describe('Learning Bond module gate', () => {
  test.describe('Harbourview, with Learning Bond on and the agreement accepted', () => {
    test.use({ signedInAs: 'm-tom' });

    // L2-135 criterion 1.
    test('Given Settings › Modules, then Learning Bond is listed last and on', async ({ page }) => {
      const modules = new SettingsModulesPage(page);

      await modules.open();

      expect((await modules.moduleNames()).at(-1)).toBe('Learning Bond');
      await expect(modules.description('Learning Bond')).toHaveText(
        'Claims every dollar the government already owes your child, from birth to university.',
      );
      await expect(modules.toggle('Learning Bond')).toBeChecked();
      await expect(modules.summary).toHaveText('11 of 12 modules on');
    });

    // L2-135 criterion 3.
    test('Given Learning Bond is on, when Messages is turned off and saved, then the save is refused beside Learning Bond', async ({ page }) => {
      const modules = new SettingsModulesPage(page);
      await modules.open();

      await modules.set('Messages', false);
      await modules.save();

      await expect(modules.error('Learning Bond')).toHaveText('Learning Bond needs Messages.');
      await expect(modules.toast).toBeHidden();
      await modules.scrollToTop();
      await modules.expectAccessible();
    });

    // L2-162 criterion 3: while the module is on, its route loads the library and stays put.
    test('Given Learning Bond is on, when /learning-bond is opened, then the library loads and the route is not redirected', async ({ page }) => {
      const learningBond = new LearningBondPage(page);
      const library = learningBond.recordLibraryLoads();

      await learningBond.openStaff();

      await expect.poll(() => library.loaded).toBe(true);
      await expect(page).toHaveURL(/\/learning-bond$/);
    });

    // L2-135 criterion 5: turning it off hides it; turning it back on needs no new acceptance.
    test('Given Learning Bond is on, when it is turned off and saved, then its API answers 404, and turned back on it answers again', async ({ page }) => {
      const modules = new SettingsModulesPage(page);
      await modules.open();
      expect(await modules.apiStatus('/learning-bond')).toBe(200);

      await modules.set('Learning Bond', false);
      await modules.save();
      await expect(modules.toast).toContainText('Modules saved');
      expect(await modules.apiStatus('/learning-bond')).toBe(404);

      await modules.set('Learning Bond', true);
      await modules.save();
      await expect(modules.toast.last()).toContainText('11 on');
      expect(await modules.apiStatus('/learning-bond')).toBe(200);
    });
  });

  test.describe('Northgate, with Learning Bond off and no agreement accepted', () => {
    test.use({ signedInAs: 'm-grace' });

    // L2-135 criterion 1.
    test('Given Settings › Modules, then Learning Bond is off and says it needs Roster and Messages', async ({ page }) => {
      const modules = new SettingsModulesPage(page);

      await modules.open();

      await expect(modules.toggle('Learning Bond')).not.toBeChecked();
      await expect(modules.needs('Learning Bond')).toHaveText('Needs Roster and Messages');
      await modules.expectAccessible();
      await modules.expectNoHorizontalScroll();
    });

    // L2-135 criterion 2 (settings-modules/learning-bond-needs-messages).
    test('Given Messages is off, when Learning Bond is turned on and saved, then the save is refused naming Messages', async ({ page }) => {
      const modules = new SettingsModulesPage(page);
      await modules.open();

      await modules.set('Learning Bond', true);
      await modules.save();

      await expect(modules.error('Learning Bond')).toHaveText('Learning Bond needs Messages.');
      await expect(modules.toast).toBeHidden();
    });

    // L2-135 criterion 4 (settings-modules/learning-bond-agreement).
    test('Given the agreement is not accepted, when Learning Bond and Messages are turned on and saved, then the save is refused until it is accepted', async ({ page }) => {
      const modules = new SettingsModulesPage(page);
      await modules.open();

      await modules.set('Messages', true);
      await modules.set('Learning Bond', true);
      await modules.save();

      await expect(modules.error('Learning Bond')).toHaveText('Accept the Learning Bond data-handling agreement first.');
      await expect(modules.toast).toBeHidden();
      await modules.scrollToTop();
      await modules.expectAccessible();
    });

    // L2-162 criteria 3 and 7: the route redirects to Today, the library is never downloaded and the API answers 404.
    test('Given Learning Bond is off, when /learning-bond is opened directly, then Today opens, the library is never downloaded and the API answers 404', async ({ page }) => {
      const learningBond = new LearningBondPage(page);
      const library = learningBond.recordLibraryLoads();

      await learningBond.openStaff();

      await expect(page).toHaveURL(/\/$/);
      await expect(learningBond.heading).toHaveText('Welcome, Grace');
      expect(library.loaded).toBe(false);
      expect(await learningBond.apiStatus('/learning-bond')).toBe(404);
    });
  });

  test.describe('A guardian opening a Learning Bond link', () => {
    test.use({ signedInAs: null });

    // L2-162 criterion 6 (guardian-learning-bond/unavailable).
    for (const [why, token] of [
      ['the organization has Learning Bond off', 'tok-lb-northgate'],
      ['the link is unknown', 'tok-lb-unknown'],
    ]) {
      test(`Given ${why}, then the page says Learning Bond isn’t available, names no organization and never loads the library`, async ({ page }) => {
        const unavailable = new LearningBondUnavailablePage(page);
        const library = unavailable.recordLibraryLoads();

        await unavailable.openLink(token);

        await unavailable.expectShown();
        await expect(unavailable.explanation).toHaveText(
          'The organization that sent this link isn’t offering Learning Bond right now. Nothing about your family was collected.',
        );
        await expect(page.getByText('Northgate')).toHaveCount(0);
        expect(library.loaded).toBe(false);
        await unavailable.expectAccessible();
        await unavailable.expectNoHorizontalScroll();
      });
    }

    // L2-162 criterion 6: the link of an organization with the module on loads the library; its pages arrive with prompt 86.
    test('Given Harbourview has Learning Bond on, then its link loads the library and is not the unavailable page', async ({ page }) => {
      const link = new LearningBondUnavailablePage(page);
      const library = link.recordLibraryLoads();

      await link.openLink('tok-lb-rivera');

      await expect.poll(() => library.loaded).toBe(true);
      await expect(link.explanation).toHaveCount(0);
      expect(await link.apiStatus('/g/learning-bond/tok-lb-rivera')).toBe(200);
    });
  });
});
