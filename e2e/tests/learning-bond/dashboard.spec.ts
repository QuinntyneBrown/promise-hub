import { test, expect } from '../../fixtures/test';
import { LearningBondDashboardPage } from '../../pages/learning-bond-dashboard.page';

// L2-141 the Learning Bond dashboard for ViewReports; L2-143 Export for funders. Counts and sums, never a family's details.
test.describe('A program director reports Learning Bond outcomes', () => {
  test.use({ signedInAs: 'm-marisol' });

  // L2-141 criterion 1 (learning-bond-dashboard/empty).
  test('Given Learning Bond has just launched, when Marisol opens the dashboard, then every figure is 0', async ({ page }) => {
    const dashboard = new LearningBondDashboardPage(page);
    await dashboard.openDashboard();

    await expect(dashboard.heading).toHaveText('Learning Bond');
    await expect(dashboard.figure('Households invited')).toContainText('0');
    await expect(dashboard.empty).toBeVisible();
    await dashboard.expectAccessible();
  });

  // L2-141 criteria 2 and 3 (learning-bond-dashboard/default, suppressed).
  test('Given claims under way, when Marisol opens the dashboard, then the figures show and a small program reads Fewer than 5', async ({ page, api }) => {
    api.learningBond.figures.set('After-School Tutoring', { invited: 48, started: 22, completed: 12, children: 15, estLb: 21000, estBen: 4200, confLb: 7000, confBen: 1680 });
    api.learningBond.figures.set('Saturday Sports', { invited: 6, started: 2, completed: 1, children: 1, estLb: 1400, estBen: 0, confLb: 0, confBen: 0 });
    const dashboard = new LearningBondDashboardPage(page);
    await dashboard.openDashboard();

    await expect(dashboard.figure('Households invited')).toContainText('54');
    await expect(dashboard.figure('Estimated dollars unlocked')).toContainText('$26,600');
    await expect(dashboard.figure('Estimated dollars unlocked')).toContainText('Learning Bond $22,400 · benefits $4,200');
    await expect(dashboard.row('Saturday Sports')).toContainText('Fewer than 5');
    await expect(dashboard.row('After-School Tutoring')).toContainText('$8,680');
    await dashboard.expectAccessible();
  });

  // L2-143 criteria 1 and 2 (export-learning-bond/success).
  test('Given the dashboard, when Marisol exports for funders, then the file is ready to download', async ({ page }) => {
    const dashboard = new LearningBondDashboardPage(page);
    await dashboard.openDashboard();

    await dashboard.exportForFunders();

    await expect(dashboard.exportReady).toContainText('harbourview-youth-collective-learning-bond-all-2026-11-05.csv');
    await expect(dashboard.exportReady.getByRole('link', { name: 'Download' })).toHaveAttribute('href', /\/reports\/exports\/export-lb-1$/);
  });
});

// L2-141 criterion 4 (learning-bond-dashboard/forbidden).
test.describe('A role without ViewReports', () => {
  test.use({ signedInAs: 'm-aisha' });

  test('Given Aisha (Youth worker), when she opens the dashboard, then she is told who sees it', async ({ page }) => {
    const dashboard = new LearningBondDashboardPage(page);
    await dashboard.openDashboard();

    await expect(page.getByText('Admins and program directors see the dashboard')).toBeVisible();
  });
});
