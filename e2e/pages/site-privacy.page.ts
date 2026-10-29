import type { Locator } from '@playwright/test';
import { SitePage } from './site.page';

/** The public website's privacy and safeguarding page at /site/{slug}/privacy (mock: site-privacy). */
export class SitePrivacyPage extends SitePage {
  protected readonly path = 'privacy';

  get sections(): Locator {
    return this.page.getByRole('main').getByRole('heading', { level: 2 });
  }

  get lead(): Locator {
    return this.page.getByTestId('page-subtitle');
  }
}
