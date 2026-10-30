import { expect, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

/** The guardian invitation: the sender name and the platform wording previewed per language (mock: learning-bond-invitation). */
export class LearningBondInvitationPage extends BasePage {
  async open(): Promise<void> {
    await super.open('/settings/learning-bond/invitation');
  }

  async expectShown(): Promise<void> {
    await expect(this.page.getByRole('heading', { level: 1 })).toHaveText('Guardian invitation');
  }

  get senderName(): Locator {
    return this.page.getByLabel('Sender name');
  }

  get senderError(): Locator {
    return this.page.getByTestId('sender-name-error');
  }

  /** The previews of one language, as titled on the page: English, Spanish or French. */
  language(name: string): Locator {
    return this.page.getByTestId(`preview-${name.toLowerCase()}`);
  }

  async previewedLanguages(): Promise<string[]> {
    const ids = await this.page.locator('[data-testid^="preview-"]').evaluateAll((cards) => cards.map((c) => c.getAttribute('data-testid')!));
    return ids.map((id) => id.replace('preview-', '')).map((n) => n.charAt(0).toUpperCase() + n.slice(1));
  }

  sms(name: string): Locator {
    return this.language(name).getByTestId('sms-text');
  }

  segments(name: string): Locator {
    return this.language(name).getByTestId('sms-segments');
  }

  emailFooter(name: string): Locator {
    return this.language(name).getByTestId('email-footer');
  }

  async save(): Promise<void> {
    await this.page.getByRole('button', { name: 'Save', exact: true }).click();
  }

  get toast(): Locator {
    return this.page.getByTestId('toast');
  }

  get forbidden(): Locator {
    return this.page.getByRole('heading', { name: 'Admins edit the invitation' });
  }
}
