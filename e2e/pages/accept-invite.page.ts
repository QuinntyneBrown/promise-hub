import { expect, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

/** Accepting a staff invitation (mock: accept-invite) and the onboarding steps (mocks: onboard-staff-phone, onboard-staff-ready). */
export class AcceptInvitePage extends BasePage {
  async open(token: string): Promise<void> {
    await super.open(`/invite/${token}`);
    await expect(this.heading).toBeVisible();
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1 });
  }

  get invitedEmail(): Locator {
    return this.page.getByTestId('invited-email');
  }

  fieldError(field: 'name' | 'password' | 'mobile'): Locator {
    return this.page.getByTestId(`${field}-error`);
  }

  async accept(name: string, password: string): Promise<void> {
    await this.page.getByLabel('Your name').fill(name);
    await this.page.getByLabel('Choose a password').fill(password);
    await this.page.getByRole('button', { name: 'Accept and continue' }).click();
  }

  async savePhone(mobile: string): Promise<void> {
    await this.page.getByLabel('Your mobile').fill(mobile);
    await this.page.getByRole('button', { name: 'Continue' }).click();
  }

  get openCheckIn(): Locator {
    return this.page.getByRole('link', { name: /^Open check-in/ });
  }
}
