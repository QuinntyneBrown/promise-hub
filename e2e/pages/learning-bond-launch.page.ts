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

  get forbidden(): Locator {
    return this.page.getByRole('heading', { name: 'Admins launch Learning Bond' });
  }
}
