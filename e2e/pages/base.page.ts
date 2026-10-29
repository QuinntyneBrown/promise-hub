import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';

/** Shared behaviour of every screen: navigation and the axe check. */
export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  async open(path: string): Promise<void> {
    await this.page.goto(path);
  }

  /** Starts recording the API paths the page requests from now on, to prove what is never fetched. */
  recordApiPaths(): string[] {
    const paths: string[] = [];
    this.page.on('request', (request) => {
      const url = new URL(request.url());
      if (url.pathname.startsWith('/api/')) paths.push(url.pathname);
    });
    return paths;
  }

  /** The status the API answers a GET from this page's session, to prove an off module answers 404. */
  async apiStatus(path: string): Promise<number> {
    return this.page.evaluate(async (p) => (await fetch(`/api${p}`)).status, path);
  }

  get isPhone(): boolean {
    return (this.page.viewportSize()?.width ?? 1024) < 768;
  }

  /** WCAG 2.2 AA via axe on whatever the screen currently shows. */
  async expectAccessible(): Promise<void> {
    // Let layout settle (focus moves, smooth scrolls, toasts) so axe checks the page as it rests, not mid-frame: wait until the
    // scroll position has held still for a few frames, since a smooth scroll on a slow runner can leave a target half under the top bar.
    await this.page.evaluate(
      () =>
        new Promise<void>((resolve) => {
          let last = -1;
          let still = 0;
          const started = performance.now();
          const tick = () => {
            const y = window.scrollY;
            still = y === last ? still + 1 : 0;
            last = y;
            if (still >= 3 || performance.now() - started > 3000) resolve();
            else requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }),
    );
    const results = await new AxeBuilder({ page: this.page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(', ')}`)).toEqual([]);
  }

  /** How long the current page took to load, in ms from navigation: first contentful paint and DOM interactive (L2-033). */
  async loadTimings(): Promise<{ firstContentfulPaint: number; interactive: number }> {
    return this.page.evaluate(
      () =>
        new Promise<{ firstContentfulPaint: number; interactive: number }>((resolve) => {
          // The paint entry can arrive after the page's heading, so wait for it rather than read it once.
          new PerformanceObserver((list, observer) => {
            const paint = list.getEntriesByName('first-contentful-paint')[0];
            if (!paint) return;
            observer.disconnect();
            const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
            resolve({ firstContentfulPaint: paint.startTime, interactive: navigation.domInteractive });
          }).observe({ type: 'paint', buffered: true });
        }),
    );
  }

  async expectNoHorizontalScroll(): Promise<void> {
    const overflow = await this.page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  }
}
