import { expect, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

/** Settings › Learning Bond, the hub (mock: settings-learning-bond): the agreement, coverage, invitation and launch cards. */
export class SettingsLearningBondPage extends BasePage {
  async open(): Promise<void> {
    await super.open('/settings/learning-bond');
  }

  async expectShown(): Promise<void> {
    await expect(this.page.getByRole('heading', { level: 1 })).toHaveText('Learning Bond');
  }

  /** A titled card: Data-handling agreement, Coverage, Guardian invitation or Launch. */
  card(title: string): Locator {
    return this.page.getByTestId(`hub-${title.toLowerCase().replace(/[^a-z]+/g, '-')}`);
  }

  /** The value of a fact in a card, such as "Programs" in Coverage. */
  fact(card: string, term: string): Locator {
    return this.card(card)
      .getByTestId(`fact-${term.toLowerCase().replace(/[^a-z]+/g, '-')}`)
      .locator('dd');
  }

  get newVersionBanner(): Locator {
    return this.page.getByTestId('hub-new-version');
  }

  get launchButton(): Locator {
    return this.card('Launch').getByRole('button', { name: 'Launch' });
  }

  link(name: string): Locator {
    return this.page.getByRole('main').getByRole('link', { name });
  }

  /** The Settings section tabs. */
  get tabs(): Locator {
    return this.page.getByRole('navigation', { name: 'Settings sections' });
  }

  get forbidden(): Locator {
    return this.page.getByRole('heading', { name: 'Admins configure Learning Bond' });
  }
}
