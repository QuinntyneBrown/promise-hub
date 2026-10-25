import { test, expect } from '../../fixtures/test';
import { CheckInPage } from '../../pages/check-in.page';

// L2-017 criterion 3 sign-out, L2-020 approved pickups, L2-007 roles, L2-005 Pickup off, L2-035/L2-036 accessibility and phone layout.
test.describe('Sign children out as a site lead', () => {
  test('Given Mateo is checked in, when Sign out is tapped, then his approved adults are listed primary first', async ({ page }) => {
    const checkIn = new CheckInPage(page);
    await checkIn.open();
    await checkIn.checkIn('Mateo Rivera');

    await checkIn.openSignOut('Mateo Rivera');

    await expect(checkIn.dialog).toContainText('Sign out Mateo Rivera');
    expect(await checkIn.approvedAdults()).toEqual(['Carmen Rivera', 'Luis Rivera']);
    await checkIn.expectAccessible();
    await checkIn.expectNoHorizontalScroll();
  });

  test('Given the approved list, when Carmen is chosen, then Mateo is signed out to her with the time', async ({ page }) => {
    const checkIn = new CheckInPage(page);
    await checkIn.open();
    await checkIn.checkIn('Mateo Rivera');
    await checkIn.openSignOut('Mateo Rivera');

    await checkIn.pickUpBy('Carmen Rivera');
    await checkIn.confirmSignOut();

    await expect(checkIn.dialog).toBeHidden();
    await expect(page.getByRole('status').filter({ hasText: 'Mateo Rivera signed out' })).toContainText('With Carmen Rivera');
    await expect(checkIn.row('Mateo Rivera')).toContainText('Signed out');
    await expect(checkIn.row('Mateo Rivera')).toContainText('Carmen Rivera');
    await expect(checkIn.signOutButton('Mateo Rivera')).toHaveCount(0);
    await checkIn.expectAccessible();
  });

  test('Given no choice, when Sign out is pressed, then the dialog asks who is taking Mateo home', async ({ page }) => {
    const checkIn = new CheckInPage(page);
    await checkIn.open();
    await checkIn.checkIn('Mateo Rivera');
    await checkIn.openSignOut('Mateo Rivera');

    await checkIn.confirmSignOut();

    await expect(checkIn.dialog).toContainText('Choose who is taking Mateo home.');
    await checkIn.expectAccessible();
  });

  test('Given someone not on the list, when Carmen has not okayed it, then sign-out is blocked with her number to call', async ({ page }) => {
    const checkIn = new CheckInPage(page);
    await checkIn.open();
    await checkIn.checkIn('Mateo Rivera');
    await checkIn.openSignOut('Mateo Rivera');

    await checkIn.someoneElse('Daniel Rivera', false);
    await expect(checkIn.dialog).toContainText('Not on the approved list');
    await expect(checkIn.callPrimary).toHaveAttribute('href', 'tel:905-555-0142');
    await checkIn.confirmSignOut();

    await expect(checkIn.dialog).toContainText('Carmen Rivera needs to okay this by phone first.');
    await checkIn.expectAccessible();

    await checkIn.someoneElse('Daniel Rivera', true);
    await checkIn.confirmSignOut();

    await expect(checkIn.dialog).toBeHidden();
    await expect(checkIn.row('Mateo Rivera')).toContainText('Daniel Rivera');
  });

  test('Given the server fails, when Sign out is pressed, then the choice is kept to try again', async ({ page, api }) => {
    const checkIn = new CheckInPage(page);
    await checkIn.open();
    await checkIn.checkIn('Mateo Rivera');
    await checkIn.openSignOut('Mateo Rivera');
    await checkIn.pickUpBy('Carmen Rivera');
    api.failNext('/api/sessions/e-tutoring-today/sign-outs', 500);

    await checkIn.confirmSignOut();

    await expect(checkIn.dialog).toContainText('That didn’t go through');
    await expect(checkIn.dialog.getByRole('radio', { name: /^Carmen Rivera/ })).toBeChecked();
  });
});

test.describe('Sign-out for other roles and modules', () => {
  test.describe('as a volunteer coordinator', () => {
    test.use({ signedInAs: 'm-priya-hyc' });

    test('Given tonight’s roster, when it opens, then there is no Sign out', async ({ page }) => {
      const checkIn = new CheckInPage(page);
      await checkIn.open();

      await expect(checkIn.heading).toHaveText('Tutoring night');
      await expect(page.getByRole('button', { name: /^Sign out / })).toHaveCount(0);
    });
  });

  test('Given Pickup is off, when a child is checked in, then there is no Sign out and check-in still works', async ({ page, api }) => {
    api.setModules('org-harbourview', ['Roster', 'RollCall', 'QuickCards']);
    const checkIn = new CheckInPage(page);
    await checkIn.open();

    await checkIn.checkIn('Mateo Rivera');

    await expect(checkIn.row('Mateo Rivera')).toContainText('Checked in');
    await expect(checkIn.signOutButton('Mateo Rivera')).toHaveCount(0);
  });
});
