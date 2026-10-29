import { test, expect } from '../../fixtures/test';
import type { ModuleId } from '../../fixtures/seed';
import { SiteGetInvolvedPage } from '../../pages/site-get-involved.page';

// Acceptance Test
// Traces to: L2-134 criteria 2, 4 and 6, L2-132 criterion 5
// Description: Get involved offers volunteering, giving monthly and asking a question; Sign up to volunteer opens a dialog that needs the
// screening acknowledgement, stores the offer and thanks the visitor with a toast.
const SUITE: ModuleId[] = ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports'];
const LEO = {
  name: 'Leo Martins',
  email: 'leo.martins@example.com',
  phone: '905-555-0120',
  area: 'Homework help',
  about: 'I tutor maths on weekday afternoons.',
};

test.describe('Public website: get involved', () => {
  test.use({ signedInAs: null });

  test.beforeEach(({ api }) => {
    api.setModules('org-harbourview', [...SUITE, 'PublicWebsite']);
  });

  test('Given Get involved, then three ways to help show', async ({ page }) => {
    const involved = new SiteGetInvolvedPage(page);

    await involved.open();

    await expect(involved.heading).toHaveText('Help us keep our promises');
    await expect(involved.ways).toHaveText(['Volunteer with us', 'Give monthly', 'Have a question first?']);
    await involved.expectAccessible();
    await involved.expectNoHorizontalScroll();
  });

  test('Given the volunteer dialog, when Leo signs up with the acknowledgement, then his offer is stored and a toast thanks him', async ({
    page,
    api,
  }) => {
    const involved = new SiteGetInvolvedPage(page);
    await involved.open();

    await involved.openVolunteer();
    await expect(involved.dialog).toBeVisible();
    await involved.expectAccessible();
    await involved.fillVolunteer({ ...LEO, acknowledge: true });
    await involved.signUp();

    await expect(involved.dialog).toBeHidden();
    await expect(involved.toast).toBeVisible();
    expect(api.websiteRequests('org-harbourview', 'volunteer')).toEqual([
      expect.objectContaining({ email: LEO.email, area: 'Homework help', screeningAcknowledged: true }),
    ]);
  });

  test('Given no name and no acknowledgement, then the dialog shows the errors with a summary and nothing is sent', async ({
    page,
    api,
  }) => {
    const involved = new SiteGetInvolvedPage(page);
    await involved.open();
    await involved.openVolunteer();

    await involved.fillVolunteer({ name: '', email: LEO.email });
    await involved.signUp();

    await expect(involved.dialogText('Fix these to continue')).toBeVisible();
    await expect(involved.dialogError('vol-name')).toHaveText('Enter your name.');
    await expect(involved.dialogText('Tick the box to say you understand volunteers are screened.').last()).toBeVisible();
    expect(api.websiteRequests('org-harbourview', 'volunteer')).toEqual([]);
    await involved.expectAccessible();
  });

  test('Given five offers from Leo within the hour, then a sixth is refused kindly and the dialog stays open', async ({ page, api }) => {
    for (let i = 0; i < 5; i++) api.addWebsiteRequest('org-harbourview', 'volunteer', LEO.email);
    const involved = new SiteGetInvolvedPage(page);
    await involved.open();
    await involved.openVolunteer();

    await involved.fillVolunteer({ ...LEO, acknowledge: true });
    await involved.signUp();

    await expect(involved.dialogText('You’ve signed up already')).toBeVisible();
    expect(api.websiteRequests('org-harbourview', 'volunteer')).toHaveLength(5);
  });

  test('Given the sign-up fails, then the dialog keeps what Leo typed and says so', async ({ page, api }) => {
    api.failNext('/api/website/harbourview/volunteer', 500);
    const involved = new SiteGetInvolvedPage(page);
    await involved.open();
    await involved.openVolunteer();

    await involved.fillVolunteer({ ...LEO, acknowledge: true });
    await involved.signUp();

    await expect(involved.dialogText('Your sign-up didn’t send')).toBeVisible();
    await expect(involved.dialog.getByLabel('Your name')).toHaveValue(LEO.name);
  });
});
