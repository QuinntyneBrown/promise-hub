import { test, expect } from '../../fixtures/test';
import { LearningBondLaunchPage } from '../../pages/learning-bond-launch.page';
import { LearningBondMissingContactsPage } from '../../pages/learning-bond-missing-contacts.page';
import { SettingsLearningBondPage } from '../../pages/settings-learning-bond.page';

// L2-140 launching invitations: the covered households, how each can be reached, the missing contacts and the no-phone block (ADR 0079).
test.describe('Learning Bond launch', () => {
  test.use({ signedInAs: 'm-tom' });

  // L2-140 criterion 1 (learning-bond-launch/default, missing-contacts).
  test('Given Tran has only an email and Thompson neither, when Tom opens Launch, then the counts say so and the missing contacts name Thompson', async ({ page, api }) => {
    api.setGuardianContact('hh-tran', 'Linh Tran', { mobile: null, email: 'linh.tran@example.com' });
    api.setGuardianContact('hh-thompson', 'Dana Thompson', { mobile: null, email: null });
    const hub = new SettingsLearningBondPage(page);
    await hub.open();
    await hub.link('Plan the launch').click();

    const launch = new LearningBondLaunchPage(page);
    await launch.expectShown();
    await expect(launch.count('Households covered')).toHaveText('4');
    await expect(launch.count('With a mobile number')).toHaveText('2');
    await expect(launch.count('Email only')).toHaveText('1');
    await expect(launch.count('Neither')).toHaveText('1');
    await launch.expectAccessible();
    await launch.expectNoHorizontalScroll();

    await launch.missingContacts.click();
    const missing = new LearningBondMissingContactsPage(page);
    await missing.expectShown();
    await expect(missing.household('Thompson')).toContainText('Dana Thompson · After-School Tutoring');
    await expect(missing.household('Thompson')).toContainText('No mobile');
    await missing.expectAccessible();
  });

  // L2-140 criterion 2 (learning-bond-launch/blocked).
  test('Given no covered household has a mobile number, then Launch is disabled with the reason', async ({ page, api }) => {
    for (const [household, guardian] of [
      ['hh-rivera', 'Carmen Rivera'],
      ['hh-rivera', 'Luis Rivera'],
      ['hh-thompson', 'Dana Thompson'],
      ['hh-tran', 'Linh Tran'],
      ['hh-haddad', 'Nour Haddad'],
    ] as const)
      api.setGuardianContact(household, guardian, { mobile: null, email: 'someone@example.com' });
    const launch = new LearningBondLaunchPage(page);

    await launch.open();

    await expect(launch.launchBlocked).toHaveText('Add guardians’ mobile numbers before launching. Staff can collect them at check-in.');
    await expect(launch.launchButton).toBeDisabled();
    await launch.expectAccessible();
  });
});

test.describe('Learning Bond launch for a site lead', () => {
  test.use({ signedInAs: 'm-jaylen' });

  // L2-140 criterion 8 (learning-bond-launch/forbidden).
  test('Given Jaylen opens Launch, then admins launch Learning Bond', async ({ page }) => {
    const launch = new LearningBondLaunchPage(page);

    await launch.open();

    await expect(launch.forbidden).toBeVisible();
    await launch.expectAccessible();
  });
});

test.describe('Learning Bond launch while the module is off', () => {
  test.use({ signedInAs: 'm-grace' });

  // L2-140 criterion 9.
  test('Given Learning Bond is off at Northgate, when Grace opens Launch, then Today opens', async ({ page }) => {
    const launch = new LearningBondLaunchPage(page);

    await launch.open();

    await expect(page).toHaveURL(/\/$/);
  });
});
