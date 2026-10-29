import type { Locator } from '@playwright/test';
import { SitePage } from './site.page';

/** The public website's home at /site/{slug} (mock: site-landing). */
export class SiteLandingPage extends SitePage {
  protected readonly path = '';

  get tagline(): Locator {
    return this.page.getByTestId('page-subtitle');
  }

  /** The four steps, by their headings. */
  get steps(): Locator {
    return this.page.getByRole('region', { name: 'From first visit to first day' }).getByRole('heading', { level: 3 });
  }

  /** A count of what the organization runs, by its label. */
  stat(label: string): Locator {
    return this.page.getByRole('region', { name: 'What we run' }).getByText(label, { exact: true });
  }

  statValue(label: string): Locator {
    return this.page.getByRole('region', { name: 'What we run' }).locator('ph-stat').filter({ hasText: label }).getByTestId('stat-value');
  }

  /** The program cards under Open now, by their names. */
  get openPrograms(): Locator {
    return this.page.getByRole('region', { name: 'Programs taking applications' }).getByRole('heading', { level: 3 });
  }

  applyTo(program: string): Locator {
    return this.page.getByRole('region', { name: 'Programs taking applications' }).getByRole('link', { name: `Apply to ${program}` });
  }

  get nothingOpen(): Locator {
    return this.page.getByRole('heading', {
      name: 'No programs are open right now',
    });
  }

  get contactUs(): Locator {
    return this.page.getByRole('link', { name: 'Contact us' });
  }

  get loadFailed(): Locator {
    return this.page.getByRole('heading', {
      name: 'We couldn’t load our programs',
    });
  }

  async tryAgain(): Promise<void> {
    await this.page.getByRole('button', { name: 'Try again' }).click();
  }

  async seePrograms(): Promise<void> {
    await this.page.getByRole('main').getByRole('link', { name: 'See programs' }).click();
  }
}
