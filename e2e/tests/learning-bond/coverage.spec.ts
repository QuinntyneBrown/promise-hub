import { test, expect } from '../../fixtures/test';
import { LearningBondCoveragePage } from '../../pages/learning-bond-coverage.page';
import { LearningBondPage } from '../../pages/learning-bond.page';

// L2-138 which programs Learning Bond covers and which staff roles see status, Admin and Program director fixed; L2-162 module-gated.
// Harbourview's fake: After-School Tutoring reaches 3 households, Saturday Sports 1, Winter Camp none; Summer Camp 2026 is archived.
test.describe('Learning Bond coverage', () => {
  test.describe('Tom at Harbourview', () => {
    test.use({ signedInAs: 'm-tom' });

    // L2-138 criteria 1 and 4 (learning-bond-coverage/default).
    test('Given coverage was never changed, then every program is covered and the running programs and roles are listed', async ({ page }) => {
      const coverage = new LearningBondCoveragePage(page);

      await coverage.open();

      await coverage.expectShown();
      await expect(coverage.everyProgram).toBeChecked();
      await expect(coverage.everyProgram).toHaveAccessibleName(/4 households/);
      expect(await coverage.programLabels()).toEqual(['After-School Tutoring 3 households', 'Saturday Sports 1 household', 'Winter Camp 2026 0 households']);
      await expect(coverage.role('Admin')).toBeChecked();
      await expect(coverage.role('Admin')).toBeDisabled();
      await expect(coverage.role('Program director')).toBeDisabled();
      await expect(coverage.role('Site lead')).not.toBeChecked();
      expect(await coverage.roleLabels()).not.toContain('Mentor');
      await coverage.expectAccessible();
      await coverage.expectNoHorizontalScroll();
    });

    // L2-138 criterion 2 (learning-bond-coverage/success).
    test('Given Tom chooses two programs and two more roles, when he saves, then the toast confirms and the change is audited', async ({ page, api }) => {
      const coverage = new LearningBondCoveragePage(page);
      await coverage.open();

      await coverage.chosenPrograms.check();
      await coverage.program('After-School Tutoring').check();
      await coverage.program('Saturday Sports').check();
      await coverage.role('Site lead').check();
      await coverage.role('Youth worker').check();
      await coverage.save();

      await expect(coverage.toast).toContainText('Learning Bond settings saved');
      await expect(coverage.toast).toContainText('After-School Tutoring and Saturday Sports');
      expect(api.learningBond.settingsOf('org-harbourview')).toEqual({
        coverage: 'ChosenPrograms',
        programIds: ['p-tutoring', 'p-sports'],
        statusRoles: ['Admin', 'ProgramDirector', 'SiteLead', 'YouthWorker'],
        senderName: null,
      });
      expect(api.learningBond.settingsAudit).toEqual([{ organizationId: 'org-harbourview', summary: 'Learning Bond settings changed: Coverage, Programs, StatusRoles' }]);
      await coverage.open();
      await expect(coverage.chosenPrograms).toBeChecked();
      await expect(coverage.program('Saturday Sports')).toBeChecked();
      await expect(coverage.role('Youth worker')).toBeChecked();
      await coverage.expectAccessible();
    });

    // L2-138 criterion 3 (learning-bond-coverage/invalid).
    test('Given chosen programs with none ticked, when saved, then the save is refused beside the programs and nothing changes', async ({ page, api }) => {
      const coverage = new LearningBondCoveragePage(page);
      await coverage.open();

      await coverage.chosenPrograms.check();
      await coverage.save();

      await expect(coverage.programError).toHaveText('Choose at least one program.');
      await expect(coverage.errorSummary).toBeVisible();
      expect(api.learningBond.settings.has('org-harbourview')).toBe(false);
      await coverage.expectAccessible();
    });
  });

  test.describe('Learning Bond off at Northgate', () => {
    test.use({ signedInAs: 'm-grace' });

    // L2-138 criterion 6, L2-162 criterion 3.
    test('Given Learning Bond is off, when coverage is opened, then Today opens, the library never loads and the API answers 404', async ({ page }) => {
      const coverage = new LearningBondCoveragePage(page);
      const library = new LearningBondPage(page).recordLibraryLoads();

      await coverage.open();

      await expect(page).toHaveURL(/\/$/);
      expect(library.loaded).toBe(false);
      expect(await coverage.apiStatus('/learning-bond/settings')).toBe(404);
    });
  });

  test.describe('A site lead', () => {
    test.use({ signedInAs: 'm-jaylen' });

    // L2-138 criterion 6 (learning-bond-coverage/forbidden).
    test('Given Jaylen has no ManageSettings, when coverage is opened, then it says admins set coverage', async ({ page }) => {
      const coverage = new LearningBondCoveragePage(page);

      await coverage.open();

      await expect(coverage.forbidden).toBeVisible();
      await coverage.expectAccessible();
    });
  });
});
