import { expect, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

/** Taking a quiz, one question at a time with autosave (mock: learn-quiz) and the submit-quiz dialog. */
export class LearnQuizPage extends BasePage {
  async open(quizId: string): Promise<void> {
    await super.open(`/learning/quizzes/${quizId}/take`);
  }

  /** The question on screen: a group named by its text. */
  question(text: string): Locator {
    return this.page.getByRole('group', { name: text });
  }

  get progress(): Locator {
    return this.page.getByRole('progressbar', { name: 'Quiz progress' });
  }

  get progressText(): Locator {
    return this.page.getByText(/^Question \d+ of \d+$/);
  }

  /** The save status chip: Saving…, Answers saved or Not saved · you’re offline. */
  get saveStatus(): Locator {
    return this.page.getByRole('status').filter({ hasText: /Saving…|Answers saved|Not saved/ });
  }

  option(label: string): Locator {
    return this.page.getByRole('radio', { name: label }).or(this.page.getByRole('checkbox', { name: label }));
  }

  async choose(label: string): Promise<void> {
    await this.option(label).check();
  }

  get shortAnswer(): Locator {
    return this.page.getByRole('textbox', { name: 'Your answer' });
  }

  async write(answer: string): Promise<void> {
    await this.shortAnswer.fill(answer);
  }

  async next(): Promise<void> {
    await this.page.getByRole('button', { name: 'Next' }).click();
  }

  async back(): Promise<void> {
    await this.page.getByRole('button', { name: 'Back' }).click();
  }

  get submitButton(): Locator {
    return this.page.getByRole('button', { name: 'Submit answers' });
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  get dialog(): Locator {
    return this.page.getByRole('dialog', { name: 'Submit your answers?' });
  }

  async confirmSubmit(): Promise<void> {
    await this.dialog.getByRole('button', { name: /^Submit/ }).click();
  }

  async keepReviewing(): Promise<void> {
    await this.dialog.getByRole('button', { name: /Keep reviewing|Go back/ }).click();
  }

  get offlineAlert(): Locator {
    return this.page.getByRole('status').filter({ hasText: 'We’ll save them when you’re back online' });
  }

  get failed(): Locator {
    return this.page.getByRole('alert').filter({ hasText: 'We couldn’t save your answer' });
  }

  get alreadySubmitted(): Locator {
    return this.page.getByRole('heading', { name: 'This attempt is already submitted' });
  }

  get noAttemptsLeft(): Locator {
    return this.page.getByRole('heading', { name: 'No attempts left' });
  }

  async goOffline(): Promise<void> {
    await this.page.context().setOffline(true);
  }

  async goOnline(): Promise<void> {
    await this.page.context().setOffline(false);
  }

  async reload(): Promise<void> {
    await this.page.reload();
  }

  async expectOpen(title: string): Promise<void> {
    await expect(this.page.getByRole('heading', { level: 1, name: title })).toBeVisible();
  }
}
