import { expect, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

/** Settings › Notifications (mock: settings-notifications). */
export class SettingsNotificationsPage extends BasePage {
  async open(): Promise<void> {
    await super.open('/settings/notifications');
    await expect(this.page.getByRole('heading', { level: 1, name: 'Notifications' })).toBeVisible();
  }

  get delay(): Locator {
    return this.page.getByLabel('Minutes after start');
  }

  get supervisorEmails(): Locator {
    return this.page.getByRole('switch', { name: 'Email supervisors on new incidents' });
  }

  get cap(): Locator {
    return this.page.getByLabel('Monthly SMS cap (segments)');
  }

  get used(): Locator {
    return this.page.getByText(/this month\. At the cap, texts pause\./);
  }

  get toast(): Locator {
    return this.page.getByTestId('toast');
  }

  get errorSummary(): Locator {
    return this.page.getByRole('alert');
  }

  get forbidden(): Locator {
    return this.page.getByRole('heading', { name: 'Admins configure notifications' });
  }

  get loadError(): Locator {
    return this.page.getByRole('heading', { name: 'We couldn’t load notification settings' });
  }

  async save(): Promise<void> {
    await this.page.getByRole('button', { name: 'Save changes' }).click();
  }
}
