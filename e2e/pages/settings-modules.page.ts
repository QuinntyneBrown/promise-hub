import { expect, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

/** Settings › Modules (mock: settings-modules). */
export class SettingsModulesPage extends BasePage {
  async open(): Promise<void> {
    await super.open('/settings/modules');
    await expect(this.page.getByRole('heading', { level: 1, name: 'Modules' })).toBeVisible();
  }

  get list(): Locator {
    return this.page.getByRole('list', { name: 'Modules' });
  }

  get summary(): Locator {
    return this.page.getByTestId('modules-summary');
  }

  get forbidden(): Locator {
    return this.page.getByRole('heading', { name: 'Admins configure modules' });
  }

  get toast(): Locator {
    return this.page.getByTestId('toast');
  }

  toggle(name: string): Locator {
    return this.list.getByRole('switch', { name: `${name} on` });
  }

  /** A module's one-line description. */
  description(name: string): Locator {
    return this.item(name).getByTestId('list-meta');
  }

  private item(name: string): Locator {
    return this.list.getByRole('listitem').filter({ has: this.page.getByTestId('list-title').getByText(name, { exact: true }) });
  }

  /** The dependency caption of a module: every module it needs while it is off, and those still off while it is on. */
  needs(name: string): Locator {
    return this.list.getByRole('listitem').filter({ has: this.page.getByTestId('list-title').getByText(name, { exact: true }) }).getByText(/^Needs /);
  }

  error(name: string): Locator {
    return this.list.getByRole('listitem').filter({ hasText: name }).getByTestId('list-error');
  }

  async moduleNames(): Promise<string[]> {
    return (await this.list.getByTestId('list-title').allInnerTexts()).map((t) => t.trim());
  }

  async set(name: string, on: boolean): Promise<void> {
    await this.toggle(name).setChecked(on);
  }

  async preset(name: string): Promise<void> {
    await this.page.getByRole('group', { name: 'Presets' }).getByRole('button', { name }).click();
  }

  async scrollToTop(): Promise<void> {
    await this.page.getByRole('heading', { level: 1, name: 'Modules' }).scrollIntoViewIfNeeded();
  }

  async save(): Promise<void> {
    await this.page.getByRole('button', { name: 'Save changes' }).click();
  }
}
