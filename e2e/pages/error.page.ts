import type { Locator } from '@playwright/test';
import { BasePage } from './base.page';

/** The full-page errors: not found, forbidden, server error, offline and maintenance. */
export class ErrorPage extends BasePage {
  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1 });
  }

  get message(): Locator {
    return this.page.getByTestId('empty-state-text');
  }

  action(name: string): Locator {
    return this.page.getByRole('main').getByRole('link', { name }).or(this.page.getByRole('main').getByRole('button', { name }));
  }
}
