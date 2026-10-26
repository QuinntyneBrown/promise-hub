import { expect, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

/** The platform admin's organizations list (mocks: organizations, add-organization, suspend-organization). */
export class OrganizationsPage extends BasePage {
  async open(): Promise<void> {
    await super.open('/admin/organizations');
    await expect(this.page.getByRole('heading', { level: 1 })).toBeVisible();
  }

  get table(): Locator {
    return this.page.getByRole('table', { name: 'Organizations' });
  }

  rows(): Locator {
    return this.table.getByRole('row').filter({ hasNot: this.page.getByRole('columnheader') });
  }

  row(name: string): Locator {
    return this.rows().filter({ hasText: name });
  }

  async search(text: string): Promise<void> {
    await this.page.getByRole('main').getByRole('searchbox', { name: 'Find an organization' }).fill(text);
  }

  async filter(label: string | RegExp): Promise<void> {
    await this.page.getByRole('group', { name: 'Filter organizations' }).getByRole('button', { name: label }).click();
  }

  async add(details: { name: string; email: string; plan?: string; modules?: string }): Promise<void> {
    await this.page.getByRole('button', { name: 'Add organization' }).first().click();
    const dialog = this.dialog;
    await dialog.getByLabel('Organization name').fill(details.name);
    await dialog.getByLabel('First admin’s email').fill(details.email);
    if (details.plan) await dialog.getByLabel('Plan').selectOption({ label: details.plan });
    if (details.modules) await dialog.getByLabel('Modules').selectOption({ label: details.modules });
    await dialog.getByRole('button', { name: 'Create and invite' }).click();
  }

  async suspend(name: string, reason: string): Promise<void> {
    await this.row(name).getByRole('button', { name: `Suspend ${name}` }).click();
    await this.dialog.getByRole('radio', { name: reason }).check();
    await this.dialog.getByRole('button', { name: 'Suspend' }).click();
  }

  async reinstate(name: string): Promise<void> {
    await this.row(name).getByRole('button', { name: `Reinstate ${name}` }).click();
  }

  get dialog(): Locator {
    return this.page.getByRole('dialog');
  }

  fieldError(text: string): Locator {
    return this.dialog.getByText(text);
  }

  emptyHeading(text: string | RegExp): Locator {
    return this.page.getByRole('heading', { name: text });
  }

  get forbidden(): Locator {
    return this.page.getByRole('heading', { name: 'Platform admins only' });
  }
}
