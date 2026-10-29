import type { Locator } from '@playwright/test';
import { BasePage } from './base.page';

/** What every public website page shares: the site nav and the site footer around one column (L2-132). Anonymous. */
export abstract class SitePage extends BasePage {
  /** The page's path under /site/{slug}, empty for home. */
  protected abstract readonly path: string;

  async open(slug = 'harbourview'): Promise<void> {
    await super.open(`/site/${slug}${this.path ? `/${this.path}` : ''}`);
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1 });
  }

  get siteNav(): Locator {
    return this.page.getByRole('navigation', { name: 'Site' });
  }

  get footer(): Locator {
    return this.page.getByRole('navigation', { name: 'Footer' });
  }

  /** The organization's name at the top, linking home. */
  get brand(): Locator {
    return this.page.getByRole('banner').getByRole('link').first();
  }

  async goTo(link: 'Programs' | 'About' | 'Get involved' | 'Contact'): Promise<void> {
    await this.siteNav.getByRole('link', { name: link, exact: true }).click();
  }

  async goToFromFooter(link: 'Programs' | 'About' | 'Get involved' | 'Contact' | 'Privacy'): Promise<void> {
    await this.footer.getByRole('link', { name: link, exact: true }).click();
  }

  /** The nav link marked as the current page, if any. */
  get currentNavLink(): Locator {
    return this.siteNav.locator('[aria-current="page"]');
  }

  get signIn(): Locator {
    return this.page.getByRole('banner').getByRole('link', { name: 'Sign in' });
  }

  get apply(): Locator {
    return this.page.getByRole('banner').getByRole('link', { name: 'Apply', exact: true });
  }

  /** The not-found page shown for an unknown address, a suspended organization or Public website off. */
  get notFound(): Locator {
    return this.page.getByRole('heading', { name: 'This page isn’t here' });
  }
}
