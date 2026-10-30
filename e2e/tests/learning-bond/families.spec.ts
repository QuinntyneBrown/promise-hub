import { test, expect } from '../../fixtures/test';
import { LearningBondFamiliesPage } from '../../pages/learning-bond-families.page';
import { ShellPage } from '../../pages/shell.page';

// L2-142 criteria 1, 5 and 6: staff in the status roles see each covered household's status and last change, filtered by status and program;
// others neither see it in the navigation nor open it.
test.describe('Learning Bond households', () => {
  test.use({ signedInAs: 'm-tom' });

  // L2-142 criterion 1 (learning-bond-families/default).
  test('Given Thompson was invited, when Tom opens Learning Bond from the menu, then each covered household shows its status, filtered by status and program', async ({ page, api }) => {
    api.learningBond.invitations.push({ organizationId: 'org-harbourview', householdId: 'hh-thompson', sentAt: '2026-11-05T15:00:00Z' });
    const shell = new ShellPage(page);
    await page.goto('/');
    await shell.openMenu();
    await shell.goToFromMenu('Learning Bond');

    const families = new LearningBondFamiliesPage(page);
    await families.expectShown();
    expect(await families.names()).toEqual(['Haddad', 'Rivera', 'Thompson', 'Tran']);
    await expect(families.household('Thompson')).toContainText('Invited');
    await expect(families.household('Thompson')).toContainText('Thu 5 Nov');
    await expect(families.household('Tran')).toContainText('Not invited');
    await families.expectAccessible();
    await families.expectNoHorizontalScroll();

    await families.filterByStatus('Invited');
    await expect.poll(() => families.names()).toEqual(['Thompson']);
    await families.filterByStatus('All');
    await families.filterByProgram('Saturday Sports');
    await expect.poll(() => families.names()).toEqual(['Tran']);
  });
});

test.describe('Learning Bond call requests', () => {
  test.use({ signedInAs: 'm-tom' });

  // L2-142 criteria 3 and 4 (learning-bond-families/call-requested, learning-bond-call-outcome).
  test('Given Linh Tran asked for a call, when Tom marks it done as not interested, then the status follows and it is audited', async ({ page, api }) => {
    api.learningBond.requestCall('org-harbourview', 'hh-tran', '289-555-0119', 'Afternoons');
    const families = new LearningBondFamiliesPage(page);
    await families.open();
    await expect(families.household('Tran')).toContainText('Call requested');
    await expect(families.household('Tran')).toContainText('289-555-0119 · afternoons');

    await families.markCallDone('Tran');
    await expect(families.callDialog).toContainText('You see where they are in the steps, never a SIN or income.');
    await families.expectAccessible();
    await families.saveOutcome('Not interested');

    await expect(families.toast.last()).toContainText('Call recorded');
    await expect(families.household('Tran')).toContainText('Not interested');
    await expect(families.household('Tran').getByRole('button', { name: 'Mark call done' })).toHaveCount(0);
    expect(api.learningBond.callAudit).toEqual(['Learning Bond call with the Tran household done: Not interested']);
  });
});

test.describe('Learning Bond households for a role outside the status roles', () => {
  test.use({ signedInAs: 'm-jaylen' });

  // L2-142 criterion 5 (learning-bond-families/forbidden).
  test('Given Site lead is not in the status roles, then Learning Bond is not in Jaylen’s menu and the page says his role doesn’t see it', async ({ page }) => {
    const shell = new ShellPage(page);
    await page.goto('/');
    await shell.openMenu();
    expect(await shell.menuLabels()).not.toContain('Learning Bond');

    const families = new LearningBondFamiliesPage(page);
    await families.open();

    await expect(families.forbidden).toBeVisible();
    await families.expectAccessible();
  });
});

test.describe('Learning Bond households while the module is off', () => {
  test.use({ signedInAs: 'm-grace' });

  // L2-142 criterion 6.
  test('Given Learning Bond is off at Northgate, when Grace opens the households, then Today opens', async ({ page }) => {
    const families = new LearningBondFamiliesPage(page);

    await families.open();

    await expect(page).toHaveURL(/\/$/);
  });
});
