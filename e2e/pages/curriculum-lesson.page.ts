import { expect, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

/** The lesson editor (mock: curriculum-lesson): content, leader notes, status, delete and the lesson video. */
export class CurriculumLessonPage extends BasePage {
  async open(id: string): Promise<void> {
    await super.open(`/curriculum/lessons/${id}`);
  }

  async expectOpen(title: string): Promise<void> {
    await expect(this.page.getByRole('heading', { level: 1, name: new RegExp(`^${title}`) })).toBeVisible();
    await expect(this.title).toHaveValue(title);
  }

  get subtitle(): Locator {
    return this.page.getByTestId('page-subtitle');
  }

  get status(): Locator {
    return this.page.getByTestId('lesson-status');
  }

  get title(): Locator {
    return this.page.getByLabel('Lesson title');
  }

  get reading(): Locator {
    return this.page.getByLabel(/^Reading/);
  }

  get minutes(): Locator {
    return this.page.getByLabel('Estimated minutes');
  }

  get objectives(): Locator {
    return this.page.getByLabel(/^Learning objectives/);
  }

  get body(): Locator {
    return this.page.getByLabel('Teaching content');
  }

  get prompts(): Locator {
    return this.page.getByLabel(/^Reflection prompts/);
  }

  get leaderNotes(): Locator {
    return this.page.getByLabel(/^Leader guide notes/);
  }

  fieldError(id: string): Locator {
    return this.page.getByTestId(`${id}-error`);
  }

  get errorSummary(): Locator {
    return this.page.getByRole('alert').filter({ hasText: 'Fix these to continue' });
  }

  get notFound(): Locator {
    return this.page.getByRole('heading', { name: 'We can’t find that lesson' });
  }

  get toast(): Locator {
    return this.page.getByTestId('toast');
  }

  get dialog(): Locator {
    return this.page.getByRole('dialog');
  }

  async save(): Promise<void> {
    await this.page.getByRole('button', { name: 'Save lesson' }).click();
  }

  async changeStatus(status: 'Draft' | 'Published'): Promise<void> {
    await this.page.getByRole('button', { name: 'Status', exact: true }).click();
    await expect(this.dialog).toBeVisible();
    await this.dialog.getByRole('radio', { name: new RegExp(`^${status}`) }).check();
    await this.dialog.getByRole('button', { name: 'Save status' }).click();
  }

  get statusError(): Locator {
    return this.dialog.getByRole('group', { name: 'Status' }).locator('.error');
  }

  async delete(): Promise<void> {
    await this.page.getByRole('button', { name: 'Delete', exact: true }).click();
    await expect(this.dialog).toBeVisible();
  }

  async confirmDelete(): Promise<void> {
    await this.dialog.getByRole('button', { name: 'Delete lesson' }).click();
  }

  async apiStatus(path: string): Promise<number> {
    return this.page.evaluate(async (p) => (await fetch(p)).status, path);
  }
}
