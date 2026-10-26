import { test, expect } from '../../fixtures/test';
import { ChildPage } from '../../pages/child.page';

// Acceptance Test
// Traces to: L2-051, L2-035, L2-036
// Description: an admin invites a youth from the child record while Learning is on; nothing of it shows otherwise.
test.describe('Invite a youth from the child record', () => {
  test.use({ signedInAs: 'm-tom' });

  test('Given Yusuf has no youth account, when Tom invites his email, then the card shows the invitation waiting', async ({ page }) => {
    const child = new ChildPage(page);
    await child.open('/families/hh-haddad/children/c-yusuf');
    await expect(child.youthAccount).toContainText('No youth account yet');
    await child.expectAccessible();
    await child.expectNoHorizontalScroll();

    await child.openInviteYouth();
    await child.expectAccessible();
    await child.sendYouthInvitation('yusuf');
    await expect(child.dialogError('invite-youth-email')).toHaveText('Enter an email like name@example.org.');
    await child.sendYouthInvitation('yusuf.haddad@example.com');

    await expect(child.dialog).toBeHidden();
    await expect(child.toast).toContainText('Invitation sent');
    await expect(child.youthAccount).toContainText('yusuf.haddad@example.com');
    await expect(child.youthAccount).toContainText('Invited');
  });

  test('Given Nadia accepted her invitation, when her record opens, then the card names her active account and offers no invitation', async ({ page }) => {
    const child = new ChildPage(page);
    await child.open('/families/hh-haddad/children/c-nadia');

    await expect(child.youthAccount).toContainText('Nadia Haddad');
    await expect(child.youthAccount).toContainText('Active');
    await expect(child.youthAccount.getByRole('button', { name: 'Invite to PromiseHub' })).toHaveCount(0);
  });

  test('Given Amara is 7, when her record opens, then there is no Youth account card', async ({ page }) => {
    const child = new ChildPage(page);
    await child.open('/families/hh-okonkwo/children/c-amara');

    await expect(child.medical).toBeVisible();
    await expect(child.youthAccount).toHaveCount(0);
  });

  test('Given Learning is off, when Yusuf’s record opens, then nothing about youth accounts is rendered or requested', async ({ page, api }) => {
    api.setModules('org-harbourview', ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports']);
    const requested: string[] = [];
    page.on('request', (r) => requested.push(r.url()));
    const child = new ChildPage(page);
    await child.open('/families/hh-haddad/children/c-yusuf');

    await expect(child.medical).toBeVisible();
    await expect(child.youthAccount).toHaveCount(0);
    expect(requested.filter((u) => u.includes('youth-account'))).toEqual([]);
  });

  test.describe('as a program director', () => {
    test.use({ signedInAs: 'm-marisol' });

    test('Given Marisol, when Yusuf’s record opens, then the Youth account card is not shown', async ({ page }) => {
      const child = new ChildPage(page);
      await child.open('/families/hh-haddad/children/c-yusuf');

      await expect(child.medical).toBeVisible();
      await expect(child.youthAccount).toHaveCount(0);
    });
  });
});
