import { test, expect } from '../../fixtures/test';
import { PeoplePage } from '../../pages/people.page';
import { AccountDeactivatedPage } from '../../pages/account-deactivated.page';
import { PersonPage } from '../../pages/person.page';

// Acceptance Test
// Traces to: L2-113, L2-114, L2-001, L2-005, L2-035, L2-036
// Description: an admin opens a person's record from the directory: the account, a youth's child record with her programs, her
// mentor while Mentoring is on, her Learning progress while Learning is on, and the account's history.
test.describe('A person record for an admin', () => {
  test.use({ signedInAs: 'm-tom' });

  test('Given Sofía, when Tom opens her from People, then her account, child record, mentor, Learning and history show', async ({ page, api }) => {
    api.assignYouthMentor('c-sofia', 'm-daniel');
    const people = new PeoplePage(page);
    const person = new PersonPage(page);
    await people.open();
    await people.openPerson('Sofía Rivera');

    await expect(person.heading).toHaveText('Sofía Rivera');
    await expect(person.fact('email')).toContainText('sofia@harbourview.example');
    await expect(person.fact('role')).toContainText('Youth');
    await expect(person.fact('status')).toContainText('Active');
    await expect(person.fact('child')).toContainText('Sofía Rivera · 12 · Rivera household');
    await expect(person.fact('programs')).toContainText('After-School Tutoring');
    await expect(person.fact('mentor')).toContainText('Daniel Osei');
    await expect(person.card('Learning')).toContainText('lessons');
    await expect(person.action('Change role')).toHaveCount(0);
    await expect(person.action('Deactivate')).toBeVisible();
    await person.expectAccessible();
    await person.expectNoHorizontalScroll();

    await person.openChildRecord();
    await expect(page).toHaveURL(/\/families\/hh-rivera\/children\/c-sofia$/);
  });

  test('Given Leo is a volunteer, when Tom makes him a youth worker, then the dialog warns about family records, the record shows the new role and the history records it', async ({
    page,
  }) => {
    const person = new PersonPage(page);
    await person.open('m-leo');
    await person.openChangeRole();
    await expect(person.roleOption('Volunteer')).toBeChecked();
    await expect(person.roleOption('Mentor')).toBeVisible();
    await expect(person.dialog.getByRole('radio', { name: /^Youth(?! worker)/ })).toHaveCount(0);

    await person.chooseRole('Youth worker');
    await expect(person.dialog).toContainText('This gives access to every family’s records');
    await person.expectAccessible();
    await person.confirmRole();

    await expect(person.toast).toContainText('Leo Martins’s role changed');
    await expect(person.fact('role')).toContainText('Youth worker');
    await expect(person.history).toContainText('Volunteer → YouthWorker');
  });

  test('Given Mentoring is off, when Tom changes a role, then Mentor is not offered; and when the change fails, the dialog says nothing changed', async ({
    page,
    api,
  }) => {
    api.setModules('org-harbourview', ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports', 'Learning']);
    const person = new PersonPage(page);
    await person.open('m-leo');
    await person.openChangeRole();
    await expect(person.roleOption('Mentor')).toHaveCount(0);

    api.failNext('/api/staff/m-leo/role', 500);
    await person.chooseRole('Site lead');
    await person.confirmRole();
    await expect(person.dialog).toContainText('The role didn’t change. Try again.');
    await expect(person.roleOption('Site lead')).toBeChecked();
  });

  test('Given Leo leaves, when Tom deactivates him and later reactivates him, then the record, the directory and the history follow', async ({ page }) => {
    const person = new PersonPage(page);
    const people = new PeoplePage(page);
    await person.open('m-leo');
    await person.deactivate();
    await expect(person.dialog).toContainText('They’re signed out everywhere and can’t sign in.');
    await expect(person.dialog.getByRole('button', { name: 'Cancel' })).toBeFocused();
    await person.expectAccessible();
    await person.confirmDeactivate();

    await expect(person.toast).toContainText('Leo Martins deactivated');
    await expect(person.fact('status')).toContainText('Deactivated');
    await expect(person.fact('deactivated')).toContainText('by Tom Nguyen');
    await expect(person.action('Deactivate')).toHaveCount(0);
    await person.expectAccessible();

    await person.backToPeople();
    await people.filterStatus('Deactivated');
    await expect.poll(() => people.names()).toEqual(['Leo Martins']);
    await people.openPerson('Leo Martins');

    await person.reactivate();
    await expect(person.toast.filter({ hasText: 'Leo Martins reactivated' })).toBeVisible();
    await expect(person.fact('status')).toContainText('Active');
    await expect(person.history).toContainText('reactivated by Tom Nguyen');
  });

  test('Given Sofía, when Tom opens Deactivate, then the dialog says her child record and progress stay; and when it fails, nothing changes', async ({
    page,
    api,
  }) => {
    const person = new PersonPage(page);
    await person.open('m-sofia');
    await person.deactivate();
    await expect(person.dialog).toContainText('Their child record, Learning progress and consents stay');

    api.failNext('/api/people/m-sofia/deactivate', 500);
    await person.confirmDeactivate();
    await expect(person.dialog).toContainText('Sofía’s account is still on. Try again.');
    await person.expectAccessible();
  });

  test('Given Nadia’s household was deleted, when Tom opens her record, then it says why her account stays off and Reactivate is disabled', async ({
    page,
    api,
  }) => {
    api.deleteChildRecordOf('m-nadia');
    const person = new PersonPage(page);
    await person.open('m-nadia');

    await expect(person.main).toContainText('The child record was deleted');
    await expect(person.fact('status')).toContainText('Deactivated');
    await expect(person.action('Reactivate')).toBeDisabled();
    await expect(page.getByRole('link', { name: 'Open child record' })).toHaveCount(0);
    await person.expectAccessible();
  });

  test('Given Mentoring and Learning are off, when Tom opens Sofía, then neither card shows', async ({ page, api }) => {
    api.setModules('org-harbourview', ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports']);
    const person = new PersonPage(page);
    await person.open('m-sofia');

    await expect(person.card('Youth record')).toBeVisible();
    await expect(person.card('Mentoring')).toHaveCount(0);
    await expect(person.card('Learning')).toHaveCount(0);
    await person.expectAccessible();
  });

  test('Given his own record, when Tom opens it, then it says so and offers no change', async ({ page }) => {
    const person = new PersonPage(page);
    await person.open('m-tom');

    await expect(person.main).toContainText('This is you');
    await expect(person.header.getByRole('button')).toHaveCount(0);
  });

  test('Given an account of another organization, when Tom opens it, then he is told it could not be loaded and goes back to People', async ({ page }) => {
    const person = new PersonPage(page);
    await person.open('m-samuel');

    await expect(person.main).toContainText('We couldn’t load this person');
    await person.expectAccessible();
    await person.backToPeople();
    await expect(page).toHaveURL(/\/people$/);
  });
});

test.describe('A person record for anyone else', () => {
  test.use({ signedInAs: 'm-marisol' });

  test('Given a program director, when she opens a record, then only admins manage people', async ({ page }) => {
    const person = new PersonPage(page);
    await person.open('m-sofia');

    await expect(person.heading).toHaveText('Only admins manage people');
    await person.expectAccessible();
  });
});

test.describe('A deactivated account', () => {
  test.use({ signedInAs: 'm-leo' });

  test('Given Tom deactivated Leo, when Leo uses the app again, then he is told the account is inactive', async ({ page, api }) => {
    api.deactivatePerson('m-leo');
    await page.goto('/');

    await new AccountDeactivatedPage(page).expectShown();
  });
});
