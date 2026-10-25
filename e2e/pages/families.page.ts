import { expect, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

/** Families (mock: families) and the add-family dialog. */
export class FamiliesPage extends BasePage {
  async open(): Promise<void> {
    await super.open('/families');
    await expect(this.page.getByRole('heading', { level: 1, name: 'Families' })).toBeVisible();
  }

  get list(): Locator {
    return this.page.getByRole('list', { name: 'Households' });
  }

  get empty(): Locator {
    return this.page.getByRole('heading', { name: 'No families yet' });
  }

  get noResults(): Locator {
    return this.page.getByRole('heading', { name: 'No families match' });
  }

  get addFamilyButton(): Locator {
    return this.page.getByRole('button', { name: 'Add family' });
  }

  get dialog(): Locator {
    return this.page.getByRole('dialog', { name: 'Add a family' });
  }

  row(name: string): Locator {
    return this.list.getByRole('listitem').filter({ has: this.page.getByText(name, { exact: true }) });
  }

  async householdNames(): Promise<string[]> {
    return (await this.list.getByTestId('list-title').allInnerTexts()).map((t) => t.trim());
  }

  async search(text: string): Promise<void> {
    await this.page.getByRole('searchbox', { name: 'Search families and children' }).fill(text);
  }

  async filter(name: string): Promise<void> {
    await this.page.getByRole('group', { name: 'Filter families' }).getByRole('button', { name: new RegExp(`^${name}`) }).click();
  }

  async openHousehold(name: string): Promise<void> {
    await this.list.getByRole('link', { name: new RegExp(`^${name}`) }).click();
  }

  async startAddFamily(): Promise<void> {
    await this.addFamilyButton.click();
    await expect(this.dialog).toBeVisible();
  }

  async fillFamily(values: { guardianName: string; mobile?: string; email?: string; language?: string }): Promise<void> {
    await this.dialog.getByLabel('Guardian’s name').fill(values.guardianName);
    await this.dialog.getByLabel('Mobile').fill(values.mobile ?? '');
    await this.dialog.getByLabel('Email (optional)').fill(values.email ?? '');
    if (values.language) await this.dialog.getByLabel('Language').selectOption(values.language);
  }

  async submitFamily(): Promise<void> {
    await this.dialog.getByRole('button', { name: 'Add family' }).click();
  }

  fieldError(label: string): Locator {
    return this.dialog.getByTestId(`${label}-error`);
  }
}
