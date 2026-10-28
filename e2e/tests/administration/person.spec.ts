import { test, expect } from '../../fixtures/test';
import { PeoplePage } from '../../pages/people.page';
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
