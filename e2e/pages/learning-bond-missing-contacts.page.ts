import { expect, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

/** The covered households with no mobile number or email (mock: learning-bond-launch, state missing-contacts). */
export class LearningBondMissingContactsPage extends BasePage {
  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1 });
  }

  async expectShown(): Promise<void> {
    await expect(this.heading).toHaveText('Households to collect from');
  }

  get list(): Locator {
    return this.page.getByRole('list', { name: 'Households to collect from' });
  }

  household(name: string): Locator {
    return this.list.getByRole('listitem').filter({ hasText: name });
  }
}
