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
