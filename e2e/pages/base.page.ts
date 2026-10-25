import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';

/** Shared behaviour of every screen: navigation and the axe check. */
export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  async open(path: string): Promise<void> {
    await this.page.goto(path);
  }

  get isPhone(): boolean {
    return (this.page.viewportSize()?.width ?? 1024) < 768;
  }

  /** WCAG 2.2 AA via axe on whatever the screen currently shows. */
  async expectAccessible(): Promise<void> {
    // Let layout settle (focus moves, scrolls, toasts) so axe checks the page as it rests, not mid-frame.
    await this.page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
    const results = await new AxeBuilder({ page: this.page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(', ')}`)).toEqual([]);
  }

  async expectNoHorizontalScroll(): Promise<void> {
    const overflow = await this.page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  }
}
