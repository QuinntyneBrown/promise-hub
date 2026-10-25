import { test, expect } from '../../fixtures/test';
import { CheckInPage } from '../../pages/check-in.page';

// L2-018 criteria 1 and 2 no-show texts and replies on the roster, L2-035/L2-036 accessibility and phone layout.
test.describe('Follow up no-shows as a site lead', () => {
  test('Given the no-show texts went out, when Jaylen opens the roster, then each missing child shows the text and any reply', async ({ page, api }) => {
    api.noShowAlert('e-tutoring-today', 'c-jordan');
    api.noShowAlert('e-tutoring-today', 'c-yusuf', 'OnTheWay');
    api.noShowAlert('e-tutoring-today', 'c-sofia', 'Absent');
    const checkIn = new CheckInPage(page);

    await checkIn.open();

    await expect(checkIn.noShowNote('Jordan Thompson')).toHaveText(/^Guardian texted/);
    await expect(checkIn.noShowNote('Yusuf Haddad')).toHaveText(/^On the way · guardian replied/);
    await expect(checkIn.noShowNote('Sofía Rivera')).toHaveText(/^Absent · guardian replied/);
    await expect(checkIn.noShowNote('Mateo Rivera')).toHaveCount(0);
    await checkIn.expectAccessible();
    await checkIn.expectNoHorizontalScroll();
  });
});
