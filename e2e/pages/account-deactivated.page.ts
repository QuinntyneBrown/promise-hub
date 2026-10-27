import { expect, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

/** Account inactive (mock: account-deactivated): access was turned off and sign-in is refused. */
export class AccountDeactivatedPage extends BasePage {
  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1 });
  }

  async expectShown(): Promise<void> {
    await expect(this.page).toHaveURL(/\/account-deactivated$/);
    await expect(this.heading).toHaveText('This account is inactive');
  }

  async backToSignIn(): Promise<void> {
    await this.page.getByRole('link', { name: 'Back to sign in' }).click();
  }
}
