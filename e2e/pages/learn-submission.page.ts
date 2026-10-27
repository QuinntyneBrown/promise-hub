import { expect, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

/** A youth's own submission: its status, what she sent, the mentor's feedback and what happened (mock: learn-submission). */
export class LearnSubmissionPage extends BasePage {
  async open(id: string): Promise<void> {
    await super.open(`/learning/submissions/${id}`);
  }

  async expectOpen(title: string): Promise<void> {
    await expect(this.page.getByRole('heading', { level: 1, name: title })).toBeVisible();
  }

  get status(): Locator {
    return this.page.getByTestId('submission-status');
  }

  /** The alert under the title: what happens next, or the mentor's note. */
  alert(title: string): Locator {
    return this.page.locator('ph-alert').filter({ hasText: title });
  }

  get sent(): Locator {
    return this.page.getByRole('region', { name: 'What you sent' });
  }

  get late(): Locator {
    return this.sent.getByText('Late', { exact: true });
  }

  /** The steps of the history, in order. */
  get history(): Locator {
    return this.page.getByRole('list', { name: 'What happened' }).getByRole('listitem');
  }

  points(): Locator {
    return this.page.locator('ph-stat').filter({ hasText: 'Points' });
  }

  get reviseButton(): Locator {
    return this.page.getByRole('link', { name: 'Revise your submission' });
  }

  async revise(): Promise<void> {
    await this.reviseButton.click();
  }

  get openFileLink(): Locator {
    return this.sent.getByRole('link', { name: /^Open / });
  }

  get notFound(): Locator {
    return this.page.getByRole('heading', { name: 'We can’t find that submission' });
  }

  get loadError(): Locator {
    return this.page.getByRole('heading', { name: 'We couldn’t load your submission' });
  }

  async apiStatus(id: string): Promise<number> {
    return this.page.evaluate(async (s) => (await fetch(`/api/learning/submissions/${s}`)).status, id);
  }
}
