import { expect, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

/** New message (mock: new-message): audience, body, channel, the live recipient count and the SMS preview. */
export class NewMessagePage extends BasePage {
  async open(): Promise<void> {
    await super.open('/messages/new');
    await expect(this.page.getByRole('heading', { level: 1, name: 'New message' })).toBeVisible();
  }

  get recipientCount(): Locator {
    return this.page.getByTestId('recipient-count');
  }

  /** The line under the count: nobody matches, or the SMS cap warning. */
  get countWarning(): Locator {
    return this.page.locator('ph-recipient-count .warning');
  }

  get smsPreview(): Locator {
    return this.page.getByTestId('sms-text');
  }

  get bodyError(): Locator {
    return this.page.getByTestId('body-error');
  }

  get sendButton(): Locator {
    return this.page.getByRole('button', { name: /^Send to / });
  }

  channel(label: RegExp | string): Locator {
    return this.page.getByRole('group', { name: 'Send by' }).getByRole('radio', { name: label });
  }

  alert(title: string): Locator {
    return this.page.getByText(title);
  }

  async audience(label: string): Promise<void> {
    await this.page.getByLabel('Send to').selectOption({ label });
  }

  async language(label: string): Promise<void> {
    await this.page.getByLabel('Language').selectOption({ label });
  }

  async write(text: string): Promise<void> {
    await this.page.getByLabel('Message', { exact: true }).fill(text);
  }

  async sendBy(label: RegExp | string): Promise<void> {
    await this.channel(label).check();
  }

  async expectCount(count: number): Promise<void> {
    await expect(this.recipientCount).toContainText(`${count} guardians`);
  }

  async send(): Promise<void> {
    await this.sendButton.click();
  }
}
