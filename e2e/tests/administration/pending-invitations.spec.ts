import { test, expect } from '../../fixtures/test';
import { StaffPage } from '../../pages/staff.page';

// Acceptance Test
// Traces to: L2-052, L2-054, L2-035, L2-036
// Description: waiting and expired invitations on Staff and roles; Resend issues a fresh link and Withdraw ends one.
test.describe('Manage pending invitations', () => {
  test.use({ signedInAs: 'm-tom' });

  test('Given Yusuf’s link expired and he asked for a new one, when Tom resends it, then it waits again for 14 days', async ({ page, api }) => {
    api.pendingInvitation({ email: 'yusuf.haddad@example.com', role: 'Youth', childName: 'Yusuf Haddad', expired: true, replacementRequested: true });
    api.pendingInvitation({ email: 'grace.adeyemi@example.org', role: 'Mentor' });
    const staff = new StaffPage(page);
    await staff.open();

    await expect(staff.invitation('yusuf.haddad@example.com')).toContainText('Youth · Yusuf Haddad');
    await expect(staff.invitation('yusuf.haddad@example.com')).toContainText('Expired');
    await expect(staff.invitation('yusuf.haddad@example.com')).toContainText('Asked for a new link');
    await expect(staff.invitation('grace.adeyemi@example.org')).not.toContainText('Expired');
    await staff.expectAccessible();
    await staff.expectNoHorizontalScroll();

    await staff.resend('yusuf.haddad@example.com');

    await expect(staff.toast).toContainText('Invitation resent');
    await expect(staff.invitation('yusuf.haddad@example.com')).not.toContainText('Expired');
    await expect(staff.invitation('yusuf.haddad@example.com')).not.toContainText('Asked for a new link');
    expect(api.resentInvitations).toEqual(['yusuf.haddad@example.com']);
  });

  test('Given Grace’s invitation waits, when Tom withdraws it, then it leaves the list', async ({ page, api }) => {
    api.pendingInvitation({ email: 'grace.adeyemi@example.org', role: 'Mentor' });
    const staff = new StaffPage(page);
    await staff.open();

    await staff.withdraw('grace.adeyemi@example.org');

    await expect(staff.invitations).toHaveCount(0);
  });
});
