import { expect, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

/** The staff shell: top bar, phone tab bar, More menu and skip link. */
export class ShellPage extends BasePage {
  get topNav(): Locator {
    return this.page.getByRole('navigation', { name: 'Primary', exact: true });
  }

  get tabBar(): Locator {
    return this.page.getByRole('navigation', { name: 'Primary, phone' });
  }

  get menu(): Locator {
    return this.page.getByRole('dialog', { name: 'Menu' });
  }

  get primaryNavigation(): Locator {
    return this.isPhone ? this.tabBar : this.topNav;
  }

  async visibleNavigationLabels(): Promise<string[]> {
    const items = this.primaryNavigation.locator('a:visible, button:visible');
    return (await items.allInnerTexts()).map((t) => t.trim());
  }

  async openMenu(): Promise<void> {
    await this.primaryNavigation.getByRole('button', { name: 'More' }).click();
    await expect(this.menu).toBeVisible();
  }

  async menuLabels(): Promise<string[]> {
    return (await this.menu.getByRole('link').allInnerTexts()).map((t) => t.trim());
  }

  async menuIdentity(): Promise<string> {
    return (await this.menu.getByTestId('menu-identity').innerText()).replace(/\s+/g, ' ').trim();
  }

  async closeMenuWithEscape(): Promise<void> {
    await this.page.keyboard.press('Escape');
    await expect(this.menu).toBeHidden();
  }

  async goToFromMenu(label: string): Promise<void> {
    await this.menu.getByRole('link', { name: label }).click();
  }

  async accountButtonName(): Promise<string | null> {
    return this.page.getByRole('button', { name: /^Account menu for/ }).getAttribute('aria-label');
  }

  async skipToContent(): Promise<void> {
    await this.page.keyboard.press('Tab');
    const skip = this.page.getByRole('link', { name: 'Skip to content' });
    await expect(skip).toBeFocused();
    await skip.press('Enter');
  }

  async expectMainFocused(): Promise<void> {
    await expect(this.page.locator('main')).toBeFocused();
  }
}
