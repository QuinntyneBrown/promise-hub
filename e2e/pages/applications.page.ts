import { expect, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

export type ApplicationStatusTab = 'Waiting review' | 'Waitlisted' | 'Accepted' | 'Declined';

/** The organization's application pipeline (mock: applications): status tabs and one row per application. */
export class ApplicationsPage extends BasePage {
  async open(): Promise<void> {
    await super.open('/applications');
    await expect(this.heading).toBeVisible();
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1 });
  }

  get subtitle(): Locator {
    return this.page.getByTestId('page-subtitle');
  }

  get list(): Locator {
    return this.page.getByRole('list', { name: 'Applications' });
  }

  get rows(): Locator {
    return this.list.getByRole('listitem');
  }

  get emptyState(): Locator {
    return this.page.getByRole('heading', { name: 'You’re all caught up' });
  }

  row(name: string): Locator {
    return this.rows.filter({ hasText: name });
  }

  tab(name: ApplicationStatusTab): Locator {
    return this.page.getByRole('tab', { name: new RegExp(`^${name}`) });
  }

  async show(name: ApplicationStatusTab): Promise<void> {
    await this.tab(name).click();
  }

  async openApplication(name: string): Promise<void> {
    await this.row(name).getByRole('link').click();
  }
}
