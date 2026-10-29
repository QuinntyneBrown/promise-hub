import { expect, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

/** Your account › Display (mock: settings-display): theme, text size and reduce motion, previewed at once and saved with the account. */
export class DisplayPage extends BasePage {
  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Display' });
  }

  async open(): Promise<void> {
    await super.open('/account/display');
    await expect(this.heading).toBeVisible();
  }

  theme(name: 'System' | 'Light' | 'Dark'): Locator {
    return this.page.getByRole('group', { name: 'Theme' }).getByRole('radio', { name: new RegExp(`^${name}(\\s|$)`) });
  }

  textSize(name: 'Default' | 'Large' | 'Larger'): Locator {
    return this.page
      .getByRole('group', { name: 'Text size' })
      .getByRole('radio', { name: new RegExp(`^${name}(\\s|$)`) });
  }

  get reduceMotion(): Locator {
    return this.page.getByRole('switch', { name: 'Reduce motion' });
  }

  async save(): Promise<void> {
    await this.page.getByRole('button', { name: 'Save changes' }).click();
  }

  async cancel(): Promise<void> {
    await this.page.getByRole('link', { name: 'Cancel' }).click();
  }

  get saved(): Locator {
    return this.page.getByRole('status').getByText('Display saved');
  }

  get failed(): Locator {
    return this.page.getByRole('alert').filter({ hasText: 'That didn’t go through' });
  }

  /** The document root, which carries data-theme, data-text-size and data-motion. */
  get root(): Locator {
    return this.page.locator('html');
  }

  /** The root's computed font size in pixels. */
  async rootFontSize(): Promise<number> {
    return this.page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).fontSize));
  }
}
