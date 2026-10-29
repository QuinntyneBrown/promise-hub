import { expect, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

/** Settings › Organization (mock: settings-organization): the profile and logo, then a card per module default while its module is on. */
export class SettingsOrganizationPage extends BasePage {
  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Organization' });
  }

  async open(path = '/settings/organization'): Promise<void> {
    await super.open(path);
    await expect(this.heading).toBeVisible();
  }

  get currentTab(): Locator {
    return this.page
      .getByRole('navigation', { name: 'Settings sections' })
      .locator('[aria-current="page"]');
  }

  card(title: 'Profile' | 'Learning' | 'Mentoring' | 'Public website'): Locator {
    return this.page.getByRole('region', { name: title, exact: true });
  }

  fact(key: string): Locator {
    return this.page.getByTestId(`fact-${key}`);
  }

  /** The newest toast. */
  get toast(): Locator {
    return this.page.getByTestId('toast').last();
  }

  get forbidden(): Locator {
    return this.page.getByRole('heading', {
      name: 'Admins set up the organization',
    });
  }

  get loadError(): Locator {
    return this.page.getByRole('heading', {
      name: 'We couldn’t load your organization’s settings',
    });
  }

  get profileDialog(): Locator {
    return this.page.getByRole('dialog', { name: 'Edit organization profile' });
  }

  async editProfile(): Promise<void> {
    await this.page.getByRole('button', { name: 'Edit profile' }).click();
    await expect(this.profileDialog).toBeVisible();
  }

  /** Fills the profile dialog; a null leaves the field as it is. */
  async fillProfile(p: {
    name?: string;
    city?: string;
    contactEmail?: string;
    phone?: string;
    timeZone?: string;
  }): Promise<void> {
    const d = this.profileDialog;
    if (p.name !== undefined) await d.getByLabel('Organization name').fill(p.name);
    if (p.city !== undefined) await d.getByLabel('City').fill(p.city);
    if (p.contactEmail !== undefined) await d.getByLabel(/^Contact email/).fill(p.contactEmail);
    if (p.phone !== undefined) await d.getByLabel(/^Phone/).fill(p.phone);
    if (p.timeZone !== undefined)
      await d.getByLabel('Time zone').selectOption({ label: p.timeZone });
  }

  async saveProfile(): Promise<void> {
    await this.profileDialog.getByRole('button', { name: 'Save profile' }).click();
  }

  dialogError(dialog: Locator, field: string): Locator {
    return dialog.locator(`#${field}-error`);
  }

  summaryIn(dialog: Locator): Locator {
    return dialog.getByRole('alert').filter({ hasText: 'Fix these to continue' });
  }

  failedIn(dialog: Locator): Locator {
    return dialog.getByRole('alert').filter({ hasText: 'That didn’t go through' });
  }

  get logoImage(): Locator {
    return this.card('Profile').getByRole('img', { name: /logo$/ });
  }

  get logoDropZone(): Locator {
    return this.card('Profile').getByRole('group', { name: /your logo$/ });
  }

  get logoError(): Locator {
    return this.card('Profile').getByTestId('logo-file-error');
  }

  get logoFailed(): Locator {
    return this.card('Profile').getByRole('alert').filter({ hasText: 'The upload didn’t finish' });
  }

  async chooseLogo(name: string, mimeType: string, buffer: Buffer): Promise<void> {
    await this.card('Profile').getByLabel('Choose image').setInputFiles({ name, mimeType, buffer });
  }

  async removeLogo(): Promise<void> {
    await this.card('Profile').getByRole('button', { name: 'Remove logo' }).click();
  }

  get consentPolicyDialog(): Locator {
    return this.page.getByRole('dialog', { name: 'Edit consent policy' });
  }

  async editConsentPolicy(): Promise<void> {
    await this.card('Learning').getByRole('button', { name: 'Edit consent policy' }).click();
    await expect(this.consentPolicyDialog).toBeVisible();
  }

  async saveConsentPolicy(age: string, wording: string): Promise<void> {
    await this.consentPolicyDialog.getByLabel('Consent needed under').selectOption({ label: age });
    await this.consentPolicyDialog.getByLabel('Wording guardians sign').fill(wording);
    await this.consentPolicyDialog.getByRole('button', { name: 'Save policy' }).click();
  }

  get mentoringDialog(): Locator {
    return this.page.getByRole('dialog', { name: 'Edit mentoring defaults' });
  }

  async editMentoringDefaults(): Promise<void> {
    await this.card('Mentoring').getByRole('button', { name: 'Edit mentoring defaults' }).click();
    await expect(this.mentoringDialog).toBeVisible();
  }

  async saveCheckInCadence(label: string): Promise<void> {
    await this.mentoringDialog
      .getByLabel('Mentors check in with each youth')
      .selectOption({ label });
    await this.mentoringDialog.getByRole('button', { name: 'Save defaults' }).click();
  }

  get websiteDialog(): Locator {
    return this.page.getByRole('dialog', { name: 'Edit website profile' });
  }

  async editWebsiteProfile(): Promise<void> {
    await this.card('Public website').getByRole('button', { name: 'Edit website profile' }).click();
    await expect(this.websiteDialog).toBeVisible();
  }

  async fillWebsiteProfile(p: {
    slug?: string;
    tagline?: string;
    about?: string;
    email?: string;
  }): Promise<void> {
    const d = this.websiteDialog;
    if (p.slug !== undefined) await d.getByLabel('Website address').fill(p.slug);
    if (p.tagline !== undefined) await d.getByLabel('Tagline').fill(p.tagline);
    if (p.about !== undefined) await d.getByLabel(/^About/).fill(p.about);
    if (p.email !== undefined) await d.getByLabel(/^Public email/).fill(p.email);
  }

  async saveWebsiteProfile(): Promise<void> {
    await this.websiteDialog.getByRole('button', { name: 'Save website profile' }).click();
  }

  /** What a visitor gets from the public website at an address. */
  async publicSiteStatus(slug: string): Promise<number> {
    return this.page.evaluate(async (slug) => (await fetch(`/api/website/${slug}`)).status, slug);
  }

  /** What the API answers this signed-in person for a settings path. */
  async apiStatus(
    path: string,
    method: 'GET' | 'PUT' = 'GET',
    body: unknown = {},
  ): Promise<number> {
    return this.page.evaluate(
      async ({ path, method, body }) =>
        (
          await fetch(`/api${path}`, {
            method,
            headers: { 'content-type': 'application/json' },
            body: method === 'GET' ? undefined : JSON.stringify(body),
          })
        ).status,
      { path, method, body },
    );
  }
}
