import { test, expect } from '../../fixtures/test';
import { HouseholdPage } from '../../pages/household.page';

// L2-140 criteria 4, 5 and 8: staff whose role is in the status roles invite a covered household at the door, once within 7 days.
test.describe('Invite a household to Learning Bond at the door', () => {
  test.use({ signedInAs: 'm-tom' });

  // L2-140 criterion 4 (household/learning-bond-not-invited, learning-bond-invite-household).
  test('Given the Thompson household is covered and not invited, when Tom sends the invitation, then Dana is texted once and the card says when', async ({ page, api }) => {
    const household = new HouseholdPage(page);
    await household.openHousehold('hh-thompson');
    await expect(household.learningBond).toContainText('Not invited yet. Covered through After-School Tutoring.');

    await household.inviteToLearningBond();
    await expect(household.inviteDialog).toContainText('One text to Dana Thompson now, in English, naming Jordan.');
    await expect(household.inviteDialog).toContainText('Jordan may be owed up to $2,000 for school after high school.');
    await household.expectAccessible();
    await household.sendInvitation();

    await expect(household.toast.last()).toContainText('Thompson household invited');
    await expect(household.learningBond).toContainText('Invited Thu 5 Nov');
    await expect(household.learningBond.getByRole('button', { name: 'Invite to Learning Bond' })).toHaveCount(0);
    expect(api.learningBond.invitations.map((i) => i.householdId)).toEqual(['hh-thompson']);
    await household.expectAccessible();
  });

  // L2-140 criterion 5: invited within 7 days.
  test('Given the Rivera household was invited this week, then the card says when and offers no second invitation', async ({ page, api }) => {
    api.learningBond.invitations.push({ organizationId: 'org-harbourview', householdId: 'hh-rivera', sentAt: '2026-11-03T15:00:00Z' });
    const household = new HouseholdPage(page);

    await household.openHousehold('hh-rivera');

    await expect(household.learningBond).toContainText('Invited Tue 3 Nov');
    await expect(household.learningBond.getByRole('button', { name: 'Invite to Learning Bond' })).toHaveCount(0);
  });

  // A household no covered program reaches has no card.
  test('Given the Okonkwo household is not covered, then the page has no Learning Bond card', async ({ page }) => {
    const household = new HouseholdPage(page);

    await household.openHousehold('hh-okonkwo');

    await household.expectOpen('Okonkwo');
    await expect(household.learningBond).toHaveCount(0);
  });
});

test.describe('The Learning Bond card for a role outside the status roles', () => {
  test.use({ signedInAs: 'm-jaylen' });

  // L2-140 criterion 8 (household/default for a role without status).
  test('Given Site lead is not in the status roles, then Jaylen sees no Learning Bond card', async ({ page }) => {
    const household = new HouseholdPage(page);

    await household.openHousehold('hh-thompson');

    await household.expectOpen('Thompson');
    await expect(household.learningBond).toHaveCount(0);
  });
});

test.describe('The Learning Bond card while the module is off', () => {
  test.use({ signedInAs: 'm-grace' });

  // L2-140 criterion 9 (household/learning-bond-off).
  test('Given Learning Bond is off at Northgate, then the household page says nothing about it', async ({ page }) => {
    const household = new HouseholdPage(page);

    await household.openHousehold('hh-northgate-rivera');

    await household.expectOpen('Rivera');
    await expect(household.learningBond).toHaveCount(0);
  });
});
