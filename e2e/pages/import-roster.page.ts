import { expect, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

/** Import a roster (mock: import-roster): upload, map columns, review, import. */
export class ImportRosterPage extends BasePage {
  async open(): Promise<void> {
    await super.open('/import');
    await expect(this.heading).toBeVisible();
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1 });
  }

  get step(): Locator {
    return this.page.getByTestId('stepper');
  }

  get errorSummary(): Locator {
    return this.page.getByRole('alert').filter({ hasText: 'Fix' });
  }

  notice(text: string | RegExp): Locator {
    return this.page.getByText(text);
  }

  mapping(column: string): Locator {
    return this.page.getByLabel(`Map ${column}`);
  }

  duplicate(row: number): Locator {
    return this.page
      .getByRole('list', { name: 'Already in PromiseHub' })
      .getByRole('listitem')
      .filter({ hasText: `Row ${row}` });
  }

  needLook(row: number): Locator {
    return this.page
      .getByRole('list', { name: 'Rows that need a look' })
      .getByRole('listitem')
      .filter({ hasText: `Row ${row}` });
  }

  kpi(label: string): Locator {
    return this.page.getByTestId(`kpi-${label}`).getByTestId('stat-value');
  }

  async upload(name: string, content: string | Buffer): Promise<void> {
    await this.page.getByLabel('Choose file').setInputFiles({ name, mimeType: 'text/csv', buffer: Buffer.isBuffer(content) ? content : Buffer.from(content, 'utf-8') });
  }

  async map(column: string, field: string): Promise<void> {
    await this.mapping(column).selectOption({ label: field });
  }

  async enrollIn(program: string): Promise<void> {
    await this.page.getByLabel('Enroll everyone in').selectOption({ label: program });
  }

  async review(): Promise<void> {
    await this.page.getByRole('button', { name: 'Review' }).click();
  }

  async merge(row: number): Promise<void> {
    await this.duplicate(row).getByRole('switch').check();
  }

  async importRows(): Promise<void> {
    await this.page.getByRole('button', { name: /^Import \d+ rows?$/ }).click();
  }
}
