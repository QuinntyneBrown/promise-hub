import { expect, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

/** At-risk flags (mock: mentor-flags): the mentor's flags on his youth, or every flag for admins and program directors. */
export class AtRiskFlagsPage extends BasePage {
  async open(query = ''): Promise<void> {
    await super.open(`/mentoring/flags${query}`);
  }

  async expectOpen(): Promise<void> {
    await expect(this.page.getByRole('heading', { level: 1, name: 'At-risk flags' })).toBeVisible();
  }

  get items(): Locator {
    return this.page.getByRole('list', { name: /at-risk flags, /i }).getByRole('listitem');
  }

  item(youth: string): Locator {
    return this.items.filter({ hasText: youth });
  }

  tab(name: RegExp): Locator {
    return this.page.getByRole('tab', { name });
  }

  async showResolved(): Promise<void> {
    await this.tab(/^Resolved/).click();
  }

  async showOpen(): Promise<void> {
    await this.tab(/^Open/).click();
  }

  get raiseButton(): Locator {
    return this.page.getByRole('button', { name: 'Raise a flag' });
  }

  async raise(): Promise<void> {
    await this.raiseButton.first().click();
  }

  async resolve(youth: string): Promise<void> {
    await this.item(youth).getByRole('button', { name: 'Resolve' }).click();
  }

  viewRecord(youth: string): Locator {
    return this.item(youth).getByRole('link', { name: 'View record' });
  }

  reportIncident(youth: string): Locator {
    return this.item(youth).getByRole('link', { name: 'Report an incident' });
  }

  get empty(): Locator {
    return this.page.getByRole('heading', { name: 'No youth flagged' });
  }

  get failed(): Locator {
    return this.page.getByRole('heading', {
      name: 'We couldn’t load the at-risk flags',
    });
  }

  get forbidden(): Locator {
    return this.page.getByRole('heading', {
      name: 'At-risk flags are for mentors and program directors',
    });
  }

  async retry(): Promise<void> {
    await this.page.getByRole('button', { name: 'Try again' }).click();
  }

  toast(text: string): Locator {
    return this.page.getByRole('status').filter({ hasText: text });
  }

  async apiStatus(): Promise<number> {
    return this.page.evaluate(async () => (await fetch('/api/mentoring/flags')).status);
  }
}
