import { expect, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

/** Your reflection on a lesson: mood, words, one thing she'll do and who can see it (mock: learn-reflection). */
export class LearnReflectionPage extends BasePage {
  async open(lessonId: string): Promise<void> {
    await super.open(`/learning/lessons/${lessonId}/reflection`);
  }

  async expectOpen(lesson: string): Promise<void> {
    await expect(this.page.getByRole('heading', { level: 1, name: `Reflect on ${lesson}` })).toBeVisible();
  }

  get prompts(): Locator {
    return this.page.getByRole('region', { name: 'Think about it' });
  }

  mood(name: string): Locator {
    return this.page.getByRole('group', { name: 'How are you feeling about this lesson?' }).getByRole('radio', { name: new RegExp(`^${name}`) });
  }

  get words(): Locator {
    return this.page.getByRole('textbox', { name: 'Your reflection' });
  }

  get action(): Locator {
    return this.page.getByRole('textbox', { name: /One thing I’ll do this week/ });
  }

  get share(): Locator {
    return this.page.getByRole('switch', { name: /^Share with my mentor/ });
  }

  async write(mood: string, words: string, action = ''): Promise<void> {
    await this.mood(mood).check();
    await this.words.fill(words);
    if (action) await this.action.fill(action);
  }

  async save(): Promise<void> {
    await this.page.getByRole('button', { name: 'Save reflection' }).click();
  }

  async saveDraft(): Promise<void> {
    await this.page.getByRole('button', { name: 'Save draft' }).click();
  }

  async startOver(): Promise<void> {
    await this.page.getByRole('button', { name: 'Start over' }).click();
  }

  /** The alert on the page saying the reflection was saved, by its title. */
  saved(title: string): Locator {
    return this.page.locator('ph-alert').filter({ hasText: title });
  }

  get restored(): Locator {
    return this.page.locator('ph-alert').filter({ hasText: 'We restored your draft' });
  }

  get failed(): Locator {
    return this.page.locator('ph-alert').filter({ hasText: 'We couldn’t save your reflection' });
  }

  toast(text: string): Locator {
    return this.page.getByRole('status').filter({ hasText: text }).first();
  }

  get errorSummary(): Locator {
    return this.page.getByRole('alert').filter({ hasText: 'Fix these to continue' });
  }

  fieldError(text: string): Locator {
    return this.page.getByText(text, { exact: true }).last();
  }

  heading(text: string): Locator {
    return this.page.getByRole('heading', { name: text });
  }

  /** The leave dialog (dialog: leave-reflection). */
  get leaveDialog(): Locator {
    return this.page.getByRole('dialog', { name: 'Leave without saving?' });
  }

  async leaveChoice(name: 'Keep editing' | 'Save draft and leave' | 'Leave without saving'): Promise<void> {
    await this.leaveDialog.getByRole('button', { name }).click();
  }

  /** Follows the breadcrumb back to the lesson, as leaving the page would. */
  async leaveForLesson(lesson: string): Promise<void> {
    await this.page.getByRole('navigation', { name: 'Breadcrumb' }).getByRole('link', { name: lesson }).click();
  }

  /** Reloads the tab and answers whether the browser asked before leaving. */
  async reloadAsksFirst(): Promise<boolean> {
    let asked = false;
    this.page.once('dialog', async (dialog) => {
      asked = dialog.type() === 'beforeunload';
      await dialog.accept();
    });
    await this.page.reload();
    return asked;
  }

  /** Whether a draft for this membership and lesson is kept on the device. */
  async hasDraft(membershipId: string, lessonId: string): Promise<boolean> {
    return this.page.evaluate((key) => localStorage.getItem(key) !== null, `promisehub.reflection-draft.${membershipId}.${lessonId}`);
  }

  async apiStatus(lessonId: string): Promise<number> {
    return this.page.evaluate(async (id) => (await fetch(`/api/learning/lessons/${id}/reflection`)).status, lessonId);
  }
}
