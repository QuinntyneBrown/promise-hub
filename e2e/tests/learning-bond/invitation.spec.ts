import { test, expect } from '../../fixtures/test';
import { LearningBondInvitationPage } from '../../pages/learning-bond-invitation.page';

// L2-139 the invitation is platform text in English, Spanish and French, previewed in the languages the organization's households use,
// and only a validated sender name is edited. Harbourview's households use English, Spanish and French.
test.describe('Learning Bond guardian invitation', () => {
  test.describe('Tom at Harbourview', () => {
    test.use({ signedInAs: 'm-tom' });

    // L2-139 criteria 1 and 5 (learning-bond-invitation/default).
    test('Given no sender name is saved, then the previews use the organization’s name in each language its households use', async ({ page }) => {
      const invitation = new LearningBondInvitationPage(page);

      await invitation.open();

      await invitation.expectShown();
      await expect(invitation.senderName).toHaveValue('Harbourview Youth Collective');
      expect(await invitation.previewedLanguages()).toEqual(['English', 'Spanish', 'French']);
      await expect(invitation.sms('English')).toHaveText(
        'Harbourview Youth Collective: Maya may be owed up to $2,000 for school after high school. It costs nothing. Tap to check: promisehub.ca/lb/4r7k9x (STOP to opt out)',
      );
      await expect(invitation.segments('English')).toHaveText('2 SMS segments');
      await expect(invitation.sms('Spanish')).toContainText('Maya podría tener derecho a hasta $2,000');
      await expect(invitation.emailFooter('English')).toHaveText('Harbourview Youth Collective via PromiseHub · Harbourview Youth Collective, Hamilton · Unsubscribe');
      await invitation.expectAccessible();
      await invitation.expectNoHorizontalScroll();
    });

    // L2-139 criterion 2 (learning-bond-invitation/success).
    test('Given Tom types a new sender name, then every preview follows it, and saving confirms it and is audited', async ({ page, api }) => {
      const invitation = new LearningBondInvitationPage(page);
      await invitation.open();

      await invitation.senderName.fill('Harbourview After-School');

      await expect(invitation.sms('French')).toHaveText(/^Harbourview After-School : Maya/);
      await invitation.save();
      await expect(invitation.toast).toContainText('Sender name saved');
      await expect(invitation.toast).toContainText('Invitations come from Harbourview After-School');
      expect(api.learningBond.settingsOf('org-harbourview').senderName).toBe('Harbourview After-School');
      expect(api.learningBond.settingsAudit).toEqual([{ organizationId: 'org-harbourview', summary: 'Learning Bond settings changed: SenderName' }]);
      await invitation.expectAccessible();
    });

    // L2-139 criterion 3 (learning-bond-invitation/invalid).
    test('Given a sender name with a link in it, when saved, then the one rule shows beside the field and nothing changes', async ({ page, api }) => {
      const invitation = new LearningBondInvitationPage(page);
      await invitation.open();

      await invitation.senderName.fill('Harbourview hbv.ph/join');
      await invitation.save();

      await expect(invitation.senderError).toHaveText('Use 1 to 30 letters, numbers and spaces.');
      expect(api.learningBond.settings.has('org-harbourview')).toBe(false);
      await invitation.expectAccessible();
    });
  });

  test.describe('Learning Bond off at Northgate', () => {
    test.use({ signedInAs: 'm-grace' });

    // L2-139 criterion 6.
    test('Given Learning Bond is off, when the invitation is opened, then Today opens and the API answers 404', async ({ page }) => {
      const invitation = new LearningBondInvitationPage(page);

      await invitation.open();

      await expect(page).toHaveURL(/\/$/);
      expect(await invitation.apiStatus('/learning-bond/invitation')).toBe(404);
    });
  });

  test.describe('A site lead', () => {
    test.use({ signedInAs: 'm-jaylen' });

    // L2-139 criterion 6 (learning-bond-invitation/forbidden).
    test('Given Jaylen has no ManageSettings, when the invitation is opened, then it says admins edit it', async ({ page }) => {
      const invitation = new LearningBondInvitationPage(page);

      await invitation.open();

      await expect(invitation.forbidden).toBeVisible();
      await invitation.expectAccessible();
    });
  });
});
