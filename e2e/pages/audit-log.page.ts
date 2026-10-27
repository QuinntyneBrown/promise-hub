import { expect, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

/** The audit log (mock: audit-log). */
export class AuditLogPage extends BasePage {
  async open(): Promise<void> {
    await super.open('/settings/audit');
    await expect(this.page.getByRole('heading', { level: 1 })).toBeVisible();
  }

  get table(): Locator {
    return this.page.getByRole('table', { name: 'Audit log' });
  }

  rows(): Locator {
    return this.table.getByRole('row').filter({ hasNot: this.page.getByRole('columnheader') });
  }

  async search(text: string): Promise<void> {
    await this.page.getByRole('main').getByRole('searchbox', { name: 'Search the log' }).fill(text);
  }

  async action(label: string): Promise<void> {
    await this.page.getByLabel('Action').selectOption({ label });
  }

  async period(label: string): Promise<void> {
    await this.page.getByLabel('Period').selectOption({ label });
  }

  get export(): Locator {
    return this.page.getByRole('link', { name: 'Export' });
  }

  emptyHeading(text: string | RegExp): Locator {
    return this.page.getByRole('heading', { name: text });
  }

  get forbidden(): Locator {
    return this.page.getByRole('heading', { name: 'Admins read the audit log' });
  }
}
