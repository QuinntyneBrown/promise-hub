import { test, expect } from '../../fixtures/test';
import { GuardianLearningBondPage } from '../../pages/guardian-learning-bond.page';

// L2-150 criterion 1: after Submit, what was sent, to whom, the estimate, what happens next and the expected deposit window.
test.describe('A guardian sees the submitted Learning Bond application', () => {
  test.use({ signedInAs: null });
  test.beforeEach(({ api }) => {
    api.setHouseholdLanguage('hh-rivera', 'English');
    api.learningBond.links.set('tok-lb-rivera', { householdId: 'hh-rivera', organizationId: 'org-harbourview', language: 'en' });
    api.trustGuardianDevice('hh-rivera');
    api.learningBond.consents.push({ householdId: 'hh-rivera', childId: 'c-mateo', typedName: 'Carmen Rivera', language: 'en', wordingVersion: 1 });
    api.learningBond.claims.set('c-mateo', { childLast3: '459', recordFix: null });
    api.learningBond.intakes.set('hh-rivera', { guardianLast3: '212', taxFiled: 'Yes' });
  });

  // L2-150 criterion 1 (learning-bond-review/success, learning-bond-submitted/default).
  test('Given Carmen submits Mateo’s application, when she opens what happens next, then she sees where it went and when to expect the deposit', async ({ page }) => {
    const learningBond = new GuardianLearningBondPage(page);
    await learningBond.openReview('tok-lb-rivera', 'c-mateo');
    await learningBond.editField('Address', '42 Barton St E, Apt 3, Hamilton ON L8L 2V6');
    await learningBond.submitButton('Northfield Credit Union').click();
    await page.getByRole('link', { name: 'See what happens next' }).click();

    await expect(learningBond.heading).toHaveText('Sent to Northfield Credit Union on Thu 5 Nov 2026');
    await expect(learningBond.nextSteps).toHaveCount(3);
    await expect(learningBond.nextSteps.first()).toContainText('Northfield Credit Union opens Mateo’s RESP and confirms it received the application');
    await expect(learningBond.depositWindow).toHaveText('Expected Jan 15 – Feb 28, 2027');
    await expect(learningBond.sentField('Mateo’s SIN')).toContainText('••• ••• 459');
    await expect(page.getByText('Estimate up to $1,400')).toBeVisible();
    await learningBond.expectAccessible();
  });

  // L2-150 criterion 2 (learning-bond-submitted/received, deposited).
  test('Given Northfield reported the deposit, when Carmen opens the page, then the amount and every step are done', async ({ page, api }) => {
    api.learningBond.applications.set('app-c-mateo', {
      childId: 'c-mateo',
      householdId: 'hh-rivera',
      province: 'ON',
      provider: 'Northfield Credit Union',
      phone: '905-555-0142',
      email: 'carmen.rivera@example.com',
      address: '42 Barton St E, Apt 3, Hamilton ON L8L 2V6',
      reviewVersion: 2,
      status: 'Deposited',
      depositAmount: 1400,
    });
    const learningBond = new GuardianLearningBondPage(page);
    await learningBond.openSubmitted('tok-lb-rivera', 'c-mateo');

    await expect(learningBond.progressNotice).toContainText('$1,400 was deposited in Mateo’s RESP');
    await expect(learningBond.nextSteps.filter({ hasText: 'Done' })).toHaveCount(3);
    await learningBond.expectAccessible();
  });

  // L2-150 criterion 6 (learning-bond-submitted/document-needed, document-invalid, document-sending).
  test('Given Northfield needs proof of address, when Carmen chooses a PDF and taps Send, then it goes to Northfield once and only then', async ({ page, api }) => {
    api.learningBond.applications.set('app-c-mateo', {
      childId: 'c-mateo',
      householdId: 'hh-rivera',
      province: 'ON',
      provider: 'Northfield Credit Union',
      phone: '905-555-0142',
      email: 'carmen.rivera@example.com',
      address: '42 Barton St E, Apt 3, Hamilton ON L8L 2V6',
      reviewVersion: 2,
      status: 'Received',
      document: { id: 'doc-1', name: 'proof of address', fileName: null, sentAt: null },
    });
    const learningBond = new GuardianLearningBondPage(page);
    await learningBond.openSubmitted('tok-lb-rivera', 'c-mateo');

    await expect(learningBond.progressNotice).toContainText('Northfield Credit Union needs proof of address for Mateo');
    await learningBond.expectAccessible();
    await learningBond.chooseDocument('notes.txt', 'text/plain');
    await expect(learningBond.documentRequest).toContainText('Choose a PDF, JPEG or PNG up to 10 MB.');
    await learningBond.chooseDocument('hydro-bill-oct.pdf', 'application/pdf');
    await expect(learningBond.documentRequest).toContainText('hydro-bill-oct.pdf');
    expect(api.learningBond.documentsSent).toEqual([]);

    await page.getByRole('button', { name: 'Send to Northfield Credit Union' }).click();

    await expect(learningBond.documentSent).toContainText('Proof of address went to Northfield Credit Union.');
    expect(api.learningBond.documentsSent).toEqual([{ documentId: 'doc-1', fileName: 'hydro-bill-oct.pdf' }]);
  });

  // L2-150 criterion 1: nothing to show before Submit.
  test('Given Mateo’s application isn’t sent yet, when Carmen opens the submitted page, then it says so and links back to the review', async ({ page }) => {
    const learningBond = new GuardianLearningBondPage(page);
    await learningBond.openSubmitted('tok-lb-rivera', 'c-mateo');

    await expect(learningBond.heading).toHaveText('This application isn’t sent yet');
    await expect(page.getByRole('link', { name: 'Back to the review' })).toBeVisible();
  });
});
