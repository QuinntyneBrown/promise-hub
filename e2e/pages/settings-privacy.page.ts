import { expect, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

/** Settings › Privacy and data (mock: settings-privacy). */
export class SettingsPrivacyPage extends BasePage {
  async open(): Promise<void> {
    await super.open('/settings/privacy');
    await expect(this.page.getByRole('heading', { level: 1 })).toBeVisible();
  }

  get region(): Locator {
    return this.page.getByTestId('fact-region');
  }

  retention(label: string): Locator {
    return this.page.getByRole('radio', { name: label });
  }

  async save(): Promise<void> {
    await this.page.getByRole('button', { name: 'Save retention' }).click();
  }

  get toast(): Locator {
    return this.page.getByTestId('toast');
  }

  get forbidden(): Locator {
    return this.page.getByRole('heading', { name: 'Admins set privacy' });
  }

  get loadError(): Locator {
    return this.page.getByRole('heading', { name: 'We couldn’t load privacy settings' });
  }
}
