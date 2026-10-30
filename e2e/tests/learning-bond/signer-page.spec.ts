import { test, expect } from '../../fixtures/test';
import { LearningBondSignerPage } from '../../pages/learning-bond-signer.page';

const northgate = 'Northgate Community Church Kids';
const angela = { name: 'Rev. Angela Baptiste', title: 'Board chair', email: 'angela.baptiste@northgate.example' };

// L2-137 the named signer's own page behind the emailed link (ADR 0078): no sign-in, served while Learning Bond is off.
test.describe('Learning Bond signer page', () => {
  test.use({ signedInAs: null });

  // L2-137 criterion 8 (learning-bond-agreement/signer).
  test('Given Grace named Angela at Northgate, when Angela opens the link, then she reads the agreement with the authority box and the library never loads', async ({ page, api }) => {
    const token = api.learningBond.nameSigner('org-northgate', 'Grace Mensah', angela);
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
    const token = api.learningBond.nameSigner('org-northgate', 'Grace Mensah', angela);
    const signer = new LearningBondSignerPage(page);
    await signer.openLink(token);

    await signer.accept();

    await expect(signer.authorityError).toHaveText(`Confirm you have authority to accept this agreement for ${northgate}.`);
    expect(api.learningBond.hasAccepted('org-northgate')).toBe(false);
    await signer.expectAccessible();
  });
});
