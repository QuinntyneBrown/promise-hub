import { test, expect } from '../../fixtures/test';
import { EventsPage } from '../../pages/events.page';
import { SlipEditorPage } from '../../pages/slip-editor.page';
import { SlipsPage } from '../../pages/slips.page';
import { TodayPage } from '../../pages/today.page';

const intro = 'We’re taking the After-School Tutoring group to the Royal Botanical Gardens on Saturday 14 November.';

// L2-014 writing and sending a slip, L2-022 SMS cap, L2-007 roles, L2-005 Slips off, L2-035/L2-036 accessibility and phone layout.
test.describe('Send permission slips as a program director', () => {
  test.use({ signedInAs: 'm-marisol' });

  test('Given the field trip needs a slip, when it is written and sent now, then every child is outstanding and the event shows it sent', async ({ page }) => {
    const slip = new SlipEditorPage(page);
    await slip.open('e-rbg');
    await expect(slip.subtitle).toContainText('3 households');
    await slip.expectAccessible();
    await slip.expectNoHorizontalScroll();

    await slip.write({ body: intro, signBy: '2026-11-12' });
    await slip.when('Now');
    await slip.button('Save and send').click();

    await expect(page.getByRole('status').filter({ hasText: 'Slip sent' })).toContainText('3 households');
    await expect(slip.progress).toHaveAccessibleName('0 of 4 signed');
    await expect(slip.responses).toHaveCount(4);
    await expect(slip.response('Mateo Rivera')).toContainText('Outstanding');
    await slip.expectAccessible();

    const events = new EventsPage(page);
    await page.goto('/events/e-rbg');
    await expect(events.slipCard).toContainText('Slip sent');
  });

  test('Given no text and a deadline after the event, when Save and send is pressed, then the errors are listed and nothing is sent', async ({ page }) => {
    const slip = new SlipEditorPage(page);
    await slip.open('e-rbg');

    await slip.write({ body: '', signBy: '2026-11-20' });
    await slip.button('Save and send').click();

    await expect(slip.errorSummary).toContainText('Enter the slip text.');
    await expect(slip.fieldError('body')).toHaveText('Enter the slip text.');
    await expect(slip.fieldError('signBy')).toHaveText('Must be before Sat 14 Nov.');
    await expect(slip.progress).toHaveCount(0);
    await slip.expectAccessible();
  });

  test('Given a scheduled send, when it is cancelled and then sent now, then it stays a draft first and is sent at once', async ({ page }) => {
    const slip = new SlipEditorPage(page);
    await slip.open('e-rbg');
    await slip.write({ body: intro, signBy: '2026-11-12' });
    await slip.when('Later', '2026-11-06T17:00');
    await slip.button('Schedule').click();
    await expect(slip.scheduled).toBeVisible();
    await slip.expectAccessible();

    await slip.button('Cancel send').click();
    await expect(slip.dialog).toContainText('Cancel the scheduled send?');
    await slip.expectAccessible();
    await slip.confirm('Cancel send');
    await expect(slip.scheduled).toHaveCount(0);

    await slip.when('Later', '2026-11-06T17:00');
    await slip.button('Schedule').click();
    await slip.button('Send now').click();
    await slip.confirm('Send now');

    await expect(slip.progress).toHaveAccessibleName('0 of 4 signed');
  });

  test('Given answers have come in, when the slip opens, then signed, declined and outstanding are tracked and listed', async ({ page, api }) => {
    api.sendSlip('e-rbg');
    api.answerSlip('e-rbg', 'c-mateo', 'Signed');
    api.answerSlip('e-rbg', 'c-jordan', 'Declined', 'Dana Thompson');
    const slip = new SlipEditorPage(page);

    await slip.open('e-rbg');

    await expect(slip.count('Signed')).toHaveText('1');
    await expect(slip.count('Declined')).toHaveText('1');
    await expect(slip.count('Outstanding')).toHaveText('2');
    await expect(slip.response('Jordan Thompson')).toContainText('Declined');
    const slips = new SlipsPage(page);
    await slips.open();
    await expect(slips.row('Fall field trip')).toContainText('1 of 4 signed');
    await expect(slips.row('Fall field trip')).toContainText('3 unsigned');
    await slips.expectAccessible();
  });

  test('Given a guardian signed, when a material change is saved, then everyone signs again', async ({ page, api }) => {
    api.sendSlip('e-rbg');
    api.answerSlip('e-rbg', 'c-mateo', 'Signed');
    const slip = new SlipEditorPage(page);
    await slip.open('e-rbg');
    await expect(slip.notice('1 guardian has already signed this text')).toBeVisible();

    await slip.write({ body: `${intro} We will also swim.` });
    await slip.markMaterial();
    await slip.button('Save changes').click();

    await expect(page.getByRole('status').filter({ hasText: 'Slip updated' })).toContainText('Everyone signs again');
    await expect(slip.count('Signed')).toHaveText('0');
    await expect(slip.subtitle).toContainText('Version 2');
  });

  test('Given the SMS cap is reached, when the slip is sent, then the sender sees which households got email only', async ({ page, api }) => {
    api.setSmsUsed('org-harbourview', 2000);
    const slip = new SlipEditorPage(page);
    await slip.open('e-rbg');

    await slip.write({ body: intro, signBy: '2026-11-12' });
    await slip.button('Save and send').click();

    await expect(slip.notice('3 households got email only: Haddad, Rivera, Thompson.')).toBeVisible();
  });
});

test.describe('Slips for other roles and modules', () => {
  test.describe('as a volunteer coordinator', () => {
    test.use({ signedInAs: 'm-priya-hyc' });

    test('Given a draft slip, when she opens it, then she can read it but not send it', async ({ page }) => {
      const slip = new SlipEditorPage(page);

      await slip.open('e-rbg');

      await expect(slip.notice('Only directors and site leads write and send slips.')).toBeVisible();
      await expect(slip.button('Save and send')).toHaveCount(0);
      await slip.expectAccessible();
    });
  });

  test('Given Permission slips is off, when a slip is opened directly, then Today opens', async ({ page, api }) => {
    api.setModules('org-harbourview', ['Roster', 'RollCall', 'QuickCards']);

    await page.goto('/events/e-rbg/slip');

    await expect(page).toHaveURL(/\/$/);
    await expect(new TodayPage(page).heading).toBeVisible();
  });
});
