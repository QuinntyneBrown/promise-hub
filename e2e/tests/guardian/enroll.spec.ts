import { test, expect } from '../../fixtures/test';
import { GuardianEnrollPage } from '../../pages/guardian-enroll.page';
import { ProgramsPage } from '../../pages/programs.page';

// L2-013 guardian enrollment, L2-011 records, L2-026 codes, L2-027 language, L2-007 roles, L2-005 Roster off, L2-035/L2-036 accessibility.
test.describe('Open enrollment as a program director', () => {
  test.use({ signedInAs: 'm-marisol' });

  test('Given Winter Camp, when enrollment is opened, then the one link to share is shown, and it can be closed again', async ({ page }) => {
    const programs = new ProgramsPage(page);
    await page.goto('/programs/p-winter');

    await programs.openEnrollment();

    await expect(programs.dialog).toContainText('http://localhost:4317/g/enroll/winter-camp-2026');
    await programs.expectAccessible();
    await programs.closeDialog();
    await programs.closeEnrollment();
    await expect(page.getByRole('button', { name: 'Open enrollment' })).toBeVisible();
  });
});

test.describe('Enroll a child as a guardian', () => {
  test.use({ signedInAs: null });

  test('Given a new family, when they verify, fill in the household and child and agree, then the child waits for review', async ({ page, api }) => {
    const slug = api.openEnrollment('p-winter');
    const enroll = new GuardianEnrollPage(page);
    await enroll.open(slug);
    await expect(enroll.heading).toHaveText('Enroll in Winter Camp 2026');
    await enroll.expectAccessible();

    await enroll.verify('905-555-0300', api.guardianCode);
    await expect(enroll.heading).toHaveText('Your household');
    await expect(enroll.field('Mobile number')).toHaveValue('905-555-0300');
    await enroll.next();
    await expect(enroll.fieldError('guardianName')).toHaveText('Enter your full name.');
    await enroll.field('Your full name').fill('Ngozi Okafor');
    await enroll.next();

    await expect(enroll.heading).toHaveText('Your children');
    await enroll.fillChild(0, { firstName: 'Ada', lastName: 'Okafor', dateOfBirth: '2017-05-01', allergies: 'Shellfish' });
    await enroll.expectAccessible();
    await enroll.next();

    await expect(enroll.heading).toHaveText('Check and submit');
    await expect(enroll.text('Ada Okafor')).toBeVisible();
    await enroll.consent();
    await enroll.next('Submit');

    await expect(enroll.heading).toHaveText('Thank you, Ngozi');
    await expect(enroll.text('Ada is waiting for review.')).toBeVisible();
    await enroll.expectAccessible();
    await enroll.expectNoHorizontalScroll();
  });

  test('Given a returning family, when Carmen verifies, then last season’s household and children are filled in, in Spanish', async ({ page, api }) => {
    const slug = api.openEnrollment('p-winter');
    const enroll = new GuardianEnrollPage(page);
    await enroll.open(slug);

    await enroll.verify('905-555-0142', api.guardianCode);

    await expect(enroll.heading).toHaveText('Su familia');
    expect(await enroll.language).toBe('es');
    await expect(enroll.field('Su nombre completo')).toHaveValue('Carmen Rivera');
    await enroll.next('Continuar');
    await expect(enroll.childField('Niño 1', 'Nombre')).toHaveValue('Mateo');
  });

  test('Given a full program, when a family submits, then the child is waitlisted with a position', async ({ page, api }) => {
    const slug = api.openEnrollment('p-winter');
    api.fillProgram('p-winter');
    const enroll = new GuardianEnrollPage(page);
    await enroll.open(slug);
    await enroll.verify('905-555-0300', api.guardianCode);
    await enroll.field('Your full name').fill('Ngozi Okafor');
    await enroll.next();
    await enroll.fillChild(0, { firstName: 'Ada', lastName: 'Okafor', dateOfBirth: '2017-05-01' });
    await enroll.next();
    await enroll.consent();

    await enroll.next('Submit');

    await expect(enroll.text('Ada is on the waitlist, number 1.')).toBeVisible();
  });

  test('Given enrollment is closed, when the link is opened, then it says so with the organization’s number', async ({ page, api }) => {
    const slug = api.openEnrollment('p-winter');
    api.closeEnrollment('p-winter');
    const enroll = new GuardianEnrollPage(page);

    await enroll.open(slug);

    await expect(enroll.heading).toHaveText('Enrollment for Winter Camp 2026 is closed');
    await expect(enroll.footer).toContainText('905-555-0100');
    await enroll.expectAccessible();
  });

  test('Given the roster module is off, when the link is opened, then the page is not available', async ({ page, api }) => {
    const slug = api.openEnrollment('p-winter');
    api.setModules('org-harbourview', []);
    const enroll = new GuardianEnrollPage(page);

    await enroll.open(slug);

    await expect(enroll.heading).toHaveText('This page isn’t available');
  });
});

test.describe('Enrollment for other roles', () => {
  test('Given a site lead, when a program opens, then there is no way to open enrollment', async ({ page }) => {
    await page.goto('/programs/p-winter');

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Winter Camp 2026');
    await expect(page.getByRole('button', { name: 'Open enrollment' })).toHaveCount(0);
  });
});
