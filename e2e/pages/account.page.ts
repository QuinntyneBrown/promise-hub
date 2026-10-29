import { expect, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

/** Your account (mock: account), the recovery-codes dialog and the sign-out-all dialog. */
export class AccountPage extends BasePage {
  async open(): Promise<void> {
    await super.open('/account');
    await expect(this.page.getByRole('heading', { level: 1, name: 'Your account' })).toBeVisible();
  }

  get profile(): Locator {
    return this.page.getByRole('region', { name: 'Profile' });
  }

  get twoStep(): Locator {
    return this.page.getByRole('region', { name: 'Two-step sign-in' });
  }

  get password(): Locator {
    return this.page.getByRole('region', { name: 'Password' });
  }

  get display(): Locator {
    return this.page.getByRole('region', { name: 'Display' });
  }

  async editProfile(): Promise<void> {
    await this.page.getByRole('link', { name: 'Edit profile' }).click();
  }

  async changeDisplay(): Promise<void> {
    await this.page.getByRole('link', { name: 'Change display' }).click();
  }

  async chooseNotifications(): Promise<void> {
    await this.page.getByRole('link', { name: 'Choose notifications' }).click();
  }

  /** Opens the change-password dialog and fills it; `submit` presses Change password. */
  async changePassword(current: string, password: string, repeat = password): Promise<void> {
    await this.page.getByRole('button', { name: 'Change password' }).click();
    await this.dialog.getByLabel('Current password').fill(current);
    await this.dialog.getByLabel('New password').fill(password);
    await this.dialog.getByLabel('Repeat it').fill(repeat);
    await this.dialog.getByRole('button', { name: 'Change password' }).click();
  }

  passwordError(field: 'current' | 'password' | 'repeat'): Locator {
    return this.dialog.locator(`#${field}-error`);
  }

  get passwordFailed(): Locator {
    return this.dialog.getByRole('alert').filter({ hasText: 'That didn’t go through' });
  }

  get dialog(): Locator {
    return this.page.getByRole('dialog');
  }

  async makeRecoveryCodes(): Promise<void> {
    await this.page.getByRole('button', { name: 'Make new recovery codes' }).click();
    await this.dialog.getByRole('button', { name: 'Make new codes' }).click();
  }

  get codes(): Locator {
    return this.dialog.getByRole('list', { name: 'Recovery codes' }).getByRole('listitem');
  }

  async closeCodes(): Promise<void> {
    await this.dialog.getByRole('button', { name: 'I’ve saved them' }).click();
    await expect(this.dialog).toBeHidden();
  }

  async signOutEverywhereElse(): Promise<void> {
    await this.page.getByRole('button', { name: 'Sign out everywhere else' }).click();
    await this.dialog.getByRole('button', { name: 'Sign out other devices' }).click();
  }

  get toast(): Locator {
    return this.page.getByTestId('toast');
  }

  async openFromAccountMenu(): Promise<void> {
    await this.page.getByRole('banner').getByRole('button', { name: /^Account menu for/ }).click();
    await this.page.getByRole('menuitem', { name: 'Your account' }).click();
    await expect(this.page.getByRole('heading', { level: 1, name: 'Your account' })).toBeVisible();
  }
}
