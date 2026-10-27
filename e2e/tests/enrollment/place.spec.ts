import { test, expect } from '../../fixtures/test';
import { ApplicationPage } from '../../pages/application.page';
import { ApplicationsPage } from '../../pages/applications.page';

// Acceptance Test
// Traces to: L2-072 (reviewing and placing applicants) criteria 4, 5, 7 and 10; L2-013, L2-051 youth invitation, L2-035 accessibility.
test.describe('Place an applicant as an admin', () => {
  test.use({ signedInAs: 'm-tom' });

  test('Given Zoe’s referral, when Tom places her in Saturday Sports without an invitation, then she is accepted there and the application is read only', async ({ page, api }) => {
    const id = api.referZoe('p-tutoring');
    const application = new ApplicationPage(page);
    await application.open(id);

    await application.openPlace();
    await expect(application.cohort('After-School Tutoring')).toBeChecked();
    await expect(application.cohort('Winter Camp 2026')).toBeEnabled();
    await expect(application.inviteSwitch).toBeVisible();
    await application.expectAccessible();
    await application.place({ cohort: 'Saturday Sports', invite: false, note: 'Welcome! Saturdays at 10 am.' });

    await expect(page.getByRole('status').filter({ hasText: 'Zoe Campbell placed' })).toContainText('Tanya Campbell is texted');
    await expect(application.outcome).toContainText('Placed in Saturday Sports');
    await expect(application.outcome).toContainText('Tom Nguyen');
    await expect(application.action('Place')).toHaveCount(0);
    expect(api.applicationById(id).note).toBe('Welcome! Saturdays at 10 am.');
    await application.expectAccessible();

    const applications = new ApplicationsPage(page);
    await applications.open();
    await applications.show('Accepted');
    await expect(applications.row('Zoe Campbell')).toContainText('placed in Saturday Sports by Tom Nguyen');
  });

  test('Given Zoe’s referral, when Tom places her and invites her as a youth, then the invitation goes to her email', async ({ page, api }) => {
    const id = api.referZoe('p-tutoring');
    const application = new ApplicationPage(page);
    await application.open(id);

    await application.openPlace();
    await application.place({ invite: 'zoe.campbell@example.ca' });

    await expect(application.outcome).toContainText('Placed in After-School Tutoring');
    expect(api.youthInvitationFor(api.applicationById(id).childId!)?.email).toBe('zoe.campbell@example.ca');
  });

  test('Given an email that already has access, when Tom places Zoe and invites her, then the placement stands and the dialog says the invitation wasn’t sent', async ({ page, api }) => {
    const id = api.referZoe('p-tutoring');
    const application = new ApplicationPage(page);
    await application.open(id);

    await application.openPlace();
    await application.place({ invite: 'jaylen@harbourview.example' });

    await expect(application.dialog).toContainText('Zoe is in After-School Tutoring, but the invitation wasn’t sent');
    await expect(application.dialog).toContainText('Jaylen Okafor already has access.');
    await application.expectAccessible();
    await application.dialog.getByRole('button', { name: 'Done' }).click();
    await expect(application.outcome).toContainText('Placed in After-School Tutoring');
    expect(api.youthInvitationFor(api.applicationById(id).childId!)).toBeUndefined();
  });

  test('Given the cohort fills while the dialog is open, when Tom places Zoe, then it says to waitlist instead and nothing changes', async ({ page, api }) => {
    const id = api.referZoe('p-tutoring');
    const application = new ApplicationPage(page);
    await application.open(id);
    await application.openPlace();

    api.fillProgram('p-tutoring');
    await application.place({ invite: false });

    await expect(application.dialog).toContainText('After-School Tutoring is full (4 of 4). Waitlist instead.');
    expect(api.applicationById(id).status).toBe('WaitingReview');
  });

  test('Given a full cohort, when the dialog opens, then it cannot be chosen', async ({ page, api }) => {
    api.fillProgram('p-sports');
    const id = api.referZoe('p-tutoring');
    const application = new ApplicationPage(page);
    await application.open(id);

    await application.openPlace();

    await expect(application.cohort('Saturday Sports')).toBeDisabled();
  });
});

test.describe('Place an applicant as a program director', () => {
  test.use({ signedInAs: 'm-marisol' });

  test('Given Zoe’s referral, when Marisol places her, then no youth invitation is offered', async ({ page, api }) => {
    const id = api.referZoe('p-tutoring');
    const application = new ApplicationPage(page);
    await application.open(id);

    await application.openPlace();

    await expect(application.inviteSwitch).toHaveCount(0);
    await application.place();
    await expect(application.outcome).toContainText('Placed in After-School Tutoring');
  });
});
