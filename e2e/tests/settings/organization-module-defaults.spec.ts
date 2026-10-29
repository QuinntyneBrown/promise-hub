import { test, expect } from '../../fixtures/test';
import type { ModuleId } from '../../fixtures/seed';
import { SettingsOrganizationPage } from '../../pages/settings-organization.page';
import { SettingsPrivacyPage } from '../../pages/settings-privacy.page';

// Acceptance Test
// Traces to: L2-124 criteria 1 to 4, L2-125 criteria 1, 2 and 5, L2-126 criteria 1 to 4, L2-005, L2-035
// Description: Settings › Organization shows the defaults of Learning, Mentoring and Public website only while their module is on.
const HARBOURVIEW: ModuleId[] = [
  'Roster',
  'Slips',
  'RollCall',
  'QuickCards',
  'Pickup',
  'Messages',
  'Incidents',
  'Reports',
  'Learning',
  'Mentoring',
];

test.describe('Configure module defaults', () => {
  test.use({ signedInAs: 'm-tom' });

  test('Given Learning is on, when Tom edits the consent policy from the Learning card, then it saves and Privacy shows the same policy', async ({
    page,
  }) => {
    const settings = new SettingsOrganizationPage(page);
    await settings.open();
    await expect(settings.fact('consent-age')).toContainText('18 years');

    await settings.editConsentPolicy();
    await settings.saveConsentPolicy(
      '16 years',
      'We agree that our child may join lessons and mentoring at Harbourview.',
    );

    await expect(settings.toast).toContainText('Consent policy saved');
    await expect(settings.fact('consent-age')).toContainText('16 years');
    const privacy = new SettingsPrivacyPage(page);
    await privacy.open();
    await expect(privacy.consentAge).toContainText('16 years');
  });

  test('Given Learning is off, then the Learning card is not rendered, its settings are never requested and the API answers 404', async ({
    page,
    api,
  }) => {
    api.setModules('org-harbourview', ['Roster', 'RollCall', 'Mentoring']);
    const settings = new SettingsOrganizationPage(page);
    const requested = settings.recordApiPaths();

    await settings.open();

    await expect(settings.card('Profile')).toBeVisible();
    await expect(settings.card('Learning')).toHaveCount(0);
    expect(requested).not.toContain('/api/settings/learning');
    expect(await settings.apiStatus('/settings/learning')).toBe(404);
  });

  test('Given Mentoring is on, when Tom changes how often mentors check in to every 7 days, then it saves with a toast and is audited', async ({
    page,
    api,
  }) => {
    const settings = new SettingsOrganizationPage(page);
    await settings.open();
    await expect(settings.fact('check-in-days')).toContainText('Every 14 days');

    await settings.editMentoringDefaults();
    await settings.expectAccessible();
    await settings.saveCheckInCadence('Every 7 days');

    await expect(settings.toast).toContainText('Mentoring defaults saved');
    await expect(settings.fact('check-in-days')).toContainText('Every 7 days');
    expect(api.auditOf('MentoringSettings').at(-1)?.action).toBe('Updated');
  });

  test('Given the mentoring defaults fail to save, then the dialog says nothing changed', async ({
    page,
    api,
  }) => {
    const settings = new SettingsOrganizationPage(page);
    await settings.open();
    await settings.editMentoringDefaults();
    api.failNext('/api/settings/mentoring', 500);

    await settings.saveCheckInCadence('Every 21 days');

    await expect(settings.failedIn(settings.mentoringDialog)).toBeVisible();
  });

  test('Given Mentoring is off, then the Mentoring card is not rendered, its settings are never requested and the API answers 404', async ({
    page,
    api,
  }) => {
    api.setModules('org-harbourview', ['Roster', 'RollCall', 'Learning']);
    const settings = new SettingsOrganizationPage(page);
    const requested = settings.recordApiPaths();

    await settings.open();

    await expect(settings.card('Learning')).toBeVisible();
    await expect(settings.card('Mentoring')).toHaveCount(0);
    expect(requested).not.toContain('/api/settings/mentoring');
    expect(await settings.apiStatus('/settings/mentoring')).toBe(404);
  });

  test('Given Public website is on, when Tom saves a new address and profile, then the card shows them and the site moves to the new address', async ({
    page,
    api,
  }) => {
    api.setModules('org-harbourview', [...HARBOURVIEW, 'PublicWebsite']);
    const settings = new SettingsOrganizationPage(page);
    await settings.open();
    await expect(settings.fact('site-address')).toContainText('/site/harbourview');
    await expect(settings.fact('site-tagline')).toContainText('Not written yet');

    await settings.editWebsiteProfile();
    await settings.expectAccessible();
    await settings.fillWebsiteProfile({
      slug: 'harbourview-youth',
      tagline: 'Tutoring, sports and mentoring for Hamilton kids, after school and on Saturdays.',
      about:
        'Free after-school tutoring, Saturday sports and one-to-one mentoring in Hamilton’s north end.',
      email: 'hello@harbourview.example',
    });
    await settings.saveWebsiteProfile();

    await expect(settings.toast).toContainText('Website profile saved');
    await expect(settings.toast).toContainText('Your site is at /site/harbourview-youth.');
    await expect(settings.fact('site-address')).toContainText('/site/harbourview-youth');
    await expect(settings.fact('site-tagline')).toContainText('Tutoring, sports and mentoring');
    await expect(settings.fact('site-email')).toContainText('hello@harbourview.example');
    expect(await settings.publicSiteStatus('harbourview-youth')).toBe(200);
    expect(await settings.publicSiteStatus('harbourview')).toBe(404);
  });

  test('Given an address with capitals and spaces and no tagline, then the dialog says why with a summary', async ({
    page,
    api,
  }) => {
    api.setModules('org-harbourview', [...HARBOURVIEW, 'PublicWebsite']);
    const settings = new SettingsOrganizationPage(page);
    await settings.open();

    await settings.editWebsiteProfile();
    await settings.fillWebsiteProfile({ slug: 'Harbourview Youth', tagline: '' });
    await settings.saveWebsiteProfile();

    const dialog = settings.websiteDialog;
    await expect(settings.summaryIn(dialog)).toBeVisible();
    await expect(settings.dialogError(dialog, 'site-slug')).toHaveText(
      'Use 3 to 40 lowercase letters, numbers and hyphens, starting with a letter.',
    );
    await expect(settings.dialogError(dialog, 'site-tagline')).toHaveText(
      'Write a tagline of up to 120 characters.',
    );
    await settings.expectAccessible();
  });

  test('Given the address Northgate uses, then it is refused and nothing changes', async ({
    page,
    api,
  }) => {
    api.setModules('org-harbourview', [...HARBOURVIEW, 'PublicWebsite']);
    const settings = new SettingsOrganizationPage(page);
    await settings.open();

    await settings.editWebsiteProfile();
    await settings.fillWebsiteProfile({
      slug: 'northgate',
      tagline: 'Tutoring and sports for Hamilton kids.',
    });
    await settings.saveWebsiteProfile();

    await expect(settings.dialogError(settings.websiteDialog, 'site-slug')).toHaveText(
      'Another organization uses this address. Choose another.',
    );
  });

  test('Given Public website is off, then its card is not rendered and the API answers 404', async ({
    page,
  }) => {
    const settings = new SettingsOrganizationPage(page);
    const requested = settings.recordApiPaths();

    await settings.open();

    await expect(settings.card('Mentoring')).toBeVisible();
    await expect(settings.card('Public website')).toHaveCount(0);
    expect(requested).not.toContain('/api/settings/website');
    expect(await settings.apiStatus('/settings/website')).toBe(404);
  });

  test.describe('at Northgate', () => {
    test.use({ signedInAs: 'm-grace' });

    test('Given Learning, Mentoring and Public website are off, then only the profile shows and nothing about them is requested', async ({
      page,
    }) => {
      const settings = new SettingsOrganizationPage(page);
      const requested = settings.recordApiPaths();

      await settings.open();

      await expect(settings.fact('name')).toContainText('Northgate Community Church Kids');
      await expect(settings.card('Learning')).toHaveCount(0);
      await expect(settings.card('Mentoring')).toHaveCount(0);
      await expect(settings.card('Public website')).toHaveCount(0);
      expect(requested.filter((p) => /settings\/(learning|mentoring|website)/.test(p))).toEqual([]);
      await settings.expectAccessible();
    });
  });
});
