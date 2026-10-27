import { test, expect } from '../../fixtures/test';
import { ApplicationPage } from '../../pages/application.page';
import { ApplicationsPage } from '../../pages/applications.page';
import { TodayPage } from '../../pages/today.page';

// Acceptance Test
// Traces to: L2-072 (reviewing and placing applicants) criteria 2, 3, 8 to 10; L2-071, L2-005 Roster off, L2-035/L2-036 accessibility and phone layout.
test.describe('Read an application', () => {
  test.use({ signedInAs: 'm-tom' });

  test('Given Zoe’s referral, when Tom opens it from the pipeline, then he reads Zoe, Rachel’s referral and reason, and Tanya’s contact', async ({ page, api }) => {
    api.referZoe('p-tutoring');
    const applications = new ApplicationsPage(page);
    await applications.open();

    await applications.openApplication('Zoe Campbell');

    const application = new ApplicationPage(page);
    await expect(application.heading).toHaveText('Zoe Campbell');
    await expect(application.subtitle).toContainText('13 · applied 5 Nov 2026 for After-School Tutoring');
    await expect(application.fact('status')).toContainText('Waiting review');
    await expect(application.fact('consent')).toContainText('Not given yet: collect it from Tanya');
    await expect(application.fact('referrer')).toContainText('Rachel Ellis');
    await expect(application.fact('role')).toContainText('Guidance counsellor');
    await expect(application.fact('organization')).toContainText('Bennetto Elementary');
    await expect(application.fact('contact')).toContainText('rachel.ellis@bennetto.example.ca');
    await expect(application.fact('reason')).toContainText('Zoe is curious and kind');
    await expect(application.fact('guardian')).toContainText('Tanya Campbell');
    await expect(application.fact('mobile')).toContainText('905-555-0320');
    await expect(application.fact('household')).toContainText('Campbell · new household');
    await expect(application.card('Notes')).toContainText('No notes yet');
    await application.expectAccessible();
    await application.expectNoHorizontalScroll();
  });

  test('Given Malik applied for himself, when Tom opens it, then it says so and that Denise must consent', async ({ page, api }) => {
    const id = api.malikApplies('p-tutoring');
    const application = new ApplicationPage(page);

    await application.open(id);

    await expect(application.card('Referral')).toHaveCount(0);
    await expect(application.fact('applied-by')).toContainText('Malik Johnson, the young person');
    await expect(application.fact('consent')).toContainText('Not given yet: Malik is under 18, so Denise Johnson consents');
    await application.expectAccessible();
  });

  test('Given Zoe’s referral, when Tom adds a note, then an empty note is refused and the note shows first with his name', async ({ page, api }) => {
    const id = api.referZoe('p-tutoring');
    api.noteApplication(id, 'Marisol Delgado', 'Rachel says Zoe would do well with a mentor.');
    const application = new ApplicationPage(page);
    await application.open(id);

    await application.addNote('   ');
    await expect(application.dialog).toContainText('Write a note of up to 2,000 characters.');
    await application.expectAccessible();
    await application.dialog.getByLabel('Note').fill('Called Tanya: she is happy for Zoe to start.');
    await application.dialog.getByRole('button', { name: 'Add note' }).click();

    await expect(application.dialog).toBeHidden();
    await expect(application.notes).toHaveCount(2);
    await expect(application.notes.first()).toContainText('Tom Nguyen');
    await expect(application.notes.first()).toContainText('Called Tanya: she is happy for Zoe to start.');
  });

  test('Given another organization’s application, when its link is opened, then nothing of it shows', async ({ page }) => {
    const application = new ApplicationPage(page);

    await application.open('er-northgate-unknown');

    await expect(application.heading).toHaveText('We can’t find that application');
    await application.expectAccessible();
  });
});

test.describe('An application for other roles and modules', () => {
  test('Given a site lead, when an application link is opened, then it says who reviews applications', async ({ page, api }) => {
    const id = api.referZoe('p-tutoring');
    const application = new ApplicationPage(page);

    await application.open(id);

    await expect(application.heading).toHaveText('Only admins and program directors review applications');
    await application.expectAccessible();
  });

  test('Given the Roster module is off, when an application is opened, then Today opens', async ({ page, api }) => {
    const id = api.referZoe('p-tutoring');
    api.setModules('org-harbourview', []);

    await page.goto(`/applications/${id}`);

    await expect(page).toHaveURL(/\/$/);
    await expect(new TodayPage(page).heading).toBeVisible();
  });
});
