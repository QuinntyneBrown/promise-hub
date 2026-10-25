import { test, expect } from '../../fixtures/test';
import { IncidentsPage } from '../../pages/incidents.page';

// L2-023 criteria 2, 4 and 9 reviewing incidents, L2-007 roles, L2-032 audit trail, L2-035/L2-036 accessibility and phone layout.
test.describe('Review incidents as a program director', () => {
  test.use({ signedInAs: 'm-marisol' });

  test('Given Jaylen’s report, when Marisol marks it reviewed with a note, then it is closed with her note and the trail shows who opened it', async ({ page, api }) => {
    const id = api.reportIncident('m-jaylen', 'Injury', 'c-mateo');
    const incident = new IncidentsPage(page);
    await incident.openIncident(id);
    await expect(incident.list2('Trail')).toContainText('Marisol Delgado opened the report');
    await incident.expectAccessible();
    await incident.expectNoHorizontalScroll();

    await incident.action('Mark reviewed').click();
    await incident.dialog.getByRole('button', { name: 'Mark reviewed' }).click();
    await expect(incident.dialog).toContainText('Write a review note.');
    await incident.expectAccessible();
    await incident.dialog.getByRole('button', { name: 'Cancel' }).click();
    await incident.markReviewed('Followed first-aid procedure correctly.', 'Closed, no further action');

    await expect(incident.status).toHaveText('Closed');
    await expect(incident.reviewed).toContainText('Followed first-aid procedure correctly.');
    await expect(incident.action('Mark reviewed')).toHaveCount(0);
  });

  test('Given a closed report, when a follow-up is added and it is reopened, then the follow-up is kept and it is open again', async ({ page, api }) => {
    const id = api.reportIncident('m-jaylen', 'Injury', 'c-mateo');
    const incident = new IncidentsPage(page);
    await incident.openIncident(id);
    await incident.markReviewed('Done.', 'Closed, no further action');

    await incident.addFollowUp('Called Carmen the next day; Mateo is fine.');
    await expect(incident.list2('Follow-up')).toContainText('Called Carmen the next day');
    await incident.reopen();

    await expect(incident.status).toHaveText('Open');
  });
});

test.describe('Review for reporters', () => {
  test.use({ signedInAs: 'm-jaylen' });

  test('Given his own report, when Jaylen opens it, then he can add a follow-up but not review it', async ({ page, api }) => {
    const id = api.reportIncident('m-jaylen', 'Injury', 'c-mateo');
    const incident = new IncidentsPage(page);

    await incident.openIncident(id);

    await expect(incident.action('Add follow-up')).toBeVisible();
    await expect(incident.action('Mark reviewed')).toHaveCount(0);
  });
});
