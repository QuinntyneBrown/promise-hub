import { test, expect } from '../../fixtures/test';
import { CurriculumModulePage } from '../../pages/curriculum-module.page';
import { CurriculumPage } from '../../pages/curriculum.page';

// Acceptance test. Traces to: L2-066 criterion 7 (the cohorts that follow a track) and criterion 10 for its dialog; L2-012.
test.describe('Linking a track to cohorts', () => {
  test.use({ signedInAs: 'm-marisol' });

  test('Given Leadership Foundations, when Marisol opens Curriculum, then the track names the cohorts that follow it', async ({ page }) => {
    const curriculum = new CurriculumPage(page);

    await curriculum.openLoaded();

    await expect(curriculum.trackCohorts('Leadership Foundations')).toHaveText('Followed by After-School Tutoring and Saturday Sports');
    await expect(curriculum.trackCohorts('Digital Skills')).toHaveText('Followed by no cohort yet');
  });

  test('Given the cohorts dialog, when Marisol moves Saturday Sports and Winter Camp to Digital Skills, then both tracks update', async ({ page }) => {
    const curriculum = new CurriculumPage(page);
    await curriculum.openLoaded();

    await curriculum.openCohorts('Digital Skills');
    await expect(curriculum.cohortChoice('Saturday Sports')).not.toBeChecked();
    await expect(curriculum.dialog).toContainText('Follows Leadership Foundations');
    await curriculum.expectAccessible();
    await curriculum.cohortChoice('Saturday Sports').check();
    await curriculum.cohortChoice('Winter Camp 2026').check();
    await curriculum.submitDialog('Save cohorts');

    await expect(curriculum.dialog).toBeHidden();
    await expect(curriculum.toast).toContainText('Cohorts saved');
    await expect(curriculum.trackCohorts('Digital Skills')).toHaveText('Followed by Saturday Sports and Winter Camp 2026');
    await expect(curriculum.trackCohorts('Leadership Foundations')).toHaveText('Followed by After-School Tutoring');
  });

  test('Given the save fails, when Marisol saves cohorts, then the dialog keeps her choice and says so', async ({ page, api }) => {
    const curriculum = new CurriculumPage(page);
    await curriculum.openLoaded();
    api.failNext('/api/curriculum/tracks/t-digital/cohorts', 500);

    await curriculum.openCohorts('Digital Skills');
    await curriculum.cohortChoice('Winter Camp 2026').check();
    await curriculum.submitDialog('Save cohorts');

    await expect(curriculum.dialog.getByRole('alert')).toContainText('The cohorts were not changed. Try again.');
    await expect(curriculum.cohortChoice('Winter Camp 2026')).toBeChecked();
  });

  test('Given Leading by Serving, when Marisol opens it, then Visibility names the cohorts that will see it', async ({ page }) => {
    const module = new CurriculumModulePage(page);

    await module.open('cm-serving');
    await module.expectOpen('Leading by Serving');

    await expect(module.visibility).toContainText('After-School Tutoring, Saturday Sports');
  });
});
