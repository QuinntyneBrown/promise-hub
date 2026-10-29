import type { Locator } from '@playwright/test';
import { SitePage } from './site.page';

/** The public website's about page at /site/{slug}/about (mock: site-about). */
export class SiteAboutPage extends SitePage {
  protected readonly path = 'about';

  get about(): Locator {
    return this.page.getByTestId('site-about');
  }

  findUs(key: 'where' | 'email'): Locator {
    return this.page.getByRole('region', { name: 'Find us' }).getByTestId(`fact-${key}`);
  }

  get promises(): Locator {
    return this.page.getByRole('region', { name: 'Safe, known and cared for' }).getByRole('listitem');
  }
}
