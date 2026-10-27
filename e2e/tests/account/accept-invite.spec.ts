import { test, expect } from '../../fixtures/test';
import { AcceptInvitePage } from '../../pages/accept-invite.page';

// L2-009 criteria 1 to 3 and 7: an invited worker accepts, saves a phone and reaches today's session.
test.describe('Start an invited shift as a youth worker', () => {
  test.use({ signedInAs: null });

  test('Given an invitation, when Aisha accepts, saves her phone and finishes, then she can open tonight’s check-in', async ({ page, api }) => {
    api.sentInvitation('inv-aisha', 'aisha@harbourview.example');
    const invite = new AcceptInvitePage(page);
    await invite.open('inv-aisha');
    await expect(invite.invitedEmail).toHaveText('aisha@harbourview.example');
    await invite.expectAccessible();
    await invite.expectNoHorizontalScroll();

    await invite.accept('Aisha Bello', 'short');
    await expect(invite.fieldError('password')).toHaveText('Use at least 12 characters.');
    await invite.accept('Aisha Bello', 'a long passphrase 42');
    await expect(invite.heading).toHaveText('Your mobile for alerts');
    await invite.savePhone('555-0101');
    await expect(invite.fieldError('mobile')).toHaveText('Include the area code, like 905-555-0101.');
    await invite.expectAccessible();
    await invite.savePhone('905-555-0101');

    await expect(invite.heading).toHaveText('You’re ready, Aisha');
    await expect(invite.openCheckIn).toBeVisible();
    expect(api.savedPhone).toBe('905-555-0101');
    await invite.expectAccessible();
  });

  // Traces to: L2-052 criterion 3
  test('Given a withdrawn invitation, when it opens, then it says it can’t be used and offers sign in', async ({ page, api }) => {
    api.sentInvitation('inv-gone', 'ravi.patel@example.org', 'Volunteer');
    api.withdrawLink('inv-gone');
    const invite = new AcceptInvitePage(page);

    await invite.open('inv-gone');

    await expect(invite.heading).toHaveText('This invitation can’t be used');
    await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible();
    await invite.expectAccessible();
  });
});
