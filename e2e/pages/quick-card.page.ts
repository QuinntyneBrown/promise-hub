import { expect, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

/** A child's Quick Card (mock: quick-card). */
export class QuickCardPage extends BasePage {
  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1 });
  }

  get alert(): Locator {
    return this.page.getByRole('note', { name: 'Allergy alert' });
  }

  get medical(): Locator {
    return this.page.getByRole('region', { name: 'Medical' });
  }

  get callList(): Locator {
    return this.page.getByRole('list', { name: 'Call, in this order' });
  }

  get pickups(): Locator {
    return this.page.getByRole('list', { name: 'Approved to pick up' });
  }

  get restricted(): Locator {
    return this.page.getByRole('status').filter({ hasText: 'Medical details are hidden for your role' });
  }

  get savedOnPhone(): Locator {
    return this.page.getByTestId('sync-chip');
  }

  get empty(): Locator {
    return this.page.getByRole('heading', { name: 'No medical information yet' });
  }

  callLink(name: string): Locator {
    return this.callList.getByRole('link', { name: new RegExp(`^Call ${name}`) });
  }

  /** The id of the first block after the head: the alert when there is one. */
  async firstBlock(): Promise<string | null> {
    return this.page.getByTestId('quick-card-body').locator(':scope > *').first().getAttribute('data-block');
  }

  async expectShown(name: string): Promise<void> {
    await expect(this.heading).toHaveText(name);
  }
}
