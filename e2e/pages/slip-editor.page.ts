import { expect, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

/** The slip editor (mock: slip-editor) with tracking once sent, and the send-now and cancel-send dialogs. */
export class SlipEditorPage extends BasePage {
  async open(eventId: string): Promise<void> {
    await super.open(`/events/${eventId}/slip`);
    await expect(this.heading).toHaveText('Permission slip');
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1 });
  }

  get subtitle(): Locator {
    return this.page.getByTestId('page-subtitle');
  }

  get dialog(): Locator {
    return this.page.getByRole('dialog');
  }

  get errorSummary(): Locator {
    return this.page.getByRole('alert').filter({ hasText: 'Fix' });
  }

  get scheduled(): Locator {
    return this.page.getByRole('status').filter({ hasText: 'Scheduled for' });
  }

  get progress(): Locator {
    return this.page.getByRole('progressbar');
  }

  get responses(): Locator {
    return this.page.getByRole('table', { name: 'Answers by child' }).locator('tbody tr');
  }

  response(child: string): Locator {
    return this.responses.filter({ hasText: child });
  }

  count(label: 'Signed' | 'Declined' | 'Outstanding'): Locator {
    return this.page.getByTestId(`count-${label}`).getByTestId('stat-value');
  }

  fieldError(field: 'title' | 'body' | 'signBy'): Locator {
    return this.page.getByTestId(`${field}-error`);
  }

  notice(text: string): Locator {
    return this.page.getByText(text);
  }

  button(name: string): Locator {
    return this.page.getByRole('button', { name, exact: true });
  }

  async write(values: { title?: string; body?: string; signBy?: string }): Promise<void> {
    if (values.title !== undefined) await this.page.getByLabel('Slip title').fill(values.title);
    if (values.body !== undefined) await this.page.getByLabel('What guardians read before signing').fill(values.body);
    if (values.signBy !== undefined) await this.page.getByLabel('Sign by').fill(values.signBy);
  }

  async when(choice: 'Now' | 'Later' | 'Don’t send yet', at?: string): Promise<void> {
    await this.page
      .getByRole('group', { name: 'When' })
      .getByRole('radio', { name: new RegExp(`^${choice}`) })
      .check();
    if (at) await this.page.getByLabel('Send at').fill(at);
  }

  async markMaterial(): Promise<void> {
    await this.page.getByRole('switch', { name: /material/ }).check();
  }

  async confirm(name: string): Promise<void> {
    await this.dialog.getByRole('button', { name, exact: true }).click();
    await expect(this.dialog).toBeHidden();
  }

  async openReminder(): Promise<void> {
    await this.page.getByRole('button', { name: /^Text \d+ unsigned$/ }).click();
    await expect(this.dialog).toBeVisible();
  }

  reminderFamily(household: string): Locator {
    return this.dialog.getByRole('listitem').filter({ hasText: household });
  }

  async remind(body?: string): Promise<void> {
    if (body !== undefined) await this.dialog.getByLabel('Message').fill(body);
    await this.dialog.getByRole('button', { name: /^Send to / }).click();
  }
}
