import { test, expect } from '../../fixtures/test';
import { ProgramsPage } from '../../pages/programs.page';

// L2-012 programs, L2-007 roles, L2-035 accessibility.
test.describe('Programs as a program director', () => {
  test.use({ signedInAs: 'm-marisol' });

  test('Given Harbourview programs, when Programs opens, then active programs list with enrolled against capacity', async ({ page }) => {
    const programs = new ProgramsPage(page);

    await programs.open();

    expect(await programs.names()).toEqual(['After-School Tutoring', 'Saturday Sports', 'Winter Camp 2026']);
    await expect(programs.row('After-School Tutoring')).toContainText('Mon–Thu, 4–6 pm · 4 of 50 enrolled');
    await expect(programs.row('After-School Tutoring')).toContainText('Enrolling');
    await programs.expectAccessible();
    await programs.expectNoHorizontalScroll();

    await programs.filter('Archived');
    await expect.poll(() => programs.names()).toEqual(['Summer Camp 2026']);
  });

  test('Given the new program form, when submitted empty, then it explains; when filled, then the program opens with nobody enrolled', async ({ page }) => {
    const programs = new ProgramsPage(page);
    await programs.open();
    await programs.newProgramButton.click();
    await expect(programs.heading).toHaveText('New program');
    await programs.expectAccessible();

    await programs.submitProgram();
    await expect(programs.fieldError('name')).toHaveText('Enter the program name.');
    await expect(programs.fieldError('capacity')).toHaveText('Enter a capacity of 1 or more.');

    await programs.fillProgram({ name: 'Spring Robotics', startsOn: '2027-01-10', endsOn: '2027-04-30', schedule: 'Wed, 4–6 pm', capacity: '12', ages: '8–13' });
    await programs.submitProgram();

    await expect(programs.heading).toHaveText('Spring Robotics');
    await expect(page.getByTestId('stat-enrolled')).toContainText('0 / 12');
    await expect(page.getByTestId('page-subtitle')).toContainText('Enrollment closed');
  });

  test('Given a program, when a child is enrolled and another removed, then the roster follows', async ({ page }) => {
    const programs = new ProgramsPage(page);
    await programs.open();
    await programs.openProgram('After-School Tutoring');
    await programs.expectAccessible();

    await programs.enroll('amar', 'Amara Okonkwo');
    await expect.poll(() => programs.names(programs.roster)).toContain('Amara Okonkwo');

    await programs.removeFromRoster('Mateo Rivera');
    await expect.poll(() => programs.names(programs.roster)).not.toContain('Mateo Rivera');
  });

  test('Given a program, when archived by typing its name, then it is read-only and can be restored', async ({ page }) => {
    const programs = new ProgramsPage(page);
    await programs.open();
    await programs.openProgram('Winter Camp 2026');

    await programs.archive('Winter Camp 2026');

    await expect(programs.archivedNotice).toBeVisible();
    await page.getByRole('button', { name: 'Restore' }).click();
    await expect(programs.archivedNotice).toBeHidden();
    await expect(page.getByTestId('toast').filter({ hasText: 'Winter Camp 2026 restored' })).toBeVisible();
  });
});

test.describe('Programs for a site lead', () => {
  test('Given a site lead, when Programs opens, then programs are listed without the new or roster actions', async ({ page }) => {
    const programs = new ProgramsPage(page);
    await programs.open();
    await expect(programs.newProgramButton).toBeHidden();

    await programs.openProgram('After-School Tutoring');

    await expect(page.getByRole('button', { name: 'Add a child' })).toBeHidden();
    await expect(programs.roster.getByRole('button', { name: /^Remove/ })).toHaveCount(0);
  });
});
