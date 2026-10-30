import { test, expect } from '../../fixtures/test';
import { GuardianRemindersPage } from '../../pages/guardian-reminders.page';

// L2-157 reminders on the dates that matter with Turn off; L2-158 the running total by child and stream.
test.describe('A guardian sees her reminders and her total', () => {
  test.use({ signedInAs: null });
  test.beforeEach(({ api }) => {
    api.setHouseholdLanguage('hh-rivera', 'English');
    api.learningBond.links.set('tok-lb-rivera', { householdId: 'hh-rivera', organizationId: 'org-harbourview', language: 'en' });
    api.trustGuardianDevice('hh-rivera');
  });

  // L2-157 criteria 1 and 3 (learning-bond-reminders/default, turned-off).
  test('Given a finished benefits check, when Carmen opens her reminders, then each date that matters is listed and she can turn one off', async ({ page, api }) => {
    api.learningBond.dateReminders.push(
      { id: 'r-taxes', kind: 'Taxes', subject: '2026', dueOn: '2027-03-15', eventOn: '2027-03-15', turnedOff: false },
      { id: 'r-ccb', kind: 'Renewal', subject: 'Canada Child Benefit', dueOn: '2027-07-01', eventOn: '2027-07-01', turnedOff: false },
      { id: 'r-sofia', kind: 'TurnsEighteen', subject: 'Sofía', dueOn: '2032-05-03', eventOn: '2032-06-02', turnedOff: false },
    );
    const reminders = new GuardianRemindersPage(page);
    await reminders.open('/g/learning-bond/tok-lb-rivera/reminders');

    await expect(reminders.heading).toHaveText('Your reminders');
    await expect(reminders.reminder('File your 2026 taxes')).toContainText('Mon 15 Mar 2027');
    await expect(reminders.reminder('Sofía turns 18')).toContainText('Wed 2 Jun 2032');
    await reminders.expectAccessible();
    await reminders.turnOff('Canada Child Benefit renews');

    await expect(reminders.reminder('Canada Child Benefit renews')).toContainText('Off');
    expect(api.learningBond.dateReminders.find((r) => r.id === 'r-ccb')!.turnedOff).toBe(true);
  });

  // L2-157 (learning-bond-reminders/empty).
  test('Given no benefits check yet, when Carmen opens her reminders, then there are none', async ({ page }) => {
    const reminders = new GuardianRemindersPage(page);
    await reminders.open('/g/learning-bond/tok-lb-rivera/reminders');

    await expect(reminders.noReminders).toBeVisible();
  });

  // L2-158 criterion 1 (learning-bond-total/default).
  test('Given a deposit and a started benefit, when Carmen opens her family page, then she sees what is unlocked and applied for, by child and stream', async ({ page, api }) => {
    api.learningBond.totalLines.push(
      { child: 'Mateo', stream: 'Learning Bond', amount: 1400, confirmed: true },
      { child: 'Sofía', stream: 'Learning Bond', amount: 1700, confirmed: false },
      { child: 'Mateo', stream: 'Ontario Child Benefit', amount: 840, confirmed: true },
      { child: 'Sofía', stream: 'Ontario Child Benefit', amount: 840, confirmed: true },
    );
    const reminders = new GuardianRemindersPage(page);
    await reminders.open('/g/learning-bond/tok-lb-rivera');

    await expect(reminders.totalCard).toContainText('Unlocked so far: $3,080');
    await reminders.totalCard.getByRole('link', { name: 'See your total' }).click();

    await expect(reminders.unlocked).toContainText('$3,080');
    await expect(reminders.applied).toContainText('Applied for: up to $1,700');
    await expect(reminders.row('up to $1,700')).toContainText('Sofía');
    await reminders.expectAccessible();
  });

  // L2-158 criterion 3 (learning-bond-total/nothing-confirmed).
  test('Given nothing is confirmed yet, when Carmen opens her total, then it says so with what is applied for', async ({ page, api }) => {
    api.learningBond.totalLines.push({ child: 'Mateo', stream: 'Learning Bond', amount: 1400, confirmed: false });
    const reminders = new GuardianRemindersPage(page);
    await reminders.open('/g/learning-bond/tok-lb-rivera/total');

    await expect(reminders.unlocked).toContainText('Nothing confirmed yet');
    await expect(reminders.applied).toContainText('Applied for: up to $1,400');
  });
});
