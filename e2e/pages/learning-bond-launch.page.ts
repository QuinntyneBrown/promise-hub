import { expect, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

/** Settings › Learning Bond › Launch (mock: learning-bond-launch): the covered households, how each can be reached, and when to send. */
export class LearningBondLaunchPage extends BasePage {
  async open(): Promise<void> {
    await super.open('/settings/learning-bond/launch');
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1 });
  }

  async expectShown(): Promise<void> {
    await expect(this.heading).toHaveText('Launch');
  }

  /** The value of the count tile with the given label, such as "With a mobile number". */
  count(label: string): Locator {
    return this.page
      .getByTestId('launch-counts')
      .locator('ph-stat', { has: this.page.getByText(label, { exact: true }) })
      .getByTestId('stat-value');
  }

  get missingContacts(): Locator {
    return this.page.getByRole('link', { name: 'View households to collect from' });
  }

  get launchButton(): Locator {
    return this.page.getByRole('button', { name: 'Launch', exact: true });
  }

  /** Why Launch is disabled, beside the button. */
  get launchBlocked(): Locator {
    return this.page.getByTestId('launch-blocked');
  }

  /** Chooses Send invitations on a day, or Staff invite at the door. */
  async choose(how: 'Send invitations on a day' | 'Staff invite at the door'): Promise<void> {
    await this.page.getByRole('radio', { name: how }).check();
  }

  get day(): Locator {
    return this.page.getByLabel('Day', { exact: true });
  }

  async schedule(date: string): Promise<void> {
    await this.choose('Send invitations on a day');
    await this.day.fill(date);
    await this.page.getByRole('button', { name: 'Schedule launch' }).click();
  }

  async changeTheDate(date: string): Promise<void> {
    await this.day.fill(date);
    await this.page.getByRole('button', { name: 'Change the date' }).click();
  }

  async launchAtTheDoor(): Promise<void> {
    await this.choose('Staff invite at the door');
    await this.page.getByRole('button', { name: 'Launch without a mass send' }).click();
  }

  /** The launch as chosen: scheduled (success) or at the door (info). */
  get status(): Locator {
    return this.page.getByTestId('launch-status');
  }

  get dayError(): Locator {
    return this.page.getByTestId('launch-day-error');
  }

  async cancelLaunch(): Promise<void> {
    await this.status.getByRole('button', { name: 'Cancel launch' }).click();
  }

  get cancelDialog(): Locator {
    return this.page.getByRole('dialog', { name: 'Cancel the launch?' });
  }

  async confirmCancel(): Promise<void> {
    await this.cancelDialog.getByRole('button', { name: 'Cancel launch' }).click();
  }

  get toast(): Locator {
    return this.page.getByTestId('toast');
  }

  get forbidden(): Locator {
    return this.page.getByRole('heading', { name: 'Admins launch Learning Bond' });
  }
}
