import { test, expect } from '../../fixtures/test';
import { LearningBondAgreementPage } from '../../pages/learning-bond-agreement.page';

const angela = { name: 'Rev. Angela Baptiste', title: 'Board chair', email: 'angela.baptiste@northgate.example' };

// L2-137 an admin names the person who accepts the agreement: one open request per organization, Waiting for, Resend and Cancel.
// The signer's own page behind the emailed link is in signer-page.spec.ts.
test.describe('Learning Bond named signer', () => {
  test.use({ signedInAs: 'm-grace' });
  test.beforeEach(({ api }) => api.setModules('org-northgate', ['Roster', 'RollCall', 'QuickCards', 'Messages']));

  // L2-137 criterion 1 (learning-bond-signer/default, learning-bond-agreement/waiting-signer).
  test('Given Grace names a signer, when she sends the link, then it is emailed from Northgate and the page waits for them', async ({ page, api }) => {
    const agreement = new LearningBondAgreementPage(page);
    await agreement.open();

    await agreement.askSigner(angela);
    await agreement.expectAccessible();
    await agreement.sendTheLink();

    await expect(agreement.signerDialog).toBeHidden();
    await expect(agreement.waiting).toContainText('Waiting for Rev. Angela Baptiste to sign.');
    await expect(agreement.waiting).toContainText('Board chair · angela.baptiste@northgate.example · emailed Thu 5 Nov');
    await expect(agreement.waiting).toContainText('The link works for 14 days.');
    await expect(agreement.acceptButton).toHaveCount(0);
    expect(api.learningBond.signerEmails).toEqual([
      { to: 'angela.baptiste@northgate.example', subject: 'Northgate Community Church Kids via PromiseHub: please accept the Learning Bond data-handling agreement' },
    ]);
    await agreement.expectAccessible();
    await agreement.expectNoHorizontalScroll();
  });

  // L2-137 criterion 4 (learning-bond-signer/invalid).
  test('Given the fields are empty or the email is not one, when the link is sent, then each field says what to fix and nothing is sent', async ({ page, api }) => {
    const agreement = new LearningBondAgreementPage(page);
    await agreement.open();

    await agreement.askSigner({ name: '', title: '', email: 'angela' });
    await agreement.sendTheLink();

    await expect(agreement.signerFieldError('name')).toHaveText('Enter the signer’s name.');
    await expect(agreement.signerFieldError('title')).toHaveText('Enter the signer’s role or title.');
    await expect(agreement.signerFieldError('email')).toHaveText('Enter an email like name@example.org.');
    expect(api.learningBond.signerEmails).toEqual([]);
    await agreement.expectAccessible();
  });

  // L2-137 criterion 11 (learning-bond-email/info).
  test('Given a signer is waiting, when Grace chooses See the email, then the email Angela received is shown and Escape closes it', async ({ page }) => {
    const agreement = new LearningBondAgreementPage(page);
    await agreement.open();
    await agreement.askSigner(angela);
    await agreement.sendTheLink();
    await expect(agreement.waiting).toBeVisible();

    await agreement.seeTheEmail();

    await expect(agreement.emailPart('title')).toHaveText('Grace Mensah asked you to accept the Learning Bond data-handling agreement');
    await expect(agreement.emailPart('text')).toContainText('Hello Rev. Angela Baptiste. Northgate Community Church Kids wants to offer Learning Bond');
    await expect(agreement.emailPart('text')).toContainText('Grace Mensah named you, as Board chair. No PromiseHub account is needed. The link works once, for 14 days.');
    await expect(agreement.emailPart('footer')).toHaveText('Northgate Community Church Kids via PromiseHub');
    await agreement.expectAccessible();

    await page.keyboard.press('Escape');
    await expect(agreement.emailDialog).toBeHidden();
  });

  // L2-137 criterion 6.
  test('Given a signer is waiting, when Grace resends and then cancels, then a new link goes out and the page offers Accept again', async ({ page, api }) => {
    const agreement = new LearningBondAgreementPage(page);
    await agreement.open();
    await agreement.askSigner(angela);
    await agreement.sendTheLink();
    await expect(agreement.waiting).toBeVisible();

    await agreement.resend();
    await expect(agreement.toast.last()).toContainText('Link sent again to Rev. Angela Baptiste');
    expect(api.learningBond.signerEmails).toHaveLength(2);

    await agreement.cancelSigner();
    await expect(agreement.waiting).toHaveCount(0);
    await expect(agreement.acceptButton).toBeVisible();
    await expect(agreement.askSomeoneElse).toBeVisible();
  });
});
