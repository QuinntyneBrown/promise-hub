import { test, expect } from '../../fixtures/test';
import { LearningBondAgreementPage } from '../../pages/learning-bond-agreement.page';
import { LearningBondSignerPage } from '../../pages/learning-bond-signer.page';
import { NotificationsPage } from '../../pages/notifications.page';

const northgate = 'Northgate Community Church Kids';
const angela = { name: 'Rev. Angela Baptiste', title: 'Board chair', email: 'angela.baptiste@northgate.example' };

// L2-137 the named signer's own page behind the emailed link (ADR 0078): no sign-in, served while Learning Bond is off.
test.describe('Learning Bond signer page', () => {
  test.use({ signedInAs: null });

  // L2-137 criterion 8 (learning-bond-agreement/signer).
  test('Given Grace named Angela at Northgate, when Angela opens the link, then she reads the agreement with the authority box and the library never loads', async ({ page, api }) => {
    const token = api.learningBond.nameSigner('m-grace', angela);
    const signer = new LearningBondSignerPage(page);
    const library = signer.recordLibraryLoads();

    await signer.openLink(token);

    await expect(signer.heading).toHaveText(`Accept the Learning Bond data-handling agreement for ${northgate}`);
    await expect(signer.requestedBy).toHaveText('Grace Mensah asked you, as Board chair, to accept it. No PromiseHub account is needed.');
    expect(await signer.sectionTitles()).toEqual(['What we collect', 'Where it goes', 'What your organization sees']);
    await expect(signer.authority('Rev. Angela Baptiste', northgate)).not.toBeChecked();
    await expect(signer.acceptButton).toBeVisible();
    expect(library.loaded).toBe(false);
    await signer.expectAccessible();
    await signer.expectNoHorizontalScroll();
  });

  // L2-137 criterion 8 (learning-bond-agreement/signer-invalid).
  test('Given Angela chooses Accept without the box, then the reason shows beside it and nothing is accepted', async ({ page, api }) => {
    const token = api.learningBond.nameSigner('m-grace', angela);
    const signer = new LearningBondSignerPage(page);
    await signer.openLink(token);

    await signer.accept();

    await expect(signer.authorityError).toHaveText(`Confirm you have authority to accept this agreement for ${northgate}.`);
    expect(api.learningBond.hasAccepted('org-northgate')).toBe(false);
    await signer.expectAccessible();
  });

  // L2-137 criterion 2 (learning-bond-agreement/signer-accepted, signer-expired).
  test('Given Angela ticks the box and accepts, then the page thanks her with what was recorded and the link stops working', async ({ page, api }) => {
    const token = api.learningBond.nameSigner('m-grace', angela);
    const signer = new LearningBondSignerPage(page);
    await signer.openLink(token);

    await signer.authority('Rev. Angela Baptiste', northgate).check();
    await signer.accept();

    await expect(signer.heading).toHaveText('Thank you, Rev. Angela Baptiste');
    await expect(signer.accepted).toContainText('Accepted on Thu 5 Nov 2026 at 4:30 pm, version 2');
    await expect(signer.accepted).toContainText('Recorded as Rev. Angela Baptiste, Board chair, angela.baptiste@northgate.example. Grace Mensah has been told. You can close this page.');
    expect(api.learningBond.hasAccepted('org-northgate')).toBe(true);
    expect(api.learningBond.adminEmails).toEqual([{ to: 'grace@northgate.example', subject: 'Rev. Angela Baptiste accepted the Learning Bond agreement' }]);
    await signer.expectAccessible();

    await signer.openLink(token);
    await signer.expectExpired(`Ask ${northgate} to send a new one.`);
    await signer.expectAccessible();
  });
});

test.describe('Learning Bond signer page, seen by the admin who asked', () => {
  test.use({ signedInAs: 'm-grace' });
  test.beforeEach(({ api }) => api.setModules('org-northgate', ['Roster', 'RollCall', 'QuickCards', 'Messages']));

  // L2-137 criterion 2: Grace is told in the app, and the agreement shows Angela's acceptance.
  test('Given Angela accepted Northgate’s link, then Grace has a notice and the agreement shows who accepted', async ({ page, api }) => {
    const token = api.learningBond.nameSigner('m-grace', angela);
    const signer = new LearningBondSignerPage(page);
    await signer.openLink(token);
    await signer.authority('Rev. Angela Baptiste', northgate).check();
    await signer.accept();
    await expect(signer.accepted).toBeVisible();

    const notifications = new NotificationsPage(page);
    await notifications.open();
    await expect(notifications.item('Rev. Angela Baptiste, Board chair, accepted the Learning Bond data-handling agreement version 2.')).toBeVisible();

    const agreement = new LearningBondAgreementPage(page);
    await agreement.open();
    await expect(agreement.accepted).toContainText('Accepted by Rev. Angela Baptiste on Thu 5 Nov 2026, version 2');
    await expect(agreement.turnOn).toBeVisible();
    await agreement.expectAccessible();
  });
});
