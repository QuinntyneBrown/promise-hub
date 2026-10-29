import type { Locator } from '@playwright/test';
import { SitePage } from './site.page';

/** The public website's programs and open cohorts at /site/{slug}/programs (mock: site-programs). */
export class SiteProgramsPage extends SitePage {
  protected readonly path = 'programs';

  private get cohorts(): Locator {
    return this.page.getByRole('region', { name: 'Cohorts you can join' });
  }

  /** The program cards, by their names. */
  get programs(): Locator {
    return this.cohorts.getByRole('heading', { level: 3 });
  }

  /** A fact of a program's card, such as When, Who, Runs, Learning track or Lead mentor. */
  fact(program: string, key: 'when' | 'who' | 'runs' | 'track' | 'mentor'): Locator {
    return this.cohorts.getByRole('article', { name: program }).getByTestId(`fact-${key}`);
  }

  status(program: string): Locator {
    return this.cohorts.getByRole('article', { name: program }).locator('ph-badge');
  }

  applyTo(program: string): Locator {
    return this.cohorts.getByRole('link', { name: `Apply to ${program}` });
  }

  closed(program: string): Locator {
    return this.cohorts.getByRole('article', { name: program }).getByText('Enrollment is closed for now');
  }

  get tracks(): Locator {
    return this.page.getByRole('region', { name: 'Learning tracks' }).getByRole('heading', { level: 3 });
  }

  /** A track's modules, in order. */
  modules(track: string): Locator {
    return this.page.getByRole('region', { name: 'Learning tracks' }).getByRole('article', { name: track }).getByRole('listitem');
  }

  get mentorship(): Locator {
    return this.page.getByRole('region', { name: 'You’re never on your own' });
  }

  get nothingOpen(): Locator {
    return this.page.getByRole('heading', { name: 'No programs are open right now' });
  }

  get loadFailed(): Locator {
    return this.page.getByRole('heading', { name: 'We couldn’t load our programs' });
  }
}
