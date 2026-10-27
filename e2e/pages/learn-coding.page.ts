import { expect, type FrameLocator, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

/** A coding lesson or project (mocks: learn-coding-lesson, learn-coding-project). */
export class LearnCodingPage extends BasePage {
  async open(id: string): Promise<void> {
    await super.open(`/learning/coding/${id}`);
  }

  async expectOpen(title: string): Promise<void> {
    await expect(this.page.getByRole('heading', { level: 1, name: title })).toBeVisible();
  }

  step(title: string): Locator {
    return this.page.getByRole('region', { name: new RegExp(`^\\d+\\. ${title}$`) });
  }

  sample(title: string): Locator {
    return this.page.getByRole('region', { name: `Example: ${title}` });
  }

  get editor(): Locator {
    return this.page.getByRole('textbox', { name: /^(Try it yourself|Your page)$/ });
  }

  async write(code: string): Promise<void> {
    await this.editor.fill(code);
  }

  async run(): Promise<void> {
    await this.page.getByRole('button', { name: 'Run' }).click();
  }

  get preview(): FrameLocator {
    return this.page.frameLocator('iframe[title="Preview of your page"]');
  }

  item(label: string): Locator {
    return this.page.getByRole('checkbox', { name: label });
  }

  async tick(label: string): Promise<void> {
    await this.item(label).check();
  }

  async saveProgress(): Promise<void> {
    await this.page.getByRole('button', { name: 'Save progress' }).click();
  }

  async saveDraft(): Promise<void> {
    await this.page.getByRole('button', { name: 'Save draft' }).click();
  }

  toast(title: string): Locator {
    return this.page.locator('ph-toast-region').getByText(title);
  }

  get completeAlert(): Locator {
    return this.page.locator('ph-alert').filter({ hasText: 'Lesson complete' });
  }

  get failed(): Locator {
    return this.page.getByText('We couldn’t save your progress');
  }

  locked(prerequisite: string): Locator {
    return this.page.getByRole('heading', { name: `Finish ${prerequisite} first` });
  }

  async apiStatus(id: string): Promise<number> {
    return this.page.evaluate(async (l) => (await fetch(`/api/learning/coding/${l}`)).status, id);
  }

  get brief(): Locator {
    return this.page.getByRole('region', { name: 'The brief' });
  }

  async submitForReview(): Promise<void> {
    await this.page.getByRole('button', { name: 'Submit for review' }).click();
  }

  get dialog(): Locator {
    return this.page.getByRole('dialog');
  }

  async writeNote(note: string): Promise<void> {
    await this.dialog.getByLabel(/Note to your mentor/).fill(note);
  }

  async confirmSubmit(): Promise<void> {
    await this.dialog.getByRole('button', { name: 'Submit for review' }).click();
  }

  get submittedBadge(): Locator {
    return this.page.locator('ph-page-header').getByText('Submitted');
  }

  get sentForReview(): Locator {
    return this.page.locator('ph-alert').filter({ hasText: 'Sent for review' });
  }
}
