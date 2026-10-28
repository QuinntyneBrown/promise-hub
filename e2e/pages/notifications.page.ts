import { expect, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

/** The notification center (mock: notifications): newest first, unread marked, Mark all read. */
export class NotificationsPage extends BasePage {
  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Notifications' });
  }

  get subtitle(): Locator {
    return this.page.getByTestId('page-subtitle');
  }

  get list(): Locator {
    return this.page.getByRole('list', { name: 'Notifications' });
  }

  items(): Locator {
    return this.list.getByRole('listitem');
  }

  /** Any notification whose words include the text. */
  mentioning(text: string): Locator {
    return this.page.getByText(text);
  }

  get empty(): Locator {
    return this.page.getByRole('heading', { name: 'You’re all caught up' });
  }

  async open(): Promise<void> {
    await super.open('/notifications');
    await expect(this.heading).toBeVisible();
  }

  async markAllRead(): Promise<void> {
    await this.page.getByRole('button', { name: 'Mark all read' }).click();
  }

  async openItem(text: string | RegExp): Promise<void> {
    await this.list.getByRole('link', { name: text }).click();
  }
}
