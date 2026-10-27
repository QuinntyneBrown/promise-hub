import { test, expect } from '../../fixtures/test';
import { AcceptInvitePage } from '../../pages/accept-invite.page';

// Acceptance Test
// Traces to: L2-054, L2-009 criterion 2, L2-035, L2-036
// Description: an expired link shows its own page and asks the inviter for a new link without an account.
test.describe('Replace an expired invitation', () => {
  test.use({ signedInAs: null });

  test('Given Yusuf’s link expired, when he asks for a new one, then the page says Tom was told', async ({ page, api }) => {
    api.sentInvitation('inv-old', 'yusuf.haddad@example.com', 'Youth', true);
    const invite = new AcceptInvitePage(page);
    await invite.open('inv-old');

    await expect(invite.heading).toHaveText('This invitation has expired');
    await expect(invite.subtitle).toHaveText('Invitations last 14 days to keep accounts safe. Tom Nguyen can send you a fresh link.');
    await expect(invite.alreadyHaveAccount).toHaveAttribute('href', '/sign-in');
    await invite.expectAccessible();
    await invite.expectNoHorizontalScroll();

    await invite.askForNewLink('Tom Nguyen');

    await expect(invite.heading).toHaveText('We’ve let Tom Nguyen know');
    expect(api.newLinkRequests).toEqual(['inv-old']);
    await invite.expectAccessible();
  });

  test('Given the request fails, when he asks, then it says so and the button stays', async ({ page, api }) => {
    api.sentInvitation('inv-old', 'yusuf.haddad@example.com', 'Youth', true);
    api.failNext('/api/invitations/inv-old/request-new', 500);
    const invite = new AcceptInvitePage(page);
    await invite.open('inv-old');

    await invite.askForNewLink('Tom Nguyen');

    await expect(page.getByRole('alert')).toContainText('That didn’t go through');
    await expect(invite.heading).toHaveText('This invitation has expired');
    await expect(invite.newLinkButton('Tom Nguyen')).toBeEnabled();
  });
});
