import { expect, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

/** A person's record (mock: person) with the change-role and deactivate-person dialogs. */
export class PersonPage extends BasePage {
  async open(id: string): Promise<void> {
    await super.open(`/people/${id}`);
    await expect(this.heading).toBeVisible();
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1 });
  }

  get header(): Locator {
    return this.page.locator('ph-page-header');
  }

  card(title: string): Locator {
    return this.page.getByRole('region', { name: title });
  }

  fact(key: string): Locator {
    return this.page.getByTestId(`fact-${key}`);
  }

  get history(): Locator {
    return this.page.getByRole('list', { name: 'Account history' });
  }

  get main(): Locator {
    return this.page.getByRole('main');
  }

  get dialog(): Locator {
    return this.page.getByRole('dialog');
  }

  get toast(): Locator {
    return this.page.getByTestId('toast');
  }

  action(name: string): Locator {
    return this.header.getByRole('button', { name, exact: true });
  }

  async backToPeople(): Promise<void> {
    await this.page.getByRole('navigation', { name: 'Breadcrumb' }).getByRole('link', { name: 'People' }).click();
  }

  async openChildRecord(): Promise<void> {
    await this.page.getByRole('link', { name: 'Open child record' }).click();
  }

  /** The role's radio in the change-role dialog; "Volunteer" never matches "Volunteer coordinator". */
  roleOption(role: string): Locator {
    return this.dialog.getByRole('radio', { name: new RegExp(`^${role}(?! coordinator)`) });
  }

  async openChangeRole(): Promise<void> {
    await this.action('Change role').click();
    await expect(this.dialog).toBeVisible();
  }

  async chooseRole(role: string): Promise<void> {
    await this.roleOption(role).check();
  }

  async confirmRole(): Promise<void> {
    await this.dialog.getByRole('button', { name: 'Change role' }).click();
  }

  async deactivate(): Promise<void> {
    await this.action('Deactivate').click();
    await expect(this.dialog).toBeVisible();
  }

  async confirmDeactivate(): Promise<void> {
    await this.dialog.getByRole('button', { name: 'Deactivate' }).click();
  }

  async reactivate(): Promise<void> {
    await this.action('Reactivate').click();
  }
}
