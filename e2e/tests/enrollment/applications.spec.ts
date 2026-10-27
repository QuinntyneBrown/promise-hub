import { test, expect } from '../../fixtures/test';
import { ApplicationsPage } from '../../pages/applications.page';
import { ShellPage } from '../../pages/shell.page';
import { TodayPage } from '../../pages/today.page';

// Acceptance Test
// Traces to: L2-072 (reviewing and placing applicants) criteria 1, 8 and 10; L2-013, L2-005 Roster off, L2-035/L2-036 accessibility and phone layout.
test.describe('The application pipeline', () => {
  test.use({ signedInAs: 'm-tom' });

  test('Given a referral, a young person’s application and a guardian’s, when Tom opens Applications, then they wait newest first with who applied and the counts', async ({ page, api }) => {
    api.requestEnrollment('p-tutoring', 'c-kevin', '2026-11-02T15:00:00Z');
    api.malikApplies('p-tutoring');
    api.referZoe('p-tutoring');
    const applications = new ApplicationsPage(page);

    await applications.open();

    await expect(applications.heading).toHaveText('Applications');
    await expect(applications.tab('Waiting review')).toContainText('3');
    await expect(applications.rows).toHaveCount(3);
    await expect(applications.rows.nth(0)).toContainText('Zoe Campbell');
    await expect(applications.row('Zoe Campbell')).toContainText('referred by Rachel Ellis, Guidance counsellor');
    await expect(applications.row('Zoe Campbell')).toContainText('Referral');
    await expect(applications.row('Malik Johnson')).toContainText('applied for themselves');
    await expect(applications.row('Malik Johnson')).toContainText('Consent needed');
    await expect(applications.row('Kevin Tran')).toContainText('Linh Tran');
    await expect(applications.row('Kevin Tran')).toContainText('After-School Tutoring');
    await applications.expectAccessible();
    await applications.expectNoHorizontalScroll();
  });

  test('Given waitlisted and declined applications, when Tom filters by status, then each tab lists its own with who decided', async ({ page, api }) => {
    api.decideEnrollment('p-tutoring', 'c-kevin', 'Waitlisted');
    api.decideEnrollment('p-tutoring', 'c-emily', 'Declined', 'Tutoring is full this term.');
    const applications = new ApplicationsPage(page);
    await applications.open();

    await applications.show('Waitlisted');
    await expect(applications.rows).toHaveCount(1);
    await expect(applications.row('Kevin Tran')).toContainText('#1');

    await applications.show('Declined');
    await expect(applications.row('Emily Tran')).toContainText('Tutoring is full this term.');
    await applications.expectAccessible();
  });

  test('Given nothing waiting review, when Tom opens Applications, then he is all caught up', async ({ page }) => {
    const applications = new ApplicationsPage(page);

    await applications.open();

    await expect(applications.emptyState).toBeVisible();
    await applications.expectAccessible();
  });

  test('Given enrollments to review, when Tom follows Today’s count or the More menu, then Applications opens', async ({ page, api }) => {
    api.referZoe('p-tutoring');
    const today = new TodayPage(page);
    await today.open();

    await page.getByRole('link', { name: /1 enrollment to review/ }).click();
    await expect(page).toHaveURL(/\/applications$/);

    const shell = new ShellPage(page);
    await shell.openMenu();
    expect(await shell.menuLabels()).toContain('Applications');
  });
});

test.describe('The pipeline for other roles and modules', () => {
  test('Given a site lead, when Applications is opened, then it says who reviews applications and More does not offer it', async ({ page }) => {
    const applications = new ApplicationsPage(page);

    await applications.open();

    await expect(applications.heading).toHaveText('Only admins and program directors review applications');
    await applications.expectAccessible();
    const shell = new ShellPage(page);
    await shell.openMenu();
    expect(await shell.menuLabels()).not.toContain('Applications');
  });

  test('Given the Roster module is off, when Applications is opened, then Today opens', async ({ page, api }) => {
    api.setModules('org-harbourview', []);

    await page.goto('/applications');

    await expect(page).toHaveURL(/\/$/);
    await expect(new TodayPage(page).heading).toBeVisible();
  });
});
