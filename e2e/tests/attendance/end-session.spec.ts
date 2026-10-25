import { test, expect } from '../../fixtures/test';
import { CheckInPage } from '../../pages/check-in.page';

// L2-018 criteria 4 and 9 ending a session with notes, L2-035/L2-036 accessibility and phone layout.
test.describe('End a session as a site lead', () => {
  test('Given Mateo checked in and the rest not, when Jaylen ends the session marking absences and signing out, then it is recorded and read-only', async ({ page }) => {
    const checkIn = new CheckInPage(page);
    await checkIn.open();
    await checkIn.checkIn('Mateo Rivera');

    await checkIn.endSessionButton.click();
    await checkIn.expectAccessible();
    await checkIn.dialog.getByRole('button', { name: 'Cancel' }).click();
    await checkIn.endSession('Mark absent', /^Sign out to a guardian/);

    await expect(checkIn.recorded).toContainText('1 present, 3 absent');
    await expect(checkIn.checkInButton('Sofía Rivera')).toHaveCount(0);
    await expect(checkIn.endSessionButton).toHaveCount(0);
    await checkIn.expectAccessible();
    await checkIn.expectNoHorizontalScroll();
  });

  test('Given the session ended, when Jaylen saves notes, then they are on the session for the next site lead', async ({ page }) => {
    const checkIn = new CheckInPage(page);
    await checkIn.open();
    await checkIn.endSession('Leave as not recorded', /^Leave unsigned/);

    await checkIn.saveNotes('Room 2 projector is broken again.');

    await expect(checkIn.notes).toContainText('Room 2 projector is broken again.');
  });
});
