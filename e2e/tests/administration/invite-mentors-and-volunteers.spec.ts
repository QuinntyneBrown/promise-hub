import { test, expect } from '../../fixtures/test';
import { StaffPage } from '../../pages/staff.page';

// Acceptance Test
// Traces to: L2-051, L2-035, L2-036
// Description: an admin invites a mentor while Mentoring is on, or a volunteer, from Staff and roles.
test.describe('Invite mentors and volunteers', () => {
  test.use({ signedInAs: 'm-tom' });

  test('Given Mentoring is on, when Tom invites Grace as a mentor and Ravi as a volunteer, then both invitations wait', async ({ page }) => {
    const staff = new StaffPage(page);
    await staff.open();

    await staff.invite('grace.adeyemi@example.org', 'Mentor');
    await expect(staff.dialog).toBeHidden();
    await staff.invite('ravi.patel@example.org', 'Volunteer');
    await expect(staff.dialog).toBeHidden();

    await expect(staff.invitation('grace.adeyemi@example.org')).toContainText('Mentor');
    await expect(staff.invitation('ravi.patel@example.org')).toContainText('Volunteer');
    await staff.expectAccessible();
  });

  test('Given Mentoring is off, when Tom opens Invite staff, then Mentor is not offered but Volunteer is', async ({ page, api }) => {
    api.setModules('org-harbourview', ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports', 'Learning']);
    const staff = new StaffPage(page);
    await staff.open();

    await staff.openInvite();

    await expect(staff.roleOption('Volunteer')).toBeVisible();
    await expect(staff.roleOption('Mentor')).toHaveCount(0);
    await staff.expectAccessible();
  });
});
