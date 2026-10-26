import { test, expect } from '../../fixtures/test';
import { StaffPage } from '../../pages/staff.page';

// L2-007 roles, L2-009 invitations, L2-032 audit, L2-035/L2-036 accessibility and phone layout.
test.describe('Manage staff access as an admin', () => {
  test.use({ signedInAs: 'm-tom' });

  test('Given the staff list, when Tom invites Sam as a youth worker, then the invitation waits and can be withdrawn', async ({ page }) => {
    const staff = new StaffPage(page);
    await staff.open();
    await expect(staff.member('Jaylen Okafor')).toContainText('Site lead');
    await staff.expectAccessible();
    await staff.expectNoHorizontalScroll();

    await staff.invite('jaylen@harbourview.example', 'Youth worker');
    await expect(staff.dialog).toContainText('Jaylen Okafor already has access.');
    await staff.expectAccessible();
    await staff.dialog.getByLabel('Work email').fill('sam@harbourview.example');
    await staff.dialog.getByRole('button', { name: 'Send invitation' }).click();

    await expect(staff.invitations).toContainText('sam@harbourview.example');
    await staff.withdraw('sam@harbourview.example');
    await expect(staff.invitations).toHaveCount(0);
  });

  test('Given Jaylen and Aisha, when Tom makes Jaylen a program director and removes Aisha, then the list follows and Tom cannot change himself', async ({ page }) => {
    const staff = new StaffPage(page);
    await staff.open();

    await staff.changeRole('Jaylen Okafor', 'Program director');
    await expect(staff.member('Jaylen Okafor')).toContainText('Program director');
    await staff.remove('Aisha Bello');

    await expect(staff.member('Aisha Bello')).toHaveCount(0);
    await expect(staff.actions('Tom Nguyen')).toHaveCount(0);
  });
});

test.describe('Staff access for other roles', () => {
  test.use({ signedInAs: 'm-marisol' });

  test('Given a program director, when they open staff, then only admins manage staff', async ({ page }) => {
    const staff = new StaffPage(page);

    await staff.open();

    await expect(staff.heading).toHaveText('Only admins manage staff');
    await staff.expectAccessible();
  });
});
