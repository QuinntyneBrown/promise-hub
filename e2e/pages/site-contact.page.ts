import type { Locator } from '@playwright/test';
import { SitePage } from './site.page';

/** The public website's contact page at /site/{slug}/contact (mock: site-contact). The page is the form. */
export class SiteContactPage extends SitePage {
  protected readonly path = 'contact';

  async fill(message: { name?: string; email?: string; topic?: string; message?: string }): Promise<void> {
    if (message.name !== undefined) await this.page.getByLabel('Your name').fill(message.name);
    if (message.email !== undefined) await this.page.getByLabel('Email', { exact: true }).fill(message.email);
    if (message.topic !== undefined) await this.page.getByLabel('Topic').selectOption(message.topic);
    if (message.message !== undefined) await this.page.getByLabel('Message', { exact: true }).fill(message.message);
  }

  async send(): Promise<void> {
    await this.page.getByRole('button', { name: 'Send message' }).click();
  }

  get sent(): Locator {
    return this.page.getByRole('heading', { name: 'Message sent' });
  }

  get acknowledgement(): Locator {
    return this.page.getByTestId('empty-state-text');
  }

  /** The inline error under a field, by its label. */
  error(field: 'Your name' | 'Email' | 'Message'): Locator {
    const id = { 'Your name': 'contact-name', Email: 'contact-email', Message: 'contact-message' }[field];
    return this.page.locator(`#${id}-error`);
  }

  get summary(): Locator {
    return this.page.getByText('Fix these to continue');
  }

  get failed(): Locator {
    return this.page.getByText('Your message didn’t send');
  }

  get tooMany(): Locator {
    return this.page.getByText('You’ve sent several messages already');
  }

  findUs(key: 'where' | 'email'): Locator {
    return this.page.getByRole('region', { name: 'Find us' }).getByTestId(`fact-${key}`);
  }

  fieldValue(label: 'Your name' | 'Message'): Locator {
    return this.page.getByLabel(label, { exact: true });
  }
}
