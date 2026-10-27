import { expect, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

/** A reading or scripture lesson (mocks: learn-lesson, learn-lesson-scripture). */
export class LearnLessonPage extends BasePage {
  async open(id: string): Promise<void> {
    await super.open(`/learning/lessons/${id}`);
  }

  async expectOpen(title: string): Promise<void> {
    await expect(this.page.getByRole('heading', { level: 1, name: title })).toBeVisible();
  }

  get teaching(): Locator {
    return this.page.getByRole('region', { name: 'The lesson' });
  }

  get objectives(): Locator {
    return this.page.getByRole('region', { name: 'What you’ll learn' });
  }

  get passage(): Locator {
    return this.page.getByRole('blockquote');
  }

  async passageFontSize(): Promise<number> {
    return this.passage.locator('p').evaluate((p) => parseFloat(getComputedStyle(p).fontSize));
  }

  async larger(): Promise<void> {
    await this.page.getByRole('button', { name: 'A+ larger text' }).click();
  }

  async smaller(): Promise<void> {
    await this.page.getByRole('button', { name: 'A− smaller text' }).click();
  }

  async markComplete(): Promise<void> {
    await this.page.getByRole('button', { name: 'Mark complete' }).click();
  }

  get completed(): Locator {
    return this.page.getByRole('status').filter({ hasText: 'Lesson complete' }).first();
  }

  get completeAlert(): Locator {
    return this.page.locator('ph-alert').filter({ hasText: 'Lesson complete' });
  }

  async next(): Promise<void> {
    await this.completeAlert.getByRole('link', { name: /^Next: / }).click();
  }

  get failed(): Locator {
    return this.page.getByText('We couldn’t save that. Try again.');
  }

  locked(prerequisite: string): Locator {
    return this.page.getByRole('heading', { name: `Finish ${prerequisite} first` });
  }

  get notFound(): Locator {
    return this.page.getByRole('heading', { name: 'We can’t find that lesson' });
  }

  async apiStatus(id: string): Promise<number> {
    return this.page.evaluate(async (l) => (await fetch(`/api/learning/lessons/${l}`)).status, id);
  }
}
