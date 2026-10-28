import { expect, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

/** Your account › Profile (mock: settings-profile): the name and mobile of this membership, the email and role shown read-only. */
export class ProfilePage extends BasePage {
  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Profile' });
  }

  async open(): Promise<void> {
    await super.open('/account/profile');
    await expect(this.heading).toBeVisible();
  }

  get name(): Locator {
    return this.page.getByLabel('Name', { exact: true });
  }

  get email(): Locator {
    return this.page.getByLabel('Email', { exact: true });
  }

  get mobile(): Locator {
    return this.page.getByLabel(/^Mobile/);
  }

  get managed(): Locator {
    return this.page.getByRole('region', { name: /^Set by / });
  }

  helpFor(field: 'name' | 'email' | 'mobile'): Locator {
    return this.page.getByTestId(`${field}-help`);
  }

  async save(name: string | null, mobile: string | null): Promise<void> {
    if (name !== null) await this.name.fill(name);
    if (mobile !== null) await this.mobile.fill(mobile);
    await this.page.getByRole('button', { name: 'Save changes' }).click();
  }

  fieldError(field: 'name' | 'mobile'): Locator {
    return this.page.locator(`#${field}-error`);
  }

  get summary(): Locator {
    return this.page.getByRole('alert').filter({ hasText: 'Fix these to continue' });
  }

  get saved(): Locator {
    return this.page.getByRole('status').getByText('Profile saved');
  }

  get failed(): Locator {
    return this.page.getByRole('alert').filter({ hasText: 'That didn’t go through' });
  }

  get loadError(): Locator {
    return this.page.getByRole('heading', { name: 'We couldn’t load your profile' });
  }

  async back(): Promise<void> {
    await this.page.getByRole('link', { name: 'Your account' }).click();
  }
}
