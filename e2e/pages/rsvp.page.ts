import { expect, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

/** The RSVP dialog (mock: rsvp), opened from a youth's schedule. */
export class RsvpDialog extends BasePage {
  get dialog(): Locator {
    return this.page.getByRole('dialog', { name: 'RSVP' });
  }

  async expectOpen(): Promise<void> {
    await expect(this.dialog).toBeVisible();
  }

  async expectClosed(): Promise<void> {
    await expect(this.dialog).toHaveCount(0);
  }

  answer(label: 'Yes, I’ll be there' | 'Maybe' | 'Can’t make it'): Locator {
    return this.dialog.getByRole('group', { name: 'Will you be there?' }).getByRole('radio', { name: new RegExp(`^${label}`) });
  }

  get note(): Locator {
    return this.dialog.getByLabel(/^Note for staff/);
  }

  get session(): Locator {
    return this.dialog.getByTestId('rsvp-session');
  }

  async send(): Promise<void> {
    await this.dialog.getByRole('button', { name: 'Send RSVP' }).click();
  }

  async close(): Promise<void> {
    // The footer's button: Cancel, or Close once RSVPs are closed (the header's close button is also named Close).
    await this.dialog.getByRole('button', { name: /^(Cancel|Close)$/ }).last().click();
  }

  get responseError(): Locator {
    return this.dialog.getByRole('group', { name: 'Will you be there?' }).locator('[id$="-error"]');
  }

  get alert(): Locator {
    return this.dialog.getByRole('alert').or(this.dialog.getByRole('status'));
  }
}
