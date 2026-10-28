import { test, expect } from '../../fixtures/test';
import { CheckInPage } from '../../pages/check-in.page';

// Acceptance Test
// Traces to: L2-095 criteria 1 and 6
// Description: the check-in sheet marks a child late or excused; the row says so and the totals carry it in their captions.
test.describe('Late and excused in Roll Call', () => {
  test('Given tonight’s roster, when a child is marked late from the sheet, then the row says Late and Checked in counts one late', async ({ page, api }) => {
    const checkIn = new CheckInPage(page);
    await checkIn.open();
    await checkIn.openOptions('Jordan Thompson');
    await expect(checkIn.dialog.getByRole('radio', { name: /^Late/ })).toBeVisible();
    await checkIn.expectAccessible();

    await checkIn.mark('Late');

    await expect(checkIn.row('Jordan Thompson')).toContainText(/Late · checked in \d{1,2}:\d{2}/);
    await expect(checkIn.total('Checked in')).toHaveText('1');
    await expect(checkIn.caption('Checked in')).toHaveText('1 late');
    await expect(page.getByTestId('toast').filter({ hasText: 'Jordan Thompson checked in late' })).toBeVisible();
    expect(api.attendanceRecord('e-tutoring-today', 'c-jordan')).toMatchObject({ status: 'Present', late: true });
  });

  test('Given tonight’s roster, when a child is marked excused from the sheet, then the row says Excused and Absent counts one excused', async ({ page, api }) => {
    const checkIn = new CheckInPage(page);
    await checkIn.open();
    await checkIn.openOptions('Sofía Rivera');

    await checkIn.mark('Excused');

    await expect(checkIn.row('Sofía Rivera')).toContainText('Excused');
    await expect(checkIn.total('Absent')).toHaveText('1');
    await expect(checkIn.caption('Absent')).toHaveText('1 excused');
    await expect(page.getByTestId('toast').filter({ hasText: 'Sofía Rivera marked excused' })).toBeVisible();
    expect(api.attendanceRecord('e-tutoring-today', 'c-sofia')).toMatchObject({ status: 'Absent', excused: true });
    await checkIn.expectAccessible();
  });
});
