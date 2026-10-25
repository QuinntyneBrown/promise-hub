import { expect, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

/** Sign in (mock: sign-in) and its second step (mock: sign-in/mfa). */
export class SignInPage extends BasePage {
  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1 });
  }

  get email(): Locator {
    return this.page.getByLabel('Work email');
  }

  get password(): Locator {
    return this.page.getByLabel('Password', { exact: true });
  }

  get submit(): Locator {
    return this.page.getByRole('button', { name: 'Sign in' });
  }

  get passwordError(): Locator {
    return this.page.getByTestId('password-error');
  }

  get alert(): Locator {
    return this.page.getByRole('status').filter({ hasText: 'Too many tries' });
  }

  get code(): Locator {
    return this.page.getByLabel('Six-digit code');
  }

  get codeError(): Locator {
    return this.page.getByTestId('code-error');
  }

  async expectShown(): Promise<void> {
    await expect(this.page).toHaveURL(/\/sign-in/);
    await expect(this.email).toBeVisible();
  }

  async signIn(email: string, password: string): Promise<void> {
    await this.email.fill(email);
    await this.password.fill(password);
    await this.submit.click();
  }

  async enterCode(code: string): Promise<void> {
    await expect(this.heading).toHaveText('Enter your code');
    await this.code.fill(code);
    await this.page.getByRole('button', { name: 'Continue' }).click();
  }
}
