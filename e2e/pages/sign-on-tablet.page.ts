import { expect, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

/** Sign on this tablet (mock: sign-on-tablet): a guardian at the door signs on the staff device. */
export class SignOnTabletPage extends BasePage {
  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1 });
  }

  get handTo(): Locator {
    return this.page.getByTestId('page-subtitle');
  }

  get nameError(): Locator {
    return this.page.getByTestId('name-error');
  }

  async expectShown(): Promise<void> {
    await expect(this.heading).toHaveText('Sign on this tablet');
  }

  async sign(name: string): Promise<void> {
    await this.page.getByLabel('Guardian types their full name').fill(name);
    await this.page.getByRole('button', { name: 'Sign', exact: true }).click();
  }
}
