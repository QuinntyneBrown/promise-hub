import { expect, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

/** Staff and roles (mock: staff) with the invite-staff, change-role and remove-staff dialogs. */
export class StaffPage extends BasePage {
  async open(): Promise<void> {
    await super.open('/settings/staff');
    await expect(this.heading).toBeVisible();
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1 });
  }

  get dialog(): Locator {
    return this.page.getByRole('dialog');
  }

  get members(): Locator {
    return this.page.getByRole('list', { name: 'Staff' });
  }

  get invitations(): Locator {
    return this.page.getByRole('list', { name: 'Invitations waiting' });
  }

  member(name: string): Locator {
    return this.members.getByRole('listitem').filter({ hasText: name });
  }

  async invite(email: string, role: string): Promise<void> {
    await this.page.getByRole('button', { name: 'Invite staff' }).click();
    await expect(this.dialog).toBeVisible();
    await this.dialog.getByLabel('Work email').fill(email);
    await this.dialog.getByRole('radio', { name: new RegExp(`^${role}`) }).check();
    await this.dialog.getByRole('button', { name: 'Send invitation' }).click();
  }

  async changeRole(name: string, role: string): Promise<void> {
    await this.member(name).getByRole('button', { name: `Change role for ${name}` }).click();
    await this.dialog.getByRole('radio', { name: new RegExp(`^${role}`) }).check();
    await this.dialog.getByRole('button', { name: 'Change role' }).click();
  }

  async remove(name: string): Promise<void> {
    await this.member(name).getByRole('button', { name: `Remove ${name}` }).click();
    await this.dialog.getByRole('button', { name: 'Remove access' }).click();
  }

  async withdraw(email: string): Promise<void> {
    await this.invitations.getByRole('button', { name: `Withdraw invitation to ${email}` }).click();
  }

  actions(name: string): Locator {
    return this.member(name).getByRole('button');
  }
}
