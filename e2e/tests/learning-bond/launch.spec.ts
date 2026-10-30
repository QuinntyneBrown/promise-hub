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

test.describe('Learning Bond launch: when it goes out', () => {
  test.use({ signedInAs: 'm-tom' });

  // L2-140 criterion 3 (learning-bond-launch/invalid, scheduled).
  test('Given a past day the rule shows; given Mon 9 Nov, then the launch is scheduled for 10:00 am and audited', async ({ page, api }) => {
    const launch = new LearningBondLaunchPage(page);
    await launch.open();

    await launch.schedule('2026-11-05');
    await expect(launch.dayError).toHaveText('Choose a date from tomorrow to 90 days ahead.');
    await launch.expectAccessible();

    await launch.schedule('2026-11-09');

    await expect(launch.status).toContainText('Scheduled for Mon 9 Nov 2026, 10:00 am');
    await expect(launch.status).toContainText('4 by text and 0 by email. Change the date or cancel any time before then.');
    expect(api.learningBond.launchAudit.map((a) => a.summary)).toEqual(['Learning Bond launch scheduled for Mon 9 Nov 2026']);
    await launch.expectAccessible();
  });

  // L2-140 criterion 6 (learning-bond-launch/scheduled, cancelled; learning-bond-cancel-launch).
  test('Given a scheduled launch, when Tom changes the date and then cancels, then nothing is sent and both are audited', async ({ page, api }) => {
    const launch = new LearningBondLaunchPage(page);
    await launch.open();
    await launch.schedule('2026-11-09');
    await expect(launch.status).toContainText('Mon 9 Nov 2026');

    await launch.changeTheDate('2026-11-10');
    await expect(launch.status).toContainText('Scheduled for Tue 10 Nov 2026, 10:00 am');

    await launch.cancelLaunch();
    await expect(launch.cancelDialog).toContainText('Nothing has been sent.');
    await launch.expectAccessible();
    await launch.confirmCancel();

    await expect(launch.toast.last()).toContainText('Launch cancelled');
    await expect(launch.status).toHaveCount(0);
    expect(api.learningBond.launchAudit.map((a) => a.summary)).toEqual([
      'Learning Bond launch scheduled for Mon 9 Nov 2026',
      'Learning Bond launch moved to Tue 10 Nov 2026',
      'Learning Bond launch cancelled; nothing was sent',
    ]);
  });

  // L2-140 criterion 4 (learning-bond-launch/at-door).
  test('Given Tom chooses Staff invite at the door, then nothing is sent in bulk and the page says staff invite at check-in', async ({ page }) => {
    const launch = new LearningBondLaunchPage(page);
    await launch.open();

    await launch.launchAtTheDoor();

    await expect(launch.status).toContainText('Staff invite at the door');
    await expect(launch.status).toContainText('Nothing is sent in bulk.');
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
