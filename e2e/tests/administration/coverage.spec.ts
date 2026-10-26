import { test, expect } from '../../fixtures/test';
import { CoveragePage } from '../../pages/coverage.page';

// L2-009 criterion 8 and L2-007 roles: a coordinator sees coverage, fills gaps and invites youth workers.
test.describe('Coordinate staff coverage as a volunteer coordinator', () => {
  test.use({ signedInAs: 'm-priya-hyc' });

  test('Given the field trip has no one, when Priya assigns Aisha, then the gap closes', async ({ page }) => {
    const coverage = new CoveragePage(page);
    await coverage.open();
    await expect(coverage.session('Fall field trip')).toContainText('Gap');
    await coverage.expectAccessible();
    await coverage.expectNoHorizontalScroll();

    await coverage.assign('Fall field trip: Royal Botanical Gardens', ['Aisha Bello']);

    await expect(coverage.session('Fall field trip')).toContainText('Aisha Bello');
    await expect(coverage.session('Fall field trip')).not.toContainText('Gap');
  });

  test('Given Priya invites a volunteer, when the dialog opens, then only the youth worker role is offered and the invitation is sent', async ({ page }) => {
    const coverage = new CoveragePage(page);
    await coverage.open();

    await coverage.openInvite();
    await expect(coverage.roleChoices()).toHaveCount(1);
    await coverage.expectAccessible();
    await coverage.inviteVolunteer('sam@harbourview.example');

    await expect(page.getByRole('status').filter({ hasText: 'Invitation sent' })).toBeVisible();
  });
});

test.describe('Coverage for youth workers', () => {
  test.use({ signedInAs: 'm-aisha' });

  test('Given a youth worker, when they open coverage, then only coordinators, site leads and directors assign staff', async ({ page }) => {
    const coverage = new CoveragePage(page);

    await coverage.open();

    await expect(coverage.heading).toHaveText('Only coordinators, site leads and directors assign staff');
  });
});
